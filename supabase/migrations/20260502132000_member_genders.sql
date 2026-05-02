-- Update existing worker profiles with random genders to match the new high-quality avatars
-- In a real scenario, this would be collected during onboarding.

ALTER TABLE public.worker_profiles ADD COLUMN IF NOT EXISTS gender text;

-- Assign genders to existing members for presentation
UPDATE public.worker_profiles SET gender = 'male' WHERE display_name ILIKE '%Kumar%' OR display_name ILIKE '%Sharma%' OR display_name ILIKE '%Sing%' OR display_name ILIKE '%Patel%';
UPDATE public.worker_profiles SET gender = 'female' WHERE display_name ILIKE '%Anjali%' OR display_name ILIKE '%Priya%' OR display_name ILIKE '%Kaur%' OR display_name ILIKE '%Iyer%';
UPDATE public.worker_profiles SET gender = 'male' WHERE gender IS NULL AND id IN (SELECT id FROM worker_profiles LIMIT 10);
UPDATE public.worker_profiles SET gender = 'female' WHERE gender IS NULL;
