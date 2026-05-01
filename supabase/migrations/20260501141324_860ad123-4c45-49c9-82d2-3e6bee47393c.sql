-- Extend existing coupons table
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS free_course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS timer_duration_seconds integer NOT NULL DEFAULT 600;

-- Coupon redemptions
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  coupon_code text NOT NULL,
  free_course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  discount_percent integer NOT NULL DEFAULT 0,
  timer_starts_at timestamptz NOT NULL DEFAULT now(),
  timer_expires_at timestamptz NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, coupon_id)
);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own redemptions" ON public.coupon_redemptions;
CREATE POLICY "Users see own redemptions"
  ON public.coupon_redemptions FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user_active ON public.coupon_redemptions(user_id, timer_expires_at);

-- Redeem coupon RPC
CREATE OR REPLACE FUNCTION public.redeem_coupon(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_coupon record;
  v_existing record;
  v_expires timestamptz;
  v_disc int;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You must be signed in to redeem a coupon.');
  END IF;

  SELECT * INTO v_coupon FROM public.coupons
  WHERE upper(code) = upper(trim(p_code))
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until > now())
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired coupon code.');
  END IF;

  IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'This coupon has reached its redemption limit.');
  END IF;

  SELECT * INTO v_existing FROM public.coupon_redemptions
  WHERE user_id = v_user AND coupon_id = v_coupon.id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_redeemed', true,
      'free_course_id', v_existing.free_course_id,
      'discount_percent', v_existing.discount_percent,
      'timer_expires_at', v_existing.timer_expires_at
    );
  END IF;

  v_disc := CASE WHEN v_coupon.discount_type = 'percentage' THEN v_coupon.discount_value::int ELSE 0 END;
  v_expires := now() + make_interval(secs => COALESCE(v_coupon.timer_duration_seconds, 600));

  IF v_coupon.free_course_id IS NOT NULL THEN
    INSERT INTO public.enrollments (user_id, course_id, status, is_manual, granted_at)
    VALUES (v_user, v_coupon.free_course_id, 'active', true, now())
    ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.coupon_redemptions (
    user_id, coupon_id, coupon_code, free_course_id,
    discount_percent, timer_starts_at, timer_expires_at
  ) VALUES (
    v_user, v_coupon.id, v_coupon.code, v_coupon.free_course_id,
    v_disc, now(), v_expires
  );

  UPDATE public.coupons SET used_count = used_count + 1 WHERE id = v_coupon.id;

  RETURN jsonb_build_object(
    'success', true,
    'already_redeemed', false,
    'free_course_id', v_coupon.free_course_id,
    'discount_percent', v_disc,
    'timer_expires_at', v_expires,
    'message', 'Coupon redeemed! Enjoy your free course and 10-minute discount.'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_active_coupon_redemption()
RETURNS TABLE(
  coupon_code text,
  free_course_id uuid,
  discount_percent integer,
  timer_expires_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cr.coupon_code, cr.free_course_id, cr.discount_percent, cr.timer_expires_at
  FROM public.coupon_redemptions cr
  WHERE cr.user_id = auth.uid()
    AND cr.timer_expires_at > now()
  ORDER BY cr.timer_expires_at DESC
  LIMIT 1;
$$;

-- Seed MAY2026
INSERT INTO public.coupons (code, description, discount_type, discount_value, free_course_id, timer_duration_seconds, is_active, valid_from, valid_until)
VALUES (
  'MAY2026',
  'Free Master Course: AutoCAD & SketchUp + 20% off everything else for 10 minutes',
  'percentage',
  20,
  'ae75d48a-d41d-4f8d-b2b4-eb5732e8f983',
  600,
  true,
  now(),
  now() + interval '365 days'
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  discount_type = 'percentage',
  discount_value = 20,
  free_course_id = EXCLUDED.free_course_id,
  timer_duration_seconds = 600,
  is_active = true,
  valid_until = EXCLUDED.valid_until;