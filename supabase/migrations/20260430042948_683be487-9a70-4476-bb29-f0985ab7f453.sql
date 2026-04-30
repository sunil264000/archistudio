CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_courses_global_search_tsv
ON public.courses
USING gin (to_tsvector('english'::regconfig, coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(short_description,'')));

CREATE INDEX IF NOT EXISTS idx_courses_title_trgm
ON public.courses
USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_courses_short_description_trgm
ON public.courses
USING gin (short_description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_forum_topics_global_search_tsv
ON public.forum_topics
USING gin (to_tsvector('english'::regconfig, coalesce(title,'') || ' ' || coalesce(content,'')));

CREATE INDEX IF NOT EXISTS idx_forum_topics_title_trgm
ON public.forum_topics
USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_blog_posts_global_search_tsv
ON public.blog_posts
USING gin (to_tsvector('english'::regconfig, coalesce(title,'') || ' ' || coalesce(content,'')));

CREATE INDEX IF NOT EXISTS idx_blog_posts_title_trgm
ON public.blog_posts
USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_ebooks_global_search_tsv
ON public.ebooks
USING gin (to_tsvector('english'::regconfig, coalesce(title,'') || ' ' || coalesce(description,'')));

CREATE INDEX IF NOT EXISTS idx_ebooks_title_trgm
ON public.ebooks
USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_marketplace_jobs_global_search_tsv
ON public.marketplace_jobs
USING gin (to_tsvector('english'::regconfig, coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(category,'')));

CREATE INDEX IF NOT EXISTS idx_marketplace_jobs_title_trgm
ON public.marketplace_jobs
USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_marketplace_jobs_category_trgm
ON public.marketplace_jobs
USING gin (category gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_marketplace_jobs_skills_required_gin
ON public.marketplace_jobs
USING gin (skills_required);

DROP FUNCTION IF EXISTS public.global_search(text, integer);

CREATE OR REPLACE FUNCTION public.global_search(search_query text, result_limit integer DEFAULT 20)
RETURNS TABLE(
  result_type text,
  result_id text,
  title text,
  description text,
  slug text,
  image_url text,
  relevance real
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  q text := trim(coalesce(search_query, ''));
  clean_q text;
  ts_q tsquery;
  like_q text;
BEGIN
  IF q = '' THEN
    RETURN;
  END IF;

  clean_q := trim(regexp_replace(q, '[^a-zA-Z0-9\s]', ' ', 'g'));

  IF clean_q = '' THEN
    RETURN;
  END IF;

  BEGIN
    ts_q := to_tsquery(
      'english',
      regexp_replace(clean_q, '\s+', ':* & ', 'g') || ':*'
    );
  EXCEPTION WHEN OTHERS THEN
    ts_q := plainto_tsquery('english', clean_q);
  END;

  like_q := '%' || q || '%';

  RETURN QUERY
  SELECT s.result_type, s.result_id, s.title, s.description, s.slug, s.image_url, s.relevance
  FROM (
    SELECT 'course'::text AS result_type,
           c.id::text AS result_id,
           c.title::text AS title,
           c.short_description::text AS description,
           c.slug::text AS slug,
           c.thumbnail_url::text AS image_url,
           GREATEST(
             ts_rank(to_tsvector('english'::regconfig, coalesce(c.title,'') || ' ' || coalesce(c.description,'') || ' ' || coalesce(c.short_description,'')), ts_q),
             CASE WHEN c.title ILIKE like_q THEN 0.65 ELSE 0 END,
             CASE WHEN coalesce(c.short_description,'') ILIKE like_q THEN 0.35 ELSE 0 END
           )::real AS relevance
    FROM public.courses c
    WHERE c.is_published = true
      AND (
        to_tsvector('english'::regconfig, coalesce(c.title,'') || ' ' || coalesce(c.description,'') || ' ' || coalesce(c.short_description,'')) @@ ts_q
        OR c.title ILIKE like_q
        OR coalesce(c.short_description,'') ILIKE like_q
      )

    UNION ALL

    SELECT 'project'::text AS result_type,
           mj.id::text AS result_id,
           mj.title::text AS title,
           left(mj.description, 220)::text AS description,
           mj.id::text AS slug,
           NULL::text AS image_url,
           GREATEST(
             ts_rank(to_tsvector('english'::regconfig, coalesce(mj.title,'') || ' ' || coalesce(mj.description,'') || ' ' || coalesce(mj.category,'')), ts_q),
             CASE WHEN mj.title ILIKE like_q THEN 0.6 ELSE 0 END,
             CASE WHEN mj.category ILIKE like_q THEN 0.4 ELSE 0 END,
             CASE WHEN array_to_string(mj.skills_required, ' ') ILIKE like_q THEN 0.45 ELSE 0 END
           )::real AS relevance
    FROM public.marketplace_jobs mj
    WHERE mj.visibility = 'public'
      AND mj.status = 'open'
      AND (
        to_tsvector('english'::regconfig, coalesce(mj.title,'') || ' ' || coalesce(mj.description,'') || ' ' || coalesce(mj.category,'')) @@ ts_q
        OR mj.title ILIKE like_q
        OR mj.category ILIKE like_q
        OR array_to_string(mj.skills_required, ' ') ILIKE like_q
      )

    UNION ALL

    SELECT 'forum'::text AS result_type,
           ft.id::text AS result_id,
           ft.title::text AS title,
           left(ft.content, 200)::text AS description,
           ft.id::text AS slug,
           NULL::text AS image_url,
           GREATEST(
             ts_rank(to_tsvector('english'::regconfig, coalesce(ft.title,'') || ' ' || coalesce(ft.content,'')), ts_q),
             CASE WHEN ft.title ILIKE like_q THEN 0.4 ELSE 0 END
           )::real AS relevance
    FROM public.forum_topics ft
    WHERE to_tsvector('english'::regconfig, coalesce(ft.title,'') || ' ' || coalesce(ft.content,'')) @@ ts_q
       OR ft.title ILIKE like_q

    UNION ALL

    SELECT 'blog'::text AS result_type,
           bp.id::text AS result_id,
           bp.title::text AS title,
           bp.excerpt::text AS description,
           bp.slug::text AS slug,
           bp.featured_image_url::text AS image_url,
           GREATEST(
             ts_rank(to_tsvector('english'::regconfig, coalesce(bp.title,'') || ' ' || coalesce(bp.content,'')), ts_q),
             CASE WHEN bp.title ILIKE like_q THEN 0.4 ELSE 0 END
           )::real AS relevance
    FROM public.blog_posts bp
    WHERE bp.is_published = true
      AND (
        to_tsvector('english'::regconfig, coalesce(bp.title,'') || ' ' || coalesce(bp.content,'')) @@ ts_q
        OR bp.title ILIKE like_q
      )

    UNION ALL

    SELECT 'ebook'::text AS result_type,
           eb.id::text AS result_id,
           eb.title::text AS title,
           eb.description::text AS description,
           eb.id::text AS slug,
           eb.cover_image_url::text AS image_url,
           GREATEST(
             ts_rank(to_tsvector('english'::regconfig, coalesce(eb.title,'') || ' ' || coalesce(eb.description,'')), ts_q),
             CASE WHEN eb.title ILIKE like_q THEN 0.4 ELSE 0 END
           )::real AS relevance
    FROM public.ebooks eb
    WHERE eb.is_published = true
      AND (
        to_tsvector('english'::regconfig, coalesce(eb.title,'') || ' ' || coalesce(eb.description,'')) @@ ts_q
        OR eb.title ILIKE like_q
      )
  ) s
  WHERE s.relevance > 0
  ORDER BY s.relevance DESC, s.title ASC
  LIMIT least(greatest(result_limit, 1), 50);
END;
$function$;