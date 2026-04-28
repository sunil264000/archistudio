
-- =============================================================
-- Studio Hub: milestones, deliverables, webhook log, chat UX, demo seeding
-- =============================================================

-- ---------- Column additions ----------
ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS years_experience integer,
  ADD COLUMN IF NOT EXISTS portfolio_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_hours integer,
  ADD COLUMN IF NOT EXISTS tools text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS featured_titles text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.marketplace_jobs
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

ALTER TABLE public.marketplace_reviews
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

ALTER TABLE public.marketplace_contracts
  ADD COLUMN IF NOT EXISTS escrow_total_funded numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS escrow_total_released numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_worker_profiles_is_demo ON public.worker_profiles(is_demo);
CREATE INDEX IF NOT EXISTS idx_marketplace_jobs_is_demo ON public.marketplace_jobs(is_demo);

-- ---------- Milestones ----------
CREATE TABLE IF NOT EXISTS public.marketplace_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.marketplace_contracts(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  title text NOT NULL,
  description text,
  amount numeric NOT NULL CHECK (amount > 0),
  due_date date,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','submitted','approved','released','rejected','cancelled')),
  released_amount numeric NOT NULL DEFAULT 0,
  payout_reference text,
  released_at timestamptz,
  released_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contract_id, sequence)
);
CREATE INDEX IF NOT EXISTS idx_milestones_contract ON public.marketplace_milestones(contract_id);

ALTER TABLE public.marketplace_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contract parties can view milestones"
  ON public.marketplace_milestones FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_contracts c
      WHERE c.id = contract_id
        AND (c.client_id = auth.uid() OR c.worker_id = auth.uid())
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Client can create milestones"
  ON public.marketplace_milestones FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.marketplace_contracts c
      WHERE c.id = contract_id AND c.client_id = auth.uid()
    )
  );

CREATE POLICY "Client and admin can update milestones"
  ON public.marketplace_milestones FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_contracts c
      WHERE c.id = contract_id AND c.client_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admin can delete milestones"
  ON public.marketplace_milestones FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_milestones_updated_at
  BEFORE UPDATE ON public.marketplace_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- Deliverables (per-milestone, versioned) ----------
CREATE TABLE IF NOT EXISTS public.marketplace_deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.marketplace_contracts(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES public.marketplace_milestones(id) ON DELETE SET NULL,
  worker_id uuid NOT NULL,
  version integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  notes text,
  file_urls text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review','approved','rejected','revision_requested','released_to_client')),
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_deliverables_contract ON public.marketplace_deliverables(contract_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_milestone ON public.marketplace_deliverables(milestone_id);

ALTER TABLE public.marketplace_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contract parties can view deliverables"
  ON public.marketplace_deliverables FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_contracts c
      WHERE c.id = contract_id
        AND (c.client_id = auth.uid() OR c.worker_id = auth.uid())
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Worker can submit deliverables"
  ON public.marketplace_deliverables FOR INSERT TO authenticated
  WITH CHECK (
    worker_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.marketplace_contracts c
      WHERE c.id = contract_id AND c.worker_id = auth.uid()
    )
  );

CREATE POLICY "Admin can update deliverables"
  ON public.marketplace_deliverables FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_deliverables_updated_at
  BEFORE UPDATE ON public.marketplace_deliverables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- Cashfree webhook audit log ----------
CREATE TABLE IF NOT EXISTS public.cashfree_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  order_id text,
  signature_valid boolean NOT NULL DEFAULT false,
  raw_payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  processing_error text,
  contract_id uuid,
  received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cf_webhook_order ON public.cashfree_webhook_events(order_id);
CREATE INDEX IF NOT EXISTS idx_cf_webhook_received ON public.cashfree_webhook_events(received_at DESC);

ALTER TABLE public.cashfree_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read webhook events"
  ON public.cashfree_webhook_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ---------- Read receipts ----------
CREATE TABLE IF NOT EXISTS public.marketplace_message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.marketplace_contracts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contract_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_msg_reads_contract ON public.marketplace_message_reads(contract_id);

ALTER TABLE public.marketplace_message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties read receipts"
  ON public.marketplace_message_reads FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_contracts c
      WHERE c.id = contract_id
        AND (c.client_id = auth.uid() OR c.worker_id = auth.uid())
    )
  );

CREATE POLICY "Users upsert own receipt"
  ON public.marketplace_message_reads FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own receipt"
  ON public.marketplace_message_reads FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ---------- Typing indicators ----------
CREATE TABLE IF NOT EXISTS public.marketplace_typing_indicators (
  contract_id uuid NOT NULL REFERENCES public.marketplace_contracts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_typing boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contract_id, user_id)
);

ALTER TABLE public.marketplace_typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties view typing"
  ON public.marketplace_typing_indicators FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_contracts c
      WHERE c.id = contract_id
        AND (c.client_id = auth.uid() OR c.worker_id = auth.uid())
    )
  );

CREATE POLICY "Users upsert own typing"
  ON public.marketplace_typing_indicators FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own typing"
  ON public.marketplace_typing_indicators FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_milestones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_deliverables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_message_reads;
