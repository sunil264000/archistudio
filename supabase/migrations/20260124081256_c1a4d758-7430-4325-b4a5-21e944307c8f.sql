-- Create import activity log table
CREATE TABLE public.import_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  course_title TEXT NOT NULL,
  folder_id TEXT NOT NULL,
  folder_name TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'import',
  modules_count INTEGER DEFAULT 0,
  lessons_count INTEGER DEFAULT 0,
  resources_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  performed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.import_activity_log ENABLE ROW LEVEL SECURITY;

-- Admin can view all logs
CREATE POLICY "Admins can view all import logs"
ON public.import_activity_log
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can insert logs
CREATE POLICY "Admins can insert import logs"
ON public.import_activity_log
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can delete logs
CREATE POLICY "Admins can delete import logs"
ON public.import_activity_log
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Index for faster queries
CREATE INDEX idx_import_activity_created_at ON public.import_activity_log(created_at DESC);
CREATE INDEX idx_import_activity_course_id ON public.import_activity_log(course_id);