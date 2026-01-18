-- Create private storage bucket for course videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-videos', 
  'course-videos', 
  false,
  524288000, -- 500MB limit per file
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
);

-- Create storage bucket for lesson resources (PDFs, etc)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'lesson-resources', 
  'lesson-resources', 
  false,
  52428800 -- 50MB limit
);

-- RLS: Only admins can upload videos
CREATE POLICY "Admins can upload course videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-videos' 
  AND public.has_role(auth.uid(), 'admin')
);

-- RLS: Only admins can update/delete videos
CREATE POLICY "Admins can manage course videos"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'course-videos' 
  AND public.has_role(auth.uid(), 'admin')
);

-- RLS: Enrolled users can view videos (via signed URLs from edge function)
CREATE POLICY "Enrolled users can view course videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-videos'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM enrollments e
      JOIN modules m ON m.course_id = e.course_id
      JOIN lessons l ON l.module_id = m.id
      WHERE e.user_id = auth.uid()
      AND e.status = 'active'
      AND l.video_url LIKE '%' || name || '%'
    )
  )
);

-- Similar policies for lesson resources
CREATE POLICY "Admins can upload lesson resources"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lesson-resources' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can manage lesson resources"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'lesson-resources' 
  AND public.has_role(auth.uid(), 'admin')
);