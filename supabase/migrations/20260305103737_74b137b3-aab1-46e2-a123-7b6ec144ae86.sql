
-- Download requests table
CREATE TABLE public.download_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ebook_id UUID NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  price_set INTEGER,
  admin_note TEXT,
  payment_order_id TEXT,
  payment_verified BOOLEAN DEFAULT false,
  download_granted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.download_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own download requests"
ON public.download_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own download requests"
ON public.download_requests FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all download requests"
ON public.download_requests FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Update trigger
CREATE TRIGGER set_download_requests_updated_at
BEFORE UPDATE ON public.download_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
