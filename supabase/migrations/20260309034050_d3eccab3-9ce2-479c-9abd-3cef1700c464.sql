
-- Sheet annotations (Figma-style pin comments)
CREATE TABLE public.sheet_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES public.sheet_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  x_percent NUMERIC NOT NULL,
  y_percent NUMERIC NOT NULL,
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES public.sheet_annotations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sheet_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view annotations" ON public.sheet_annotations FOR SELECT USING (true);
CREATE POLICY "Auth users can create annotations" ON public.sheet_annotations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own annotations" ON public.sheet_annotations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own annotations" ON public.sheet_annotations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Continue learning: track last watched position per lesson
ALTER TABLE public.progress ADD COLUMN IF NOT EXISTS last_position_seconds INTEGER DEFAULT 0;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sheet_annotations;
