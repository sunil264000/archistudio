
-- Create storage bucket for ebook PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ebook-files', 'ebook-files', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Only authenticated users who purchased can download
CREATE POLICY "Purchased users can download ebooks"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ebook-files' 
  AND (
    -- Admins can access all
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    -- Users who purchased can access
    EXISTS (
      SELECT 1 FROM public.ebook_purchases ep
      WHERE ep.user_id = auth.uid() 
      AND ep.status = 'completed'
      AND (
        ep.is_full_bundle = true
        OR (storage.foldername(name))[1]::uuid = ANY(ep.ebook_ids)
      )
    )
  )
);

-- Admins can upload ebooks
CREATE POLICY "Admins can upload ebooks"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ebook-files'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can delete ebooks
CREATE POLICY "Admins can delete ebooks"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ebook-files'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
