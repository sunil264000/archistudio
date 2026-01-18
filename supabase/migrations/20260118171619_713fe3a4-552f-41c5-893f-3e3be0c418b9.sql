-- Create table for storing certificate template settings
CREATE TABLE public.certificate_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url TEXT,
  background_color TEXT DEFAULT '#ffffff',
  primary_color TEXT DEFAULT '#1a1a1a',
  accent_color TEXT DEFAULT '#c45a32',
  font_family TEXT DEFAULT 'Playfair Display',
  institution_name TEXT DEFAULT 'Concrete Logic',
  institution_tagline TEXT DEFAULT 'Architecture Learning Platform',
  signature_name TEXT DEFAULT 'Course Director',
  signature_title TEXT DEFAULT 'Concrete Logic',
  show_border BOOLEAN DEFAULT true,
  border_style TEXT DEFAULT 'classic',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.certificate_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read settings (needed for certificate generation)
CREATE POLICY "Certificate settings are publicly readable"
ON public.certificate_settings
FOR SELECT
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update certificate settings"
ON public.certificate_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can insert certificate settings"
ON public.certificate_settings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert default settings
INSERT INTO public.certificate_settings (id) VALUES (gen_random_uuid());