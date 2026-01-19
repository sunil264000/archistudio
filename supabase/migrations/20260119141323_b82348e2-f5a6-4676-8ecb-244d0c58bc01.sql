
-- Create course_questions table for Q&A below courses
CREATE TABLE public.course_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  answered_by UUID,
  answered_at TIMESTAMP WITH TIME ZONE,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_questions ENABLE ROW LEVEL SECURITY;

-- Users can view questions for courses they're enrolled in or public questions
CREATE POLICY "Users can view public questions"
  ON public.course_questions FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own questions"
  ON public.course_questions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create questions for enrolled courses"
  ON public.course_questions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.enrollments 
      WHERE user_id = auth.uid() 
      AND course_id = course_questions.course_id 
      AND status = 'active'
    )
  );

CREATE POLICY "Users can update their own unanswered questions"
  ON public.course_questions FOR UPDATE
  USING (auth.uid() = user_id AND answer IS NULL);

CREATE POLICY "Admins can manage all questions"
  ON public.course_questions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create index for performance
CREATE INDEX idx_course_questions_course_id ON public.course_questions(course_id);
CREATE INDEX idx_course_questions_user_id ON public.course_questions(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_course_questions_updated_at
  BEFORE UPDATE ON public.course_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add blog_id to notifications for blog-specific notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE SET NULL;

-- Add is_global column to notifications for broadcast messages
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;
