
-- 1) Enrich demo project descriptions with structured multi-paragraph briefs
UPDATE public.marketplace_jobs
SET description =
  description ||
  E'\n\n— PROJECT SCOPE —\n' ||
  'We need a complete, production-ready output. The deliverables should match industry standard quality used by mid-to-large architecture studios in India. Please review the reference files attached to the project before sending your proposal.\n\n' ||
  E'— DELIVERABLES —\n' ||
  '• Final files in editable source format (where applicable)\n' ||
  '• High-resolution exports for presentation (PNG / JPG / PDF)\n' ||
  '• Layered organisation, named views/sheets, clean naming convention\n' ||
  '• Up to 2 rounds of revisions included in the bid\n\n' ||
  E'— WHAT WE WILL SHARE AFTER YOU''RE HIRED —\n' ||
  '• Site context, drawings, photos and reference imagery (locked until contract starts)\n' ||
  '• Direct WhatsApp / chat access for fast clarifications\n' ||
  '• A short briefing call to align on style and intent\n\n' ||
  E'— WHAT WE EXPECT FROM YOU —\n' ||
  '• Clear daily progress updates inside the contract chat\n' ||
  '• Honest delivery timeline — please do not over-promise\n' ||
  '• A short portfolio of similar past work in your proposal'
WHERE is_demo = true
  AND length(description) < 200;

-- 2) Attach 2–3 architectural reference images to every demo project
UPDATE public.marketplace_jobs SET attachments = ARRAY[
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&q=80'
] WHERE is_demo = true AND category ILIKE '%interior%';

UPDATE public.marketplace_jobs SET attachments = ARRAY[
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=80',
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1600&q=80',
  'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1600&q=80'
] WHERE is_demo = true AND (category ILIKE '%render%' OR category ILIKE '%visual%' OR category ILIKE '%3d%');

UPDATE public.marketplace_jobs SET attachments = ARRAY[
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1600&q=80',
  'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600&q=80',
  'https://images.unsplash.com/photo-1496564203457-11bb12075d90?w=1600&q=80'
] WHERE is_demo = true AND attachments = '{}'::text[];

-- 3) Privileged accessor — returns attachments only to authorised users
CREATE OR REPLACE FUNCTION public.get_project_attachments(p_job_id uuid)
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_client uuid;
  v_files text[];
  v_has_contract boolean;
BEGIN
  IF v_caller IS NULL THEN
    RETURN ARRAY[]::text[];
  END IF;

  SELECT client_id, attachments INTO v_client, v_files
  FROM public.marketplace_jobs
  WHERE id = p_job_id;

  IF v_files IS NULL THEN
    RETURN ARRAY[]::text[];
  END IF;

  -- Client always sees their own attachments
  IF v_caller = v_client THEN
    RETURN v_files;
  END IF;

  -- Admins always see
  IF public.has_role(v_caller, 'admin'::app_role) THEN
    RETURN v_files;
  END IF;

  -- Worker sees only after a contract has been created (proposal accepted)
  SELECT EXISTS (
    SELECT 1 FROM public.marketplace_contracts
    WHERE job_id = p_job_id AND worker_id = v_caller
  ) INTO v_has_contract;

  IF v_has_contract THEN
    RETURN v_files;
  END IF;

  RETURN ARRAY[]::text[];
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_project_attachments(uuid) TO authenticated, anon;
