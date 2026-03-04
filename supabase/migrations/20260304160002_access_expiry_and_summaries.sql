-- Add course access duration (null = lifetime access)
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS access_duration_days INTEGER DEFAULT NULL;

-- Add expires_at column to enrollments table
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;

-- Add admin_daily_summaries table
CREATE TABLE IF NOT EXISTS public.admin_daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_text TEXT NOT NULL,
  new_enrollments INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  new_tickets INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS: only service role can access
ALTER TABLE public.admin_daily_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on summaries"
  ON public.admin_daily_summaries FOR ALL
  TO service_role USING (true);

-- Create index for date-based queries
CREATE INDEX IF NOT EXISTS idx_enrollments_expires_at ON public.enrollments(expires_at) 
  WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_courses_access_duration ON public.courses(access_duration_days) 
  WHERE access_duration_days IS NOT NULL;
