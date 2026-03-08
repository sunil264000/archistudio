
-- Sheet Reviews table
CREATE TABLE public.sheet_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sheet_url TEXT NOT NULL,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  is_featured BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  critique_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sheet_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view sheets
CREATE POLICY "Anyone can view sheets" ON public.sheet_reviews
  FOR SELECT USING (true);

-- Users can create their own sheets
CREATE POLICY "Users can create sheets" ON public.sheet_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update their own sheets
CREATE POLICY "Users can update own sheets" ON public.sheet_reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Users can delete their own sheets
CREATE POLICY "Users can delete own sheets" ON public.sheet_reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Admins can manage all sheets
CREATE POLICY "Admins can manage all sheets" ON public.sheet_reviews
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Critiques table
CREATE TABLE public.sheet_critiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES public.sheet_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.sheet_critiques(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_best_answer BOOLEAN DEFAULT false,
  upvote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sheet_critiques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view critiques" ON public.sheet_critiques
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create critiques" ON public.sheet_critiques
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own critiques" ON public.sheet_critiques
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own critiques" ON public.sheet_critiques
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all critiques" ON public.sheet_critiques
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Sheet owners can mark best answer
CREATE POLICY "Sheet owners can mark best answer" ON public.sheet_critiques
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.sheet_reviews
      WHERE id = sheet_critiques.sheet_id AND user_id = auth.uid()
    )
  );

-- Upvotes table
CREATE TABLE public.sheet_critique_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  critique_id UUID NOT NULL REFERENCES public.sheet_critiques(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(critique_id, user_id)
);

ALTER TABLE public.sheet_critique_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view upvotes" ON public.sheet_critique_upvotes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upvote" ON public.sheet_critique_upvotes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own upvotes" ON public.sheet_critique_upvotes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket for sheet uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('sheet-uploads', 'sheet-uploads', true);

-- Storage policies
CREATE POLICY "Anyone can view sheet uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'sheet-uploads');

CREATE POLICY "Authenticated users can upload sheets" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'sheet-uploads');

CREATE POLICY "Users can delete own sheet uploads" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'sheet-uploads');

-- Triggers for updated_at
CREATE TRIGGER set_sheet_reviews_updated_at
  BEFORE UPDATE ON public.sheet_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_sheet_critiques_updated_at
  BEFORE UPDATE ON public.sheet_critiques
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add to cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_user_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
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
