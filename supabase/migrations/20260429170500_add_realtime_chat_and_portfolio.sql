-- Migration: Add Portfolio PDF and Drive link to worker_profiles
ALTER TABLE public.worker_profiles ADD COLUMN IF NOT EXISTS portfolio_pdf_url TEXT;
ALTER TABLE public.worker_profiles ADD COLUMN IF NOT EXISTS google_drive_link TEXT;
ALTER TABLE public.worker_profiles ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE public.worker_profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
