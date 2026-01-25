-- Add EMI surcharge percent column to course_emi_settings
ALTER TABLE public.course_emi_settings 
ADD COLUMN IF NOT EXISTS emi_surcharge_percent numeric DEFAULT 10;

-- Add comment for clarity
COMMENT ON COLUMN public.course_emi_settings.emi_surcharge_percent IS 'Extra percentage charged when paying via EMI (e.g., 10 means 10% surcharge)';