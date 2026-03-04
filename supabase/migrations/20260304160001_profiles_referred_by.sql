-- Add referred_by column to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- Create index for referral code lookups during sign-up
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by) WHERE referred_by IS NOT NULL;
