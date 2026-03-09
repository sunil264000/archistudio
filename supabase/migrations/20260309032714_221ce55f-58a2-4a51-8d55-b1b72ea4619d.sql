ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON public.course_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.course_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));