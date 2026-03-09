
-- Studio project tasks
CREATE TABLE public.studio_project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.studio_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo',
  priority text DEFAULT 'medium',
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_project_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own project tasks" ON public.studio_project_tasks
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Studio project milestones
CREATE TABLE public.studio_project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.studio_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  target_date timestamp with time zone,
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own milestones" ON public.studio_project_milestones
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Daily design challenges
CREATE TABLE public.daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  brief text NOT NULL,
  category text DEFAULT 'general',
  difficulty text DEFAULT 'medium',
  active_date date NOT NULL DEFAULT CURRENT_DATE,
  is_active boolean DEFAULT true,
  submission_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active challenges" ON public.daily_challenges
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage challenges" ON public.daily_challenges
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Challenge submissions
CREATE TABLE public.challenge_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  image_url text NOT NULL,
  caption text,
  vote_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view submissions" ON public.challenge_submissions
  FOR SELECT USING (true);

CREATE POLICY "Auth users can submit" ON public.challenge_submissions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own submissions" ON public.challenge_submissions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Challenge votes
CREATE TABLE public.challenge_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.challenge_submissions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(submission_id, user_id)
);

ALTER TABLE public.challenge_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view challenge votes" ON public.challenge_votes
  FOR SELECT USING (true);

CREATE POLICY "Auth users can vote" ON public.challenge_votes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own votes" ON public.challenge_votes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Update cleanup function to include new tables
CREATE OR REPLACE FUNCTION public.cleanup_user_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.challenge_votes WHERE user_id = OLD.id;
  DELETE FROM public.challenge_submissions WHERE user_id = OLD.id;
  DELETE FROM public.studio_project_tasks WHERE user_id = OLD.id;
  DELETE FROM public.studio_project_milestones WHERE user_id = OLD.id;
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
