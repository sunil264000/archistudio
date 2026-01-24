-- Remove the public SELECT policy on coupons that exposes all coupon codes
-- Coupons should only be validated through the validate-coupon edge function

DROP POLICY IF EXISTS "Anyone can validate active coupons" ON public.coupons;

-- The "Admins can manage coupons" policy already exists and provides admin access
-- No additional policies needed - coupon validation happens via edge function