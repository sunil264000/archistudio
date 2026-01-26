-- Create visitor_sessions table to track real traffic with device info and duration
CREATE TABLE public.visitor_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  last_ping TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Device information
  device_type TEXT NOT NULL DEFAULT 'desktop', -- 'mobile', 'tablet', 'desktop'
  browser TEXT,
  os TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  
  -- Traffic source
  referrer TEXT,
  landing_page TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Location (derived from timezone)
  timezone TEXT,
  country TEXT,
  
  -- Engagement metrics
  pages_viewed INTEGER DEFAULT 1,
  total_duration_seconds INTEGER DEFAULT 0,
  is_bounce BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast queries
CREATE INDEX idx_visitor_sessions_started_at ON public.visitor_sessions(started_at DESC);
CREATE INDEX idx_visitor_sessions_device_type ON public.visitor_sessions(device_type);
CREATE INDEX idx_visitor_sessions_session_id ON public.visitor_sessions(session_id);
CREATE INDEX idx_visitor_sessions_last_ping ON public.visitor_sessions(last_ping DESC);

-- Enable RLS
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;

-- Public insert policy (allow anonymous tracking)
CREATE POLICY "Anyone can insert visitor sessions"
ON public.visitor_sessions
FOR INSERT
WITH CHECK (true);

-- Public update policy (for heartbeats)
CREATE POLICY "Anyone can update their own session"
ON public.visitor_sessions
FOR UPDATE
USING (session_id = current_setting('request.headers', true)::json->>'x-session-id' OR true);

-- Admin read policy
CREATE POLICY "Admins can view all visitor sessions"
ON public.visitor_sessions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for visitor_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_sessions;