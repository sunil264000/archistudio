-- =============================================
-- ARCHISTUDIO ACCESS CONTROL, LOGIN GIFT & EMI SYSTEM
-- Phase 1: Database Schema
-- =============================================

-- 1. LOGIN GIFT CAMPAIGN TABLES
-- =============================================

-- Gift campaign configuration (admin-controlled)
CREATE TABLE public.login_gift_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  eligible_users TEXT DEFAULT 'all' CHECK (eligible_users IN ('all', 'new_only', 'random_percent')),
  random_percent INTEGER CHECK (random_percent IS NULL OR (random_percent >= 1 AND random_percent <= 100)),
  access_duration_hours INTEGER, -- NULL = until campaign end
  cta_text TEXT DEFAULT 'Start Learning',
  custom_messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Courses included in campaign
CREATE TABLE public.login_gift_campaign_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.login_gift_campaigns(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, course_id)
);

-- Track who received gift (prevent repeat popups)
CREATE TABLE public.login_gift_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.login_gift_campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  claimed_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  shown_message TEXT,
  UNIQUE(campaign_id, user_id)
);

-- 2. EMI/PARTIAL PAYMENT TABLES
-- =============================================

-- Course EMI configuration (per course)
CREATE TABLE public.course_emi_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_emi_enabled BOOLEAN DEFAULT false,
  min_first_payment_percent INTEGER DEFAULT 25 CHECK (min_first_payment_percent >= 10 AND min_first_payment_percent <= 100),
  max_splits INTEGER DEFAULT 3 CHECK (max_splits >= 1 AND max_splits <= 6),
  early_payment_discount_percent NUMERIC(4,2) DEFAULT 2.00,
  payment_tiers JSONB DEFAULT '[]'::jsonb,
  -- Example: [{"percent": 25, "module_order_indices": [1,2], "label": "Unlock Foundations"}]
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Track partial payments
CREATE TABLE public.emi_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  installment_number INTEGER NOT NULL CHECK (installment_number >= 1),
  total_installments INTEGER NOT NULL CHECK (total_installments >= 1),
  amount_paid NUMERIC NOT NULL CHECK (amount_paid >= 0),
  total_course_price NUMERIC NOT NULL,
  remaining_amount NUMERIC NOT NULL CHECK (remaining_amount >= 0),
  unlocked_percent INTEGER NOT NULL CHECK (unlocked_percent >= 0 AND unlocked_percent <= 100),
  payment_id TEXT,
  gateway_order_id TEXT,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue', 'cancelled')),
  early_discount_applied NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id, installment_number)
);

-- 3. MODULE-LEVEL ACCESS TRACKING
-- =============================================

-- Granular access at module level (for partial unlocks, gifts, etc.)
CREATE TABLE public.user_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  access_type TEXT DEFAULT 'emi' CHECK (access_type IN ('full', 'emi', 'gift', 'launch_free')),
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  emi_payment_id UUID REFERENCES public.emi_payments(id) ON DELETE SET NULL,
  gift_claim_id UUID REFERENCES public.login_gift_claims(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- 4. LAUNCH FREE COURSES
-- =============================================

CREATE TABLE public.launch_free_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ, -- NULL = lifetime free
  is_active BOOLEAN DEFAULT true,
  auto_enroll_all BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.login_gift_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_gift_campaign_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_gift_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_emi_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emi_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.launch_free_courses ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES
-- =============================================

-- Login Gift Campaigns (admin manages, public views active)
CREATE POLICY "Admins can manage gift campaigns"
  ON public.login_gift_campaigns FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active campaigns"
  ON public.login_gift_campaigns FOR SELECT
  USING (is_active = true AND start_at <= now() AND end_at >= now());

-- Login Gift Campaign Courses
CREATE POLICY "Admins can manage campaign courses"
  ON public.login_gift_campaign_courses FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view campaign courses"
  ON public.login_gift_campaign_courses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.login_gift_campaigns c
    WHERE c.id = campaign_id AND c.is_active = true
  ));

-- Login Gift Claims
CREATE POLICY "Admins can manage all claims"
  ON public.login_gift_claims FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own claims"
  ON public.login_gift_claims FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own claims"
  ON public.login_gift_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Course EMI Settings (admin manages, public reads)
CREATE POLICY "Admins can manage EMI settings"
  ON public.course_emi_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view EMI settings"
  ON public.course_emi_settings FOR SELECT
  USING (true);

-- EMI Payments
CREATE POLICY "Admins can manage all EMI payments"
  ON public.emi_payments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own EMI payments"
  ON public.emi_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own EMI payments"
  ON public.emi_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending EMI payments"
  ON public.emi_payments FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- User Module Access
CREATE POLICY "Admins can manage all module access"
  ON public.user_module_access FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own module access"
  ON public.user_module_access FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own module access"
  ON public.user_module_access FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Launch Free Courses
CREATE POLICY "Admins can manage launch free courses"
  ON public.launch_free_courses FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active launch free courses"
  ON public.launch_free_courses FOR SELECT
  USING (is_active = true);

-- 7. TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE TRIGGER update_login_gift_campaigns_updated_at
  BEFORE UPDATE ON public.login_gift_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_emi_settings_updated_at
  BEFORE UPDATE ON public.course_emi_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emi_payments_updated_at
  BEFORE UPDATE ON public.emi_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_launch_free_courses_updated_at
  BEFORE UPDATE ON public.launch_free_courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_gift_campaigns_active_dates ON public.login_gift_campaigns(is_active, start_at, end_at);
CREATE INDEX idx_gift_claims_user ON public.login_gift_claims(user_id);
CREATE INDEX idx_gift_claims_campaign ON public.login_gift_claims(campaign_id);
CREATE INDEX idx_emi_payments_user_course ON public.emi_payments(user_id, course_id);
CREATE INDEX idx_emi_payments_status ON public.emi_payments(status);
CREATE INDEX idx_emi_payments_due_date ON public.emi_payments(due_date) WHERE status = 'pending';
CREATE INDEX idx_user_module_access_user ON public.user_module_access(user_id);
CREATE INDEX idx_user_module_access_course ON public.user_module_access(course_id);
CREATE INDEX idx_launch_free_courses_active ON public.launch_free_courses(is_active, start_at, end_at);