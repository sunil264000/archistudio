-- Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL DEFAULT '',
  user_name TEXT NOT NULL DEFAULT '',
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  course_title TEXT NOT NULL DEFAULT '',
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  lesson_title TEXT,
  issue_text TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can insert their own tickets
CREATE POLICY "Users can create support tickets"
  ON public.support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own tickets
CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins (service role) can do everything
CREATE POLICY "Service role full access"
  ON public.support_tickets FOR ALL
  TO service_role
  USING (true);

-- Create index for fast admin queries
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);

-- Create Supabase Storage bucket for screenshots (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-screenshots', 'support-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload screenshots
CREATE POLICY "Users can upload support screenshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'support-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policy: anyone can view screenshots (admin needs to view them)  
CREATE POLICY "Public read support screenshots"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'support-screenshots');
