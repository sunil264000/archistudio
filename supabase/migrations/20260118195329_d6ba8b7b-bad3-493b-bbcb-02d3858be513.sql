-- Create course bundles table first
CREATE TABLE IF NOT EXISTS public.course_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  discount_percentage integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_bundles ENABLE ROW LEVEL SECURITY;

-- Policies for bundles
CREATE POLICY "Admins can manage bundles"
ON public.course_bundles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view active bundles"
ON public.course_bundles FOR SELECT
USING (is_active = true);

-- Add course bundling and highlighting fields
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS is_highlighted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bundle_id uuid REFERENCES public.course_bundles(id) ON DELETE SET NULL;

-- Add manual enrollment tracking
ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS is_manual boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS granted_by uuid,
ADD COLUMN IF NOT EXISTS granted_at timestamp with time zone;