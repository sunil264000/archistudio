-- Drop the overly permissive policy that allows anyone to read all certificates
DROP POLICY IF EXISTS "Anyone can verify certificates by number" ON public.certificates;