
-- Table to track per-user exit-intent discount timers
CREATE TABLE public.user_discount_timers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  extended BOOLEAN NOT NULL DEFAULT false,
  extended_at TIMESTAMP WITH TIME ZONE,
  expired BOOLEAN NOT NULL DEFAULT false,
  initial_duration_seconds INTEGER NOT NULL DEFAULT 900, -- 15 min
  extension_duration_seconds INTEGER NOT NULL DEFAULT 300, -- 5 min
  discount_percent INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_discount UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.user_discount_timers ENABLE ROW LEVEL SECURITY;

-- Users can view their own timer
CREATE POLICY "Users can view their own discount timer"
ON public.user_discount_timers FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own timer
CREATE POLICY "Users can insert their own discount timer"
ON public.user_discount_timers FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own timer
CREATE POLICY "Users can update their own discount timer"
ON public.user_discount_timers FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can manage all
CREATE POLICY "Admins can manage all discount timers"
ON public.user_discount_timers FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));
