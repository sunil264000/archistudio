
-- Fix overly permissive policies - drop and recreate with proper checks
DROP POLICY IF EXISTS "System inserts activity_feed" ON public.activity_feed;
DROP POLICY IF EXISTS "Admins manage activity_feed" ON public.activity_feed;
DROP POLICY IF EXISTS "Users can report content" ON public.moderation_queue;

-- Activity feed: users insert own, admins manage all
CREATE POLICY "Users insert own activity" ON public.activity_feed FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins delete activity_feed" ON public.activity_feed FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Moderation: users report with their own ID
CREATE POLICY "Users report content" ON public.moderation_queue FOR INSERT TO authenticated WITH CHECK (reported_by = auth.uid());
