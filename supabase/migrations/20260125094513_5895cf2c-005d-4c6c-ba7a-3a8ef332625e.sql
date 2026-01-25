-- Add lesson-level unlock support to user_module_access table
ALTER TABLE public.user_module_access 
ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_module_access_lesson_id 
ON public.user_module_access(lesson_id) 
WHERE lesson_id IS NOT NULL;

-- Create a new table for lesson-level access tracking (separate from module-level)
CREATE TABLE IF NOT EXISTS public.user_lesson_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  access_type TEXT DEFAULT 'emi',
  emi_payment_id UUID REFERENCES public.emi_payments(id) ON DELETE SET NULL,
  gift_claim_id UUID REFERENCES public.login_gift_claims(id) ON DELETE SET NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS on user_lesson_access
ALTER TABLE public.user_lesson_access ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_lesson_access
CREATE POLICY "Users can view their own lesson access"
ON public.user_lesson_access
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all lesson access"
ON public.user_lesson_access
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage lesson access"
ON public.user_lesson_access
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_lesson_access_user_course
ON public.user_lesson_access(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_user_lesson_access_lookup
ON public.user_lesson_access(user_id, lesson_id);