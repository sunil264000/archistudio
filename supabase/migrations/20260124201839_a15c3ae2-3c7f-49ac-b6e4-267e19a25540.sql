-- Create storage bucket for course thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-thumbnails', 'course-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to thumbnails
CREATE POLICY "Public can view course thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-thumbnails');

-- Allow service role to upload/delete thumbnails
CREATE POLICY "Service role can manage thumbnails"
ON storage.objects FOR ALL
USING (bucket_id = 'course-thumbnails')
WITH CHECK (bucket_id = 'course-thumbnails');