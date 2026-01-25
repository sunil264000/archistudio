-- Add policy to allow public to view basic lesson metadata for curriculum display
-- This allows guests to see lesson titles and duration in the course detail page
-- while still protecting the actual video content
CREATE POLICY "Anyone can view lesson metadata for curriculum"
ON public.lessons
FOR SELECT
USING (true);

-- Drop the restrictive policy that only showed free previews
DROP POLICY IF EXISTS "Anyone can view free preview lessons" ON public.lessons;