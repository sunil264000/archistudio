
-- Create abandoned_carts table for cart recovery emails
CREATE TABLE public.abandoned_carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_slug TEXT NOT NULL,
  course_title TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  customer_email TEXT,
  customer_name TEXT,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  recovered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own abandoned carts"
ON public.abandoned_carts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own abandoned carts"
ON public.abandoned_carts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all abandoned carts"
ON public.abandoned_carts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage abandoned carts"
ON public.abandoned_carts FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Trigger for updated_at
CREATE TRIGGER update_abandoned_carts_updated_at
BEFORE UPDATE ON public.abandoned_carts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for abandoned_carts
ALTER PUBLICATION supabase_realtime ADD TABLE public.abandoned_carts;
