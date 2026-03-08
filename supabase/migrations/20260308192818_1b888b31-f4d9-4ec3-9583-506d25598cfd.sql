
-- Studio Projects
CREATE TABLE public.studio_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress',
  visibility TEXT NOT NULL DEFAULT 'private',
  cover_image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own projects" ON public.studio_projects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view public projects" ON public.studio_projects FOR SELECT USING (visibility = 'public');
CREATE POLICY "Admins can view all projects" ON public.studio_projects FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Studio Project Files (sketches, plans, references, inspiration)
CREATE TABLE public.studio_project_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.studio_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size_bytes BIGINT,
  category TEXT NOT NULL DEFAULT 'reference',
  caption TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own files" ON public.studio_project_files FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view files of public projects" ON public.studio_project_files FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.studio_projects WHERE id = studio_project_files.project_id AND visibility = 'public')
);

-- Studio Project Notes
CREATE TABLE public.studio_project_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.studio_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_project_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notes" ON public.studio_project_notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view notes of public projects" ON public.studio_project_notes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.studio_projects WHERE id = studio_project_notes.project_id AND visibility = 'public')
);

-- Studio Project Comments (community feedback)
CREATE TABLE public.studio_project_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.studio_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.studio_project_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_project_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create comments" ON public.studio_project_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.studio_project_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.studio_project_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view comments on public projects" ON public.studio_project_comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.studio_projects WHERE id = studio_project_comments.project_id AND visibility = 'public')
);
CREATE POLICY "Project owners can view all comments" ON public.studio_project_comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.studio_projects WHERE id = studio_project_comments.project_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all comments" ON public.studio_project_comments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Progress timeline entries
CREATE TABLE public.studio_project_timeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.studio_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'update',
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_project_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own timeline" ON public.studio_project_timeline FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view timeline of public projects" ON public.studio_project_timeline FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.studio_projects WHERE id = studio_project_timeline.project_id AND visibility = 'public')
);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('studio-uploads', 'studio-uploads', true);

-- Storage policies
CREATE POLICY "Users can upload studio files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'studio-uploads' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their studio files" ON storage.objects FOR UPDATE USING (bucket_id = 'studio-uploads' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete their studio files" ON storage.objects FOR DELETE USING (bucket_id = 'studio-uploads' AND auth.uid() IS NOT NULL);
CREATE POLICY "Anyone can view studio files" ON storage.objects FOR SELECT USING (bucket_id = 'studio-uploads');

-- Updated at triggers
CREATE TRIGGER set_studio_projects_updated_at BEFORE UPDATE ON public.studio_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_studio_project_notes_updated_at BEFORE UPDATE ON public.studio_project_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_studio_project_comments_updated_at BEFORE UPDATE ON public.studio_project_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add to user cleanup trigger
CREATE OR REPLACE FUNCTION public.cleanup_user_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
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
