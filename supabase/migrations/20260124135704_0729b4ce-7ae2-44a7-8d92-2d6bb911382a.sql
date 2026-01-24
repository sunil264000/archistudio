-- Add ambient audio URL setting to site_settings
INSERT INTO public.site_settings (key, value, description)
VALUES ('ambient_audio_url', '', 'YouTube URL or direct audio URL for ambient background music')
ON CONFLICT (key) DO NOTHING;