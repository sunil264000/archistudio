
-- Forum topics
CREATE TABLE public.forum_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL DEFAULT 'general',
  upvote_count integer DEFAULT 0,
  view_count integer DEFAULT 0,
  answer_count integer DEFAULT 0,
  is_resolved boolean DEFAULT false,
  is_pinned boolean DEFAULT false,
  best_answer_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT '{}'::text[]
);

-- Forum answers
CREATE TABLE public.forum_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  parent_id uuid REFERENCES public.forum_answers(id) ON DELETE CASCADE,
  upvote_count integer DEFAULT 0,
  is_best_answer boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  content text NOT NULL
);

-- Forum votes (for both topics and answers)
CREATE TABLE public.forum_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_id uuid NOT NULL,
  target_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_id, target_type)
);

-- Enable RLS
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_votes ENABLE ROW LEVEL SECURITY;

-- Forum topics policies
CREATE POLICY "Anyone can view topics" ON public.forum_topics FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create topics" ON public.forum_topics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own topics" ON public.forum_topics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own topics" ON public.forum_topics FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all topics" ON public.forum_topics FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Forum answers policies
CREATE POLICY "Anyone can view answers" ON public.forum_answers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create answers" ON public.forum_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own answers" ON public.forum_answers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own answers" ON public.forum_answers FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Topic owners can mark best answer" ON public.forum_answers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM forum_topics WHERE forum_topics.id = forum_answers.topic_id AND forum_topics.user_id = auth.uid())
);
CREATE POLICY "Admins can manage all answers" ON public.forum_answers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Forum votes policies
CREATE POLICY "Anyone can view votes" ON public.forum_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON public.forum_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own votes" ON public.forum_votes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all votes" ON public.forum_votes FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Update cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_user_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
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
