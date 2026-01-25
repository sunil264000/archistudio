-- Add new roles to the enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'uploader';

-- Create email_logs table to track all sent emails
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  metadata JSONB,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity_history table for historical records
CREATE TABLE IF NOT EXISTS public.activity_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  activity_type TEXT NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  page_url TEXT,
  duration_seconds INTEGER,
  metadata JSONB,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_history ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for email_logs
CREATE POLICY "Admins can manage email logs"
ON public.email_logs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin-only policies for activity_history
CREATE POLICY "Admins can view activity history"
ON public.activity_history
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert activity history"
ON public.activity_history
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON public.email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_history_user ON public.activity_history(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_history_type ON public.activity_history(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_history_date ON public.activity_history(created_at DESC);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_history;