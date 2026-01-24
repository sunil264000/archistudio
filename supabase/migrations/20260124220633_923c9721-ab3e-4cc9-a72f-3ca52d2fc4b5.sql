-- Create storage bucket for cached ebook previews
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ebook-previews', 'ebook-previews', true, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to previews (they're limited pages anyway)
CREATE POLICY "Public read access for ebook previews"
ON storage.objects FOR SELECT
USING (bucket_id = 'ebook-previews');

-- Allow service role to upload previews
CREATE POLICY "Service role can upload ebook previews"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ebook-previews');

-- Allow service role to update previews
CREATE POLICY "Service role can update ebook previews"
ON storage.objects FOR UPDATE
USING (bucket_id = 'ebook-previews');

-- Add column to track cached preview URL
ALTER TABLE public.ebooks 
ADD COLUMN IF NOT EXISTS preview_url TEXT;

-- Add column to track when preview was generated
ALTER TABLE public.ebooks 
ADD COLUMN IF NOT EXISTS preview_generated_at TIMESTAMPTZ;