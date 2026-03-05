CREATE TABLE public.admin_purchase_digest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_email text NOT NULL,
  buyer_name text,
  item_type text NOT NULL DEFAULT 'course',
  item_name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  order_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  digest_sent boolean NOT NULL DEFAULT false
);

ALTER TABLE public.admin_purchase_digest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage purchase digest"
ON public.admin_purchase_digest
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage purchase digest"
ON public.admin_purchase_digest
FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);