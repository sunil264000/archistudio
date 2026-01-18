-- Create site_settings table for admin-configurable settings
CREATE TABLE public.site_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text NOT NULL UNIQUE,
    value text,
    description text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (for footer social links etc)
CREATE POLICY "Anyone can view site settings"
ON public.site_settings
FOR SELECT
TO authenticated, anon
USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage site settings"
ON public.site_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.site_settings (key, value, description) VALUES
('instagram_url', '', 'Instagram profile URL'),
('facebook_url', '', 'Facebook page URL'),
('twitter_url', '', 'Twitter/X profile URL'),
('youtube_url', '', 'YouTube channel URL'),
('linkedin_url', '', 'LinkedIn profile URL');