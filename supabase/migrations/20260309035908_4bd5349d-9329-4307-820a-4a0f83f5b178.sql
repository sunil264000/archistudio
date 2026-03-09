
-- Case Studies table for backend-driven case study content
CREATE TABLE public.case_studies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  architect TEXT NOT NULL,
  location TEXT NOT NULL,
  year TEXT NOT NULL,
  type TEXT NOT NULL,
  image_url TEXT,
  brief TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User learning streaks table
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- AI recommendation logs for tracking what was recommended
CREATE TABLE public.recommendation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recommended_course_ids TEXT[] DEFAULT '{}',
  reason TEXT,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_logs ENABLE ROW LEVEL SECURITY;

-- Case studies: public read, admin write
CREATE POLICY "Anyone can view published case studies"
  ON public.case_studies FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage case studies"
  ON public.case_studies FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User streaks: own data only
CREATE POLICY "Users can view own streaks"
  ON public.user_streaks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can upsert own streaks"
  ON public.user_streaks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own streaks"
  ON public.user_streaks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Recommendation logs: own data only
CREATE POLICY "Users can view own recommendations"
  ON public.recommendation_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own recommendations"
  ON public.recommendation_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Seed case studies data
INSERT INTO public.case_studies (title, architect, location, year, type, image_url, brief, tags, order_index) VALUES
('Therme Vals', 'Peter Zumthor', 'Vals, Switzerland', '1996', 'Spa & Wellness', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', 'A masterclass in material-driven architecture. Built into the hillside using locally quarried Valser quartzite, the thermal baths create a sensory journey through water, stone, light, and shadow.', ARRAY['Materiality', 'Sensory', 'Landscape Integration'], 1),
('Vitra Fire Station', 'Zaha Hadid', 'Weil am Rhein, Germany', '1993', 'Civic', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600', 'A frozen moment of explosion — sharp angles and tilting walls create a sense of dynamic motion. One of the earliest built expressions of Deconstructivism.', ARRAY['Deconstructivism', 'Dynamic Form', 'Concrete'], 2),
('Auroville Matrimandir', 'Roger Anger', 'Auroville, India', '2008', 'Spiritual', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600', 'A golden sphere rising from the earth. The inner chamber contains the world''s largest optically perfect glass globe, creating a space of absolute silence and concentration.', ARRAY['Sacred Architecture', 'Indian', 'Meditation'], 3),
('CSMVS Museum Extension', 'Rahul Mehrotra', 'Mumbai, India', '2008', 'Cultural', 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=600', 'Sensitive addition to the heritage Indo-Saracenic museum. The underground gallery preserves views while creating modern exhibition spaces connected by a landscaped courtyard.', ARRAY['Heritage', 'Indian', 'Underground'], 4),
('Salk Institute', 'Louis Kahn', 'La Jolla, California', '1965', 'Research', 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600', 'Twin laboratory blocks flanking a travertine plaza that channels the Pacific Ocean. Kahn''s masterwork demonstrates how architecture can inspire scientific discovery.', ARRAY['Brutalism', 'Symmetry', 'Light'], 5),
('Laurie Baker Centre', 'Laurie Baker', 'Trivandrum, India', '1990', 'Institutional', 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=600', 'Cost-effective vernacular architecture using locally available materials. Baker''s jali brick walls provide ventilation and dappled light, proving that good architecture need not be expensive.', ARRAY['Vernacular', 'Indian', 'Sustainable', 'Brick'], 6);
