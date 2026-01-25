-- Create live_activity table for realtime tracking
CREATE TABLE IF NOT EXISTS public.live_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('viewing', 'purchase_attempt', 'page_visit', 'video_play')),
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  page_url TEXT,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_ping TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for fast queries
CREATE INDEX idx_live_activity_user ON public.live_activity(user_id);
CREATE INDEX idx_live_activity_session ON public.live_activity(session_id);
CREATE INDEX idx_live_activity_type ON public.live_activity(activity_type);
CREATE INDEX idx_live_activity_last_ping ON public.live_activity(last_ping);
CREATE INDEX idx_live_activity_course ON public.live_activity(course_id);

-- Enable RLS
ALTER TABLE public.live_activity ENABLE ROW LEVEL SECURITY;

-- Only admins can read all activity, users can write their own
CREATE POLICY "Users can insert their own activity"
ON public.live_activity FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity"
ON public.live_activity FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity"
ON public.live_activity FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_activity;

-- Create purchase_attempts table for tracking checkout attempts
CREATE TABLE IF NOT EXISTS public.purchase_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  amount DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'payment_started', 'completed', 'failed', 'abandoned')),
  session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_purchase_attempts_user ON public.purchase_attempts(user_id);
CREATE INDEX idx_purchase_attempts_course ON public.purchase_attempts(course_id);
CREATE INDEX idx_purchase_attempts_status ON public.purchase_attempts(status);
CREATE INDEX idx_purchase_attempts_created ON public.purchase_attempts(created_at);

-- Enable RLS
ALTER TABLE public.purchase_attempts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own attempts"
ON public.purchase_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own attempts"
ON public.purchase_attempts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all attempts"
ON public.purchase_attempts FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_attempts;