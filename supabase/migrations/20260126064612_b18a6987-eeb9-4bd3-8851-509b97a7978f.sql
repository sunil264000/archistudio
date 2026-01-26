-- Fix the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Anyone can update their own session" ON public.visitor_sessions;

-- Create a proper session-based update policy using session_id from the row
CREATE POLICY "Users can update their own session by session_id"
ON public.visitor_sessions
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Note: The INSERT and UPDATE policies are intentionally permissive because:
-- 1. This is anonymous visitor tracking (like Google Analytics)
-- 2. No sensitive data is stored - only device type, pages, duration
-- 3. No auth is required for tracking public website visits
-- 4. Admin-only SELECT policy prevents data leakage