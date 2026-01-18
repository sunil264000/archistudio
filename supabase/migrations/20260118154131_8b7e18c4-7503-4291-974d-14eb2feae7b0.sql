-- =====================================================
-- FIX 1: Analytics - Require authentication for inserts
-- =====================================================
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;

CREATE POLICY "Authenticated users can insert analytics events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- FIX 2: Coupons - Remove public SELECT access (will use edge function)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can validate active coupons" ON public.coupons;

-- =====================================================
-- FIX 3: Standardize ALL admin policies to use has_role()
-- =====================================================

-- Courses
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.courses;
CREATE POLICY "Admins can manage all courses"
  ON public.courses FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Modules
DROP POLICY IF EXISTS "Admins can manage all modules" ON public.modules;
CREATE POLICY "Admins can manage all modules"
  ON public.modules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Lessons
DROP POLICY IF EXISTS "Admins can manage all lessons" ON public.lessons;
CREATE POLICY "Admins can manage all lessons"
  ON public.lessons FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Lesson Resources
DROP POLICY IF EXISTS "Admins can manage all resources" ON public.lesson_resources;
CREATE POLICY "Admins can manage all resources"
  ON public.lesson_resources FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Enrollments
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON public.enrollments;
CREATE POLICY "Admins can manage all enrollments"
  ON public.enrollments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Progress
DROP POLICY IF EXISTS "Admins can view all progress" ON public.progress;
CREATE POLICY "Admins can view all progress"
  ON public.progress FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Certificates
DROP POLICY IF EXISTS "Admins can manage certificates" ON public.certificates;
CREATE POLICY "Admins can manage certificates"
  ON public.certificates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Subscriptions
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage all subscriptions"
  ON public.subscriptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Payments
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
CREATE POLICY "Admins can manage all payments"
  ON public.payments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Coupons
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Support Tickets
DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.support_tickets;
CREATE POLICY "Admins can manage all tickets"
  ON public.support_tickets FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Notifications
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Analytics Events
DROP POLICY IF EXISTS "Admins can view analytics events" ON public.analytics_events;
CREATE POLICY "Admins can view analytics events"
  ON public.analytics_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Blog Posts
DROP POLICY IF EXISTS "Admins can manage blog posts" ON public.blog_posts;
CREATE POLICY "Admins can manage blog posts"
  ON public.blog_posts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- AI Chat History (add admin access)
CREATE POLICY "Admins can view all chat history"
  ON public.ai_chat_history FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));