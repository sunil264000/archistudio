-- Add text color columns to certificate_settings
ALTER TABLE public.certificate_settings 
ADD COLUMN IF NOT EXISTS title_color text DEFAULT '#1a1a1a',
ADD COLUMN IF NOT EXISTS body_text_color text DEFAULT '#4a4a4a',
ADD COLUMN IF NOT EXISTS tagline_color text DEFAULT '#6b7280';