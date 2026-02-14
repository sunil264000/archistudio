
-- Table to track video migration from Google Drive to LuluStream
CREATE TABLE public.video_migrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  original_url TEXT NOT NULL,
  lulustream_file_code TEXT,
  lulustream_embed_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.video_migrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage migrations" ON public.video_migrations
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_video_migrations_status ON public.video_migrations(status);
CREATE INDEX idx_video_migrations_lesson_id ON public.video_migrations(lesson_id);
