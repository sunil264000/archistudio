
-- Create ebook pricing settings table
CREATE TABLE public.ebook_pricing_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_bundle_price INTEGER NOT NULL DEFAULT 1034,
  tier_1_max_books INTEGER NOT NULL DEFAULT 5,
  tier_1_price INTEGER NOT NULL DEFAULT 50,
  tier_2_max_books INTEGER NOT NULL DEFAULT 12,
  tier_2_price INTEGER NOT NULL DEFAULT 40,
  tier_3_max_books INTEGER NOT NULL DEFAULT 30,
  tier_3_price INTEGER NOT NULL DEFAULT 35,
  tier_4_price INTEGER NOT NULL DEFAULT 27,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.ebook_pricing_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read pricing
CREATE POLICY "Anyone can view pricing settings" 
ON public.ebook_pricing_settings FOR SELECT 
USING (true);

-- Only admins can update
CREATE POLICY "Admins can manage pricing settings" 
ON public.ebook_pricing_settings FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert default pricing
INSERT INTO public.ebook_pricing_settings (
  full_bundle_price, 
  tier_1_max_books, tier_1_price,
  tier_2_max_books, tier_2_price,
  tier_3_max_books, tier_3_price,
  tier_4_price
) VALUES (1034, 5, 50, 12, 40, 30, 35, 27);
