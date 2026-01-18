-- Create referrals table for tracking referral codes and rewards
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  total_referrals INTEGER DEFAULT 0,
  total_earned_discount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create referral uses table to track who used which code
CREATE TABLE public.referral_uses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id),
  discount_applied DECIMAL(10,2) DEFAULT 0,
  referrer_reward DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(referred_user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_uses ENABLE ROW LEVEL SECURITY;

-- Referrals policies - users can see their own referrals
CREATE POLICY "Users can view own referrals"
ON public.referrals
FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can create own referral"
ON public.referrals
FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can update own referrals"
ON public.referrals
FOR UPDATE
USING (auth.uid() = referrer_id);

-- Referral uses policies
CREATE POLICY "Users can view referral uses for their code"
ON public.referral_uses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.referrals
    WHERE referrals.id = referral_uses.referral_id
    AND referrals.referrer_id = auth.uid()
  )
);

CREATE POLICY "Anyone can create referral use"
ON public.referral_uses
FOR INSERT
WITH CHECK (auth.uid() = referred_user_id);

-- Add referral_code lookup function
CREATE OR REPLACE FUNCTION public.get_referral_by_code(code TEXT)
RETURNS TABLE (
  id UUID,
  referrer_id UUID,
  referral_code TEXT
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, referrer_id, referral_code
  FROM public.referrals
  WHERE referral_code = code;
$$;

-- Create trigger to update referral stats
CREATE OR REPLACE FUNCTION public.update_referral_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.referrals
  SET 
    total_referrals = total_referrals + 1,
    total_earned_discount = total_earned_discount + NEW.referrer_reward,
    updated_at = now()
  WHERE id = NEW.referral_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER on_referral_use
AFTER INSERT ON public.referral_uses
FOR EACH ROW
EXECUTE FUNCTION public.update_referral_stats();