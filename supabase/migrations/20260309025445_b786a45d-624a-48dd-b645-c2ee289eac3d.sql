
-- Job Queue system
CREATE TABLE IF NOT EXISTS public.job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 5,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_job_queue_pending ON public.job_queue(status, priority, scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_job_queue_type ON public.job_queue(job_type);

ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage job_queue" ON public.job_queue FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Feature Flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  description TEXT,
  rollout_percentage INTEGER DEFAULT 100,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read feature_flags" ON public.feature_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage feature_flags" ON public.feature_flags FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Portfolio Analytics
CREATE TABLE IF NOT EXISTS public.portfolio_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL,
  viewer_id UUID,
  viewer_ip TEXT,
  page_viewed TEXT,
  time_spent_seconds INTEGER DEFAULT 0,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_portfolio_views_portfolio ON public.portfolio_views(portfolio_id, created_at DESC);

ALTER TABLE public.portfolio_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Portfolio owners read views" ON public.portfolio_views FOR SELECT TO authenticated USING (
  portfolio_id IN (SELECT id FROM public.portfolios WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Anyone can insert portfolio_views" ON public.portfolio_views FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Learning Paths
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'BookOpen',
  color TEXT DEFAULT '#6366f1',
  is_published BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published paths" ON public.learning_paths FOR SELECT TO authenticated USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage learning_paths" ON public.learning_paths FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.learning_path_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID REFERENCES public.learning_paths(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER DEFAULT 0,
  UNIQUE(path_id, course_id)
);

ALTER TABLE public.learning_path_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read path_courses" ON public.learning_path_courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage path_courses" ON public.learning_path_courses FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Notification Templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  channels TEXT[] DEFAULT '{in_app}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage templates" ON public.notification_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- System Metrics for monitoring
CREATE TABLE IF NOT EXISTS public.system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  tags JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_system_metrics_name ON public.system_metrics(metric_name, recorded_at DESC);

ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read metrics" ON public.system_metrics FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Performance indexes on existing tables
CREATE INDEX IF NOT EXISTS idx_sheet_reviews_created ON public.sheet_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_topics_created ON public.forum_topics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_user ON public.progress(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read);
