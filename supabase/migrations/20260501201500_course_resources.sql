-- Add resource_link to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS resource_link TEXT;

-- Create course_resource_requests table
CREATE TABLE IF NOT EXISTS public.course_resource_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(course_id, user_id)
);

-- Enable RLS
ALTER TABLE public.course_resource_requests ENABLE ROW LEVEL SECURITY;

-- Policies for course_resource_requests
CREATE POLICY "Users can view their own requests"
    ON public.course_resource_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests"
    ON public.course_resource_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
    ON public.course_resource_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update requests"
    ON public.course_resource_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
