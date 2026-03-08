
-- ===== INTERNSHIPS =====
CREATE TABLE public.internships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by uuid,
  is_approved boolean DEFAULT false,
  application_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deadline timestamptz,
  title text NOT NULL,
  company_name text NOT NULL,
  city text NOT NULL,
  role_type text DEFAULT 'internship',
  description text NOT NULL,
  requirements text,
  contact_email text,
  website_url text,
  stipend text
);

CREATE TABLE public.internship_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id uuid NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  portfolio_url text,
  cover_note text,
  status text DEFAULT 'applied',
  UNIQUE(internship_id, user_id)
);

ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved internships" ON public.internships FOR SELECT USING (is_approved = true);
CREATE POLICY "Admins can manage all internships" ON public.internships FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can post internships" ON public.internships FOR INSERT WITH CHECK (auth.uid() = posted_by);

CREATE POLICY "Users can view own applications" ON public.internship_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create applications" ON public.internship_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all applications" ON public.internship_applications FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- ===== COMPETITIONS =====
CREATE TABLE public.competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT true,
  submission_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  brief text,
  prize_description text,
  cover_image_url text
);

CREATE TABLE public.competition_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vote_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  UNIQUE(competition_id, user_id)
);

CREATE TABLE public.competition_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.competition_submissions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(submission_id, user_id)
);

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active competitions" ON public.competitions FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage competitions" ON public.competitions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view submissions" ON public.competition_submissions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can submit" ON public.competition_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own submissions" ON public.competition_submissions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage submissions" ON public.competition_submissions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view votes" ON public.competition_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON public.competition_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own votes" ON public.competition_votes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage votes" ON public.competition_votes FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- ===== LEARNING TRACKS =====
CREATE TABLE public.learning_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_published boolean DEFAULT false,
  order_index integer DEFAULT 0,
  estimated_hours integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text DEFAULT 'BookOpen',
  color text DEFAULT 'accent'
);

CREATE TABLE public.learning_track_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES public.learning_tracks(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  order_index integer DEFAULT 0,
  is_required boolean DEFAULT true,
  UNIQUE(track_id, course_id)
);

ALTER TABLE public.learning_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_track_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published tracks" ON public.learning_tracks FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage tracks" ON public.learning_tracks FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view track courses" ON public.learning_track_courses FOR SELECT USING (
  EXISTS (SELECT 1 FROM learning_tracks WHERE learning_tracks.id = learning_track_courses.track_id AND learning_tracks.is_published = true)
);
CREATE POLICY "Admins can manage track courses" ON public.learning_track_courses FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for competition submissions
INSERT INTO storage.buckets (id, name, public) VALUES ('competition-uploads', 'competition-uploads', true);
CREATE POLICY "Anyone can view competition uploads" ON storage.objects FOR SELECT USING (bucket_id = 'competition-uploads');
CREATE POLICY "Authenticated users can upload competition files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'competition-uploads' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete own competition files" ON storage.objects FOR DELETE USING (bucket_id = 'competition-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Update cleanup
CREATE OR REPLACE FUNCTION public.cleanup_user_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.competition_votes WHERE user_id = OLD.id;
  DELETE FROM public.competition_submissions WHERE user_id = OLD.id;
  DELETE FROM public.internship_applications WHERE user_id = OLD.id;
  DELETE FROM public.internships WHERE posted_by = OLD.id;
  DELETE FROM public.portfolios WHERE user_id = OLD.id;
  DELETE FROM public.forum_votes WHERE user_id = OLD.id;
  DELETE FROM public.forum_answers WHERE user_id = OLD.id;
  DELETE FROM public.forum_topics WHERE user_id = OLD.id;
  DELETE FROM public.sheet_critique_upvotes WHERE user_id = OLD.id;
  DELETE FROM public.sheet_critiques WHERE user_id = OLD.id;
  DELETE FROM public.sheet_reviews WHERE user_id = OLD.id;
  DELETE FROM public.studio_project_comments WHERE user_id = OLD.id;
  DELETE FROM public.studio_project_timeline WHERE user_id = OLD.id;
  DELETE FROM public.studio_project_notes WHERE user_id = OLD.id;
  DELETE FROM public.studio_project_files WHERE user_id = OLD.id;
  DELETE FROM public.studio_projects WHERE user_id = OLD.id;
  DELETE FROM public.user_onboarding_intake WHERE user_id = OLD.id;
  DELETE FROM public.user_sessions WHERE user_id = OLD.id;
  DELETE FROM public.user_discount_timers WHERE user_id = OLD.id;
  DELETE FROM public.user_lesson_access WHERE user_id = OLD.id;
  DELETE FROM public.user_module_access WHERE user_id = OLD.id;
  DELETE FROM public.abandoned_carts WHERE user_id = OLD.id;
  DELETE FROM public.download_requests WHERE user_id = OLD.id;
  DELETE FROM public.progress WHERE user_id = OLD.id;
  DELETE FROM public.notes WHERE user_id = OLD.id;
  DELETE FROM public.bookmarks WHERE user_id = OLD.id;
  DELETE FROM public.certificates WHERE user_id = OLD.id;
  DELETE FROM public.enrollments WHERE user_id = OLD.id;
  DELETE FROM public.payments WHERE user_id = OLD.id;
  DELETE FROM public.emi_payments WHERE user_id = OLD.id;
  DELETE FROM public.ebook_purchases WHERE user_id = OLD.id;
  DELETE FROM public.reviews WHERE user_id = OLD.id;
  DELETE FROM public.course_questions WHERE user_id = OLD.id;
  DELETE FROM public.referrals WHERE referrer_id = OLD.id;
  DELETE FROM public.notifications WHERE user_id = OLD.id;
  DELETE FROM public.ai_chat_history WHERE user_id = OLD.id;
  DELETE FROM public.live_activity WHERE user_id = OLD.id;
  DELETE FROM public.activity_history WHERE user_id = OLD.id;
  DELETE FROM public.purchase_attempts WHERE user_id = OLD.id;
  DELETE FROM public.login_gift_claims WHERE user_id = OLD.id;
  DELETE FROM public.support_tickets WHERE user_id = OLD.id;
  DELETE FROM public.analytics_events WHERE user_id = OLD.id;
  DELETE FROM public.user_roles WHERE user_id = OLD.id;
  DELETE FROM public.profiles WHERE user_id = OLD.id;
  RETURN OLD;
END;
$function$;
