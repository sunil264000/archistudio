-- Personalized onboarding intake for newly signed-up users
CREATE TABLE IF NOT EXISTS public.user_onboarding_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  age INTEGER,
  role_track TEXT NOT NULL,
  discovery_source TEXT NOT NULL,
  primary_challenge TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_onboarding_intake ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own onboarding intake" ON public.user_onboarding_intake;
CREATE POLICY "Users can view their own onboarding intake"
ON public.user_onboarding_intake
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own onboarding intake" ON public.user_onboarding_intake;
CREATE POLICY "Users can insert their own onboarding intake"
ON public.user_onboarding_intake
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own onboarding intake" ON public.user_onboarding_intake;
CREATE POLICY "Users can update their own onboarding intake"
ON public.user_onboarding_intake
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_user_onboarding_intake_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_onboarding_intake_updated_at ON public.user_onboarding_intake;
CREATE TRIGGER trg_user_onboarding_intake_updated_at
BEFORE UPDATE ON public.user_onboarding_intake
FOR EACH ROW
EXECUTE FUNCTION public.set_user_onboarding_intake_updated_at();