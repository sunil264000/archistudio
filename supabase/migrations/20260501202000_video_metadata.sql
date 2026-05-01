-- Add video enhancements to lessons
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS chapters JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS hls_url TEXT;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_lessons_hls_url ON public.lessons(hls_url);
