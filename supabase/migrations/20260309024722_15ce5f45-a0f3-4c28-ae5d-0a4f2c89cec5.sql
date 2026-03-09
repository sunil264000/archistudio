
-- System Errors table for self-healing
CREATE TABLE IF NOT EXISTS public.system_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,
  error_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  resolution_note TEXT,
  auto_fix_attempted BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage system_errors" ON public.system_errors FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Platform Events table (event bus)
CREATE TABLE IF NOT EXISTS public.platform_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  actor_id UUID,
  payload JSONB DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_platform_events_type ON public.platform_events(event_type);
CREATE INDEX idx_platform_events_unprocessed ON public.platform_events(processed) WHERE processed = false;

ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage platform_events" ON public.platform_events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert events" ON public.platform_events FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

-- Activity Feed
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  target_title TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activity_feed_created ON public.activity_feed(created_at DESC);

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read activity_feed" ON public.activity_feed FOR SELECT TO authenticated USING (true);
CREATE POLICY "System inserts activity_feed" ON public.activity_feed FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins manage activity_feed" ON public.activity_feed FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Moderation Queue
CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  content_preview TEXT,
  reported_by UUID,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage moderation_queue" ON public.moderation_queue FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can report content" ON public.moderation_queue FOR INSERT TO authenticated WITH CHECK (reported_by = auth.uid());

-- User Rate Limits
CREATE TABLE IF NOT EXISTS public.user_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, action_type)
);

ALTER TABLE public.user_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own rate_limits" ON public.user_rate_limits FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage rate_limits" ON public.user_rate_limits FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime on activity_feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_events;
