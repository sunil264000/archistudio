-- Fix activity_history INSERT policy: restrict to user's own records
DROP POLICY IF EXISTS "System can insert activity history" ON public.activity_history;

CREATE POLICY "Users can insert their own activity history"
ON public.activity_history
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR user_id IS NULL
);