
-- ═══════════════════════════════════════════
-- SOCIAL FEATURES: Usernames, Follows, Achievements, Profile Completion, Global Search
-- ═══════════════════════════════════════════

-- 1. USERNAMES TABLE
CREATE TABLE public.usernames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT username_format CHECK (username ~ '^[a-z0-9][a-z0-9._-]{2,29}$')
);

CREATE INDEX idx_usernames_username ON public.usernames(username);
CREATE INDEX idx_usernames_user_id ON public.usernames(user_id);

ALTER TABLE public.usernames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view usernames" ON public.usernames FOR SELECT USING (true);
CREATE POLICY "Users can insert own username" ON public.usernames FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own username" ON public.usernames FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. FOLLOWS TABLE
CREATE TABLE public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_follows_following ON public.user_follows(following_id);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.user_follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.user_follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- 3. ACHIEVEMENTS TABLE
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'award',
  category TEXT NOT NULL DEFAULT 'general',
  points INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Admins can manage achievements" ON public.achievements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. USER_ACHIEVEMENTS TABLE
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view user achievements" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "System can grant achievements" ON public.user_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 5. PROFILE COMPLETION TASKS
CREATE TABLE public.profile_completion_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL DEFAULT 5,
  icon TEXT DEFAULT 'check-circle',
  order_index INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.profile_completion_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view tasks" ON public.profile_completion_tasks FOR SELECT USING (true);

CREATE TABLE public.user_completed_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_key TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_key)
);

CREATE INDEX idx_user_tasks_user ON public.user_completed_tasks(user_id);

ALTER TABLE public.user_completed_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own completed tasks" ON public.user_completed_tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can complete tasks" ON public.user_completed_tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 6. COMMUNITY FEED TABLE (aggregated activity)
CREATE TABLE public.community_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  target_title TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_feed_created ON public.community_feed(created_at DESC);
CREATE INDEX idx_community_feed_user ON public.community_feed(user_id);

ALTER TABLE public.community_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view feed" ON public.community_feed FOR SELECT USING (true);
CREATE POLICY "Authenticated can post to feed" ON public.community_feed FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Enable realtime for community_feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_feed;

-- 7. ADD BIO AND SOCIAL FIELDS TO PROFILES
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS college TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reputation_title TEXT DEFAULT 'Newcomer';

-- 8. SEED DEFAULT ACHIEVEMENTS
INSERT INTO public.achievements (key, title, description, icon, category, points) VALUES
  ('first_sheet', 'First Sheet', 'Uploaded your first architecture sheet', 'file-text', 'sheets', 10),
  ('first_critique', 'First Critique', 'Gave your first sheet critique', 'message-circle', 'sheets', 10),
  ('first_portfolio', 'Portfolio Pioneer', 'Published your first portfolio', 'briefcase', 'portfolio', 15),
  ('first_forum_post', 'Discussion Starter', 'Created your first forum topic', 'message-square', 'community', 10),
  ('first_course', 'Student', 'Completed your first course', 'graduation-cap', 'learning', 20),
  ('five_courses', 'Scholar', 'Completed 5 courses', 'book-open', 'learning', 50),
  ('ten_critiques', 'Critique Master', 'Gave 10 sheet critiques', 'star', 'sheets', 30),
  ('challenge_winner', 'Challenge Winner', 'Won a design challenge', 'trophy', 'competitions', 50),
  ('top_reviewer', 'Top Reviewer', 'Received 10+ upvotes on reviews', 'thumbs-up', 'community', 25),
  ('referral_champion', 'Referral Champion', 'Referred 5+ students', 'users', 'community', 40),
  ('sheet_master', 'Sheet Master', 'Uploaded 10+ sheets', 'layers', 'sheets', 35),
  ('rendering_expert', 'Rendering Expert', 'Completed all rendering courses', 'image', 'learning', 50),
  ('studio_leader', 'Studio Leader', 'Led 3+ studio projects', 'compass', 'studio', 45),
  ('concept_thinker', 'Concept Thinker', 'Got best answer 5 times in forum', 'lightbulb', 'community', 30),
  ('community_builder', 'Community Builder', 'Active in 5+ platform areas', 'heart', 'community', 40);

-- 9. SEED DEFAULT PROFILE COMPLETION TASKS
INSERT INTO public.profile_completion_tasks (key, title, description, points, icon, order_index) VALUES
  ('avatar', 'Upload Profile Picture', 'Add a photo to your profile', 5, 'camera', 1),
  ('bio', 'Write a Bio', 'Tell others about yourself', 5, 'edit', 2),
  ('college', 'Add Your College', 'Share where you study', 5, 'building', 3),
  ('skills', 'Add Skills', 'List your architecture skills', 5, 'tool', 4),
  ('username', 'Set a Username', 'Claim your unique profile URL', 10, 'at-sign', 5),
  ('first_sheet', 'Upload First Sheet', 'Share your first architecture sheet', 10, 'file-plus', 6),
  ('portfolio', 'Build Portfolio', 'Create your public portfolio', 15, 'briefcase', 7),
  ('first_forum', 'Ask or Answer in Forum', 'Engage with the community', 5, 'message-square', 8);

-- 10. FULL-TEXT SEARCH FUNCTION
CREATE OR REPLACE FUNCTION public.global_search(search_query TEXT, result_limit INTEGER DEFAULT 20)
RETURNS TABLE(
  result_type TEXT,
  result_id TEXT,
  title TEXT,
  description TEXT,
  slug TEXT,
  relevance REAL
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Courses
  SELECT 'course'::TEXT, id::TEXT, c.title, c.short_description, c.slug,
    ts_rank(to_tsvector('english', coalesce(c.title,'') || ' ' || coalesce(c.description,'') || ' ' || coalesce(c.short_description,'')), plainto_tsquery('english', search_query)) as relevance
  FROM public.courses c
  WHERE c.is_published = true
    AND to_tsvector('english', coalesce(c.title,'') || ' ' || coalesce(c.description,'') || ' ' || coalesce(c.short_description,''))
    @@ plainto_tsquery('english', search_query)

  UNION ALL

  -- Forum topics
  SELECT 'forum'::TEXT, ft.id::TEXT, ft.title, LEFT(ft.content, 200), ft.id::TEXT,
    ts_rank(to_tsvector('english', coalesce(ft.title,'') || ' ' || coalesce(ft.content,'')), plainto_tsquery('english', search_query))
  FROM public.forum_topics ft
  WHERE to_tsvector('english', coalesce(ft.title,'') || ' ' || coalesce(ft.content,''))
    @@ plainto_tsquery('english', search_query)

  UNION ALL

  -- Blog posts
  SELECT 'blog'::TEXT, bp.id::TEXT, bp.title, bp.excerpt, bp.slug,
    ts_rank(to_tsvector('english', coalesce(bp.title,'') || ' ' || coalesce(bp.content,'')), plainto_tsquery('english', search_query))
  FROM public.blog_posts bp
  WHERE bp.is_published = true
    AND to_tsvector('english', coalesce(bp.title,'') || ' ' || coalesce(bp.content,''))
    @@ plainto_tsquery('english', search_query)

  UNION ALL

  -- Ebooks
  SELECT 'ebook'::TEXT, eb.id::TEXT, eb.title, eb.description, eb.id::TEXT,
    ts_rank(to_tsvector('english', coalesce(eb.title,'') || ' ' || coalesce(eb.description,'')), plainto_tsquery('english', search_query))
  FROM public.ebooks eb
  WHERE eb.is_published = true
    AND to_tsvector('english', coalesce(eb.title,'') || ' ' || coalesce(eb.description,''))
    @@ plainto_tsquery('english', search_query)

  ORDER BY relevance DESC
  LIMIT result_limit;
$$;
