-- =========================================================
-- STUDIO HUB upgrade: profile photos + escrow + deliverables
-- =========================================================

-- 1. Profile photo on the main profiles table (idempotent)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Extend contracts with admin-controlled escrow workflow
ALTER TABLE public.marketplace_contracts
  ADD COLUMN IF NOT EXISTS client_files TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS worker_submission JSONB,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_approved_by UUID,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS released_to_client_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_released_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_reference TEXT;

-- Replace the existing CHECK constraint to add the new state
ALTER TABLE public.marketplace_contracts
  DROP CONSTRAINT IF EXISTS marketplace_contracts_status_check;
ALTER TABLE public.marketplace_contracts
  ADD CONSTRAINT marketplace_contracts_status_check
  CHECK (status IN (
    'awaiting_payment','active','submitted','awaiting_admin_review',
    'delivered','revision_requested','completed','disputed','cancelled','refunded'
  ));

-- 3. Deliverables table
CREATE TABLE IF NOT EXISTS public.studio_hub_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.marketplace_contracts(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL,
  client_id UUID NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  file_urls TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review','approved','rejected','released_to_client')),
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_hub_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deliverables: parties + admins can read"
  ON public.studio_hub_deliverables FOR SELECT
  USING (
    auth.uid() = worker_id
    OR (auth.uid() = client_id AND status = 'released_to_client')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Deliverables: worker can submit own"
  ON public.studio_hub_deliverables FOR INSERT
  WITH CHECK (
    auth.uid() = worker_id
    AND EXISTS (
      SELECT 1 FROM public.marketplace_contracts c
      WHERE c.id = contract_id AND c.worker_id = auth.uid()
    )
  );

CREATE POLICY "Deliverables: worker can update own pending"
  ON public.studio_hub_deliverables FOR UPDATE
  USING (auth.uid() = worker_id AND status = 'pending_review')
  WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Deliverables: admins can update any"
  ON public.studio_hub_deliverables FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_deliverables_contract ON public.studio_hub_deliverables(contract_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_worker ON public.studio_hub_deliverables(worker_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_status ON public.studio_hub_deliverables(status);

CREATE TRIGGER trg_deliverables_updated_at
  BEFORE UPDATE ON public.studio_hub_deliverables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Payouts table
CREATE TABLE IF NOT EXISTS public.studio_hub_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.marketplace_contracts(id) ON DELETE RESTRICT,
  worker_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  fee_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  method TEXT NOT NULL DEFAULT 'upi' CHECK (method IN ('upi','bank','other')),
  reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  admin_notes TEXT,
  created_by UUID,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_hub_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payouts: worker + admins can read"
  ON public.studio_hub_payouts FOR SELECT
  USING (auth.uid() = worker_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Payouts: only admins can insert"
  ON public.studio_hub_payouts FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Payouts: only admins can update"
  ON public.studio_hub_payouts FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_payouts_worker ON public.studio_hub_payouts(worker_id);
CREATE INDEX IF NOT EXISTS idx_payouts_contract ON public.studio_hub_payouts(contract_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.studio_hub_payouts(status);

CREATE TRIGGER trg_payouts_updated_at
  BEFORE UPDATE ON public.studio_hub_payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Storage bucket for admin-controlled deliverables (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('studio-hub-deliverables', 'studio-hub-deliverables', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Studio Hub deliverables: parties + admins can read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'studio-hub-deliverables'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.studio_hub_deliverables d
        JOIN public.marketplace_contracts c ON c.id = d.contract_id
        WHERE d.status = 'released_to_client'
          AND c.client_id = auth.uid()
          AND name = ANY (d.file_urls)
      )
    )
  );

CREATE POLICY "Studio Hub deliverables: members upload own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'studio-hub-deliverables'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Studio Hub deliverables: members update own files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'studio-hub-deliverables'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Studio Hub deliverables: members delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'studio-hub-deliverables'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 6. Public profile photos: add an avatars storage path inside the existing public bucket
-- Reuse the existing public 'portfolio-uploads' bucket — no new bucket needed for avatars
-- (clients upload avatars via the marketplace-uploads bucket which is already public).

-- 7. Helpful index for member discovery
CREATE INDEX IF NOT EXISTS idx_worker_profiles_active_rating
  ON public.worker_profiles(is_active, average_rating DESC);