
-- Portfolios
CREATE TABLE public.portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  is_public boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL DEFAULT 'My Portfolio',
  slug text NOT NULL,
  subtitle text,
  bio text,
  contact_email text,
  accent_color text DEFAULT '#c2410c',
  UNIQUE(slug)
);

-- Portfolio pages (projects)
CREATE TABLE public.portfolio_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  order_index integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  description text
);

-- Portfolio sections within pages
CREATE TABLE public.portfolio_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.portfolio_pages(id) ON DELETE CASCADE,
  order_index integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  section_type text NOT NULL DEFAULT 'image',
  content text,
  image_url text,
  caption text,
  layout text DEFAULT 'full'
);

-- Enable RLS
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_sections ENABLE ROW LEVEL SECURITY;

-- Portfolio policies
CREATE POLICY "Anyone can view public portfolios" ON public.portfolios FOR SELECT USING (is_public = true);
CREATE POLICY "Users can manage own portfolios" ON public.portfolios FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all portfolios" ON public.portfolios FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Portfolio pages policies
CREATE POLICY "Anyone can view public portfolio pages" ON public.portfolio_pages FOR SELECT USING (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = portfolio_pages.portfolio_id AND portfolios.is_public = true)
);
CREATE POLICY "Owners can manage portfolio pages" ON public.portfolio_pages FOR ALL USING (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = portfolio_pages.portfolio_id AND portfolios.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = portfolio_pages.portfolio_id AND portfolios.user_id = auth.uid())
);

-- Portfolio sections policies
CREATE POLICY "Anyone can view public portfolio sections" ON public.portfolio_sections FOR SELECT USING (
  EXISTS (SELECT 1 FROM portfolio_pages pp JOIN portfolios p ON p.id = pp.portfolio_id WHERE pp.id = portfolio_sections.page_id AND p.is_public = true)
);
CREATE POLICY "Owners can manage portfolio sections" ON public.portfolio_sections FOR ALL USING (
  EXISTS (SELECT 1 FROM portfolio_pages pp JOIN portfolios p ON p.id = pp.portfolio_id WHERE pp.id = portfolio_sections.page_id AND p.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM portfolio_pages pp JOIN portfolios p ON p.id = pp.portfolio_id WHERE pp.id = portfolio_sections.page_id AND p.user_id = auth.uid())
);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio-uploads', 'portfolio-uploads', true);

-- Storage policies
CREATE POLICY "Anyone can view portfolio uploads" ON storage.objects FOR SELECT USING (bucket_id = 'portfolio-uploads');
CREATE POLICY "Authenticated users can upload portfolio files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'portfolio-uploads' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own portfolio files" ON storage.objects FOR UPDATE USING (bucket_id = 'portfolio-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own portfolio files" ON storage.objects FOR DELETE USING (bucket_id = 'portfolio-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Update cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_user_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
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
