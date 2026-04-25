-- ============================================
-- ARCHI STUDIO MARKETPLACE — Phase 1 schema
-- ============================================

-- 1. WORKER PROFILES
CREATE TABLE public.worker_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  headline TEXT,
  bio TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  experience_level TEXT NOT NULL DEFAULT 'beginner' CHECK (experience_level IN ('beginner','intermediate','advanced')),
  hourly_rate NUMERIC(10,2),
  availability TEXT DEFAULT 'available' CHECK (availability IN ('available','busy','unavailable')),
  avatar_url TEXT,
  cover_url TEXT,
  location TEXT,
  languages TEXT[] DEFAULT '{}',
  total_jobs_completed INTEGER NOT NULL DEFAULT 0,
  total_earnings NUMERIC(12,2) NOT NULL DEFAULT 0,
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Worker profiles are viewable by everyone"
  ON public.worker_profiles FOR SELECT USING (true);

CREATE POLICY "Users can create their own worker profile"
  ON public.worker_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own worker profile"
  ON public.worker_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own worker profile"
  ON public.worker_profiles FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_worker_profiles_user_id ON public.worker_profiles(user_id);
CREATE INDEX idx_worker_profiles_skills ON public.worker_profiles USING GIN(skills);

-- 2. PORTFOLIO ITEMS
CREATE TABLE public.worker_portfolio_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  cover_image_url TEXT,
  file_urls TEXT[] NOT NULL DEFAULT '{}',
  external_link TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.worker_portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Portfolio items are viewable by everyone"
  ON public.worker_portfolio_items FOR SELECT USING (true);

CREATE POLICY "Workers can manage their own portfolio items"
  ON public.worker_portfolio_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.worker_profiles wp WHERE wp.id = worker_id AND wp.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.worker_profiles wp WHERE wp.id = worker_id AND wp.user_id = auth.uid())
  );

CREATE INDEX idx_portfolio_worker_id ON public.worker_portfolio_items(worker_id);

-- 3. MARKETPLACE JOBS
CREATE TABLE public.marketplace_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  skills_required TEXT[] NOT NULL DEFAULT '{}',
  budget_type TEXT NOT NULL DEFAULT 'fixed' CHECK (budget_type IN ('fixed','range','hourly')),
  budget_min NUMERIC(10,2),
  budget_max NUMERIC(10,2),
  currency TEXT NOT NULL DEFAULT 'INR',
  deadline DATE,
  attachments TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','cancelled','closed')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private')),
  proposals_count INTEGER NOT NULL DEFAULT 0,
  views_count INTEGER NOT NULL DEFAULT 0,
  awarded_proposal_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open public jobs are viewable by everyone"
  ON public.marketplace_jobs FOR SELECT
  USING (visibility = 'public' OR client_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can create their own jobs"
  ON public.marketplace_jobs FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their own jobs"
  ON public.marketplace_jobs FOR UPDATE
  USING (auth.uid() = client_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can delete their own jobs"
  ON public.marketplace_jobs FOR DELETE
  USING (auth.uid() = client_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_jobs_client_id ON public.marketplace_jobs(client_id);
CREATE INDEX idx_jobs_status ON public.marketplace_jobs(status);
CREATE INDEX idx_jobs_category ON public.marketplace_jobs(category);
CREATE INDEX idx_jobs_created_at ON public.marketplace_jobs(created_at DESC);

-- 4. JOB PROPOSALS
CREATE TABLE public.job_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.marketplace_jobs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL,
  bid_amount NUMERIC(10,2) NOT NULL,
  delivery_days INTEGER NOT NULL,
  cover_message TEXT NOT NULL,
  attachments TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, worker_id)
);

ALTER TABLE public.job_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers see own proposals; clients see proposals on their jobs"
  ON public.job_proposals FOR SELECT
  USING (
    auth.uid() = worker_id
    OR EXISTS (SELECT 1 FROM public.marketplace_jobs j WHERE j.id = job_id AND j.client_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Workers can submit proposals"
  ON public.job_proposals FOR INSERT WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Workers update own proposal; clients can accept/reject"
  ON public.job_proposals FOR UPDATE
  USING (
    auth.uid() = worker_id
    OR EXISTS (SELECT 1 FROM public.marketplace_jobs j WHERE j.id = job_id AND j.client_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Workers can withdraw their own proposal"
  ON public.job_proposals FOR DELETE USING (auth.uid() = worker_id);

CREATE INDEX idx_proposals_job_id ON public.job_proposals(job_id);
CREATE INDEX idx_proposals_worker_id ON public.job_proposals(worker_id);

-- Auto-increment proposals_count
CREATE OR REPLACE FUNCTION public.update_job_proposals_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.marketplace_jobs SET proposals_count = proposals_count + 1 WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.marketplace_jobs SET proposals_count = GREATEST(proposals_count - 1, 0) WHERE id = OLD.job_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_proposals_count
AFTER INSERT OR DELETE ON public.job_proposals
FOR EACH ROW EXECUTE FUNCTION public.update_job_proposals_count();

-- 5. CONTRACTS
CREATE TABLE public.marketplace_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.marketplace_jobs(id) ON DELETE RESTRICT,
  proposal_id UUID NOT NULL REFERENCES public.job_proposals(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL,
  worker_id UUID NOT NULL,
  agreed_amount NUMERIC(10,2) NOT NULL,
  platform_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  platform_fee_amount NUMERIC(10,2) NOT NULL,
  worker_payout NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  delivery_days INTEGER NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'awaiting_payment' CHECK (status IN ('awaiting_payment','active','delivered','revision_requested','completed','disputed','cancelled','refunded')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','held_in_escrow','released','refunded')),
  payment_reference TEXT,
  delivered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contract parties and admins can view"
  ON public.marketplace_contracts FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = worker_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients create contracts they own"
  ON public.marketplace_contracts FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Contract parties can update; admins override"
  ON public.marketplace_contracts FOR UPDATE
  USING (auth.uid() = client_id OR auth.uid() = worker_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_contracts_client_id ON public.marketplace_contracts(client_id);
CREATE INDEX idx_contracts_worker_id ON public.marketplace_contracts(worker_id);
CREATE INDEX idx_contracts_status ON public.marketplace_contracts(status);

-- 6. MESSAGES
CREATE TABLE public.marketplace_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.marketplace_contracts(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT NOT NULL,
  attachments TEXT[] NOT NULL DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contract parties can view messages"
  ON public.marketplace_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_contracts c
      WHERE c.id = contract_id AND (c.client_id = auth.uid() OR c.worker_id = auth.uid())
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Contract parties can send messages"
  ON public.marketplace_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND EXISTS (
      SELECT 1 FROM public.marketplace_contracts c
      WHERE c.id = contract_id AND (c.client_id = auth.uid() OR c.worker_id = auth.uid())
    )
  );

CREATE POLICY "Senders can update read status"
  ON public.marketplace_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_contracts c
      WHERE c.id = contract_id AND (c.client_id = auth.uid() OR c.worker_id = auth.uid())
    )
  );

CREATE INDEX idx_messages_contract_id ON public.marketplace_messages(contract_id);
CREATE INDEX idx_messages_created_at ON public.marketplace_messages(created_at DESC);

-- 7. REVIEWS
CREATE TABLE public.marketplace_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.marketplace_contracts(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  reviewee_id UUID NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('client_to_worker','worker_to_client')),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contract_id, direction)
);

ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
  ON public.marketplace_reviews FOR SELECT USING (true);

CREATE POLICY "Contract parties can create reviews"
  ON public.marketplace_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id AND EXISTS (
      SELECT 1 FROM public.marketplace_contracts c
      WHERE c.id = contract_id
        AND c.status = 'completed'
        AND (
          (direction = 'client_to_worker' AND c.client_id = auth.uid() AND c.worker_id = reviewee_id)
          OR (direction = 'worker_to_client' AND c.worker_id = auth.uid() AND c.client_id = reviewee_id)
        )
    )
  );

CREATE INDEX idx_reviews_reviewee ON public.marketplace_reviews(reviewee_id);
CREATE INDEX idx_reviews_contract ON public.marketplace_reviews(contract_id);

-- Recalc worker average rating after a client→worker review
CREATE OR REPLACE FUNCTION public.update_worker_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.direction = 'client_to_worker' THEN
    UPDATE public.worker_profiles wp
    SET
      total_reviews = (
        SELECT COUNT(*) FROM public.marketplace_reviews r
        WHERE r.reviewee_id = wp.user_id AND r.direction = 'client_to_worker'
      ),
      average_rating = COALESCE((
        SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.marketplace_reviews r
        WHERE r.reviewee_id = wp.user_id AND r.direction = 'client_to_worker'
      ), 0),
      updated_at = now()
    WHERE wp.user_id = NEW.reviewee_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_worker_rating
AFTER INSERT ON public.marketplace_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_worker_rating();

-- 8. DISPUTES
CREATE TABLE public.marketplace_disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.marketplace_contracts(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  evidence_urls TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','under_review','resolved_client','resolved_worker','resolved_split','closed')),
  resolution_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contract parties and admins can view disputes"
  ON public.marketplace_disputes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_contracts c
      WHERE c.id = contract_id AND (c.client_id = auth.uid() OR c.worker_id = auth.uid())
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Contract parties can open disputes"
  ON public.marketplace_disputes FOR INSERT
  WITH CHECK (
    auth.uid() = opened_by AND EXISTS (
      SELECT 1 FROM public.marketplace_contracts c
      WHERE c.id = contract_id AND (c.client_id = auth.uid() OR c.worker_id = auth.uid())
    )
  );

CREATE POLICY "Only admins can update disputes"
  ON public.marketplace_disputes FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_disputes_contract ON public.marketplace_disputes(contract_id);
CREATE INDEX idx_disputes_status ON public.marketplace_disputes(status);

-- 9. updated_at triggers (reuse existing public.update_updated_at_column)
CREATE TRIGGER trg_worker_profiles_updated_at BEFORE UPDATE ON public.worker_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_portfolio_updated_at BEFORE UPDATE ON public.worker_portfolio_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_jobs_updated_at BEFORE UPDATE ON public.marketplace_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_proposals_updated_at BEFORE UPDATE ON public.job_proposals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_contracts_updated_at BEFORE UPDATE ON public.marketplace_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_disputes_updated_at BEFORE UPDATE ON public.marketplace_disputes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. STORAGE BUCKET for marketplace files (portfolios, attachments, messages)
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace-uploads', 'marketplace-uploads', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Marketplace uploads are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'marketplace-uploads');

CREATE POLICY "Authenticated users can upload to their own marketplace folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'marketplace-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own marketplace files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'marketplace-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own marketplace files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'marketplace-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );