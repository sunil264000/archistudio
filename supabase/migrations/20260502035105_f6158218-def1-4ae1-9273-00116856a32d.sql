
-- Add missing column for course downloadable resource link
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS resource_link text;

-- Add missing per-user flash sale expiry (used by MAY2026 campaign)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS flash_sale_expires_at timestamptz;

-- Create the course_resource_requests table
CREATE TABLE IF NOT EXISTS public.course_resource_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_course_resource_requests_user ON public.course_resource_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_course_resource_requests_course ON public.course_resource_requests(course_id);
CREATE INDEX IF NOT EXISTS idx_course_resource_requests_status ON public.course_resource_requests(status);

ALTER TABLE public.course_resource_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own resource requests" ON public.course_resource_requests;
CREATE POLICY "Users can view their own resource requests"
ON public.course_resource_requests FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can create their own resource requests" ON public.course_resource_requests;
CREATE POLICY "Users can create their own resource requests"
ON public.course_resource_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update resource requests" ON public.course_resource_requests;
CREATE POLICY "Admins can update resource requests"
ON public.course_resource_requests FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete resource requests" ON public.course_resource_requests;
CREATE POLICY "Admins can delete resource requests"
ON public.course_resource_requests FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_course_resource_requests_updated_at ON public.course_resource_requests;
CREATE TRIGGER update_course_resource_requests_updated_at
BEFORE UPDATE ON public.course_resource_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
