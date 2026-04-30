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
  q text := trim(search_query);
  ts_q tsquery;
  like_q text;
BEGIN
  IF q = '' OR q IS NULL THEN
    RETURN;
  END IF;

  BEGIN
    ts_q := to_tsquery(
      'english',
      regexp_replace(
        regexp_replace(q, '[^a-zA-Z0-9\s]', ' ', 'g'),
        '\s+', ':* & ', 'g'
      ) || ':*'
    );
  EXCEPTION WHEN OTHERS THEN
    ts_q := plainto_tsquery('english', q);
  END;

  like_q := '%' || q || '%';

  RETURN QUERY
  SELECT 'course'::text, c.id::text, c.title,
         c.short_description, c.slug,
         c.thumbnail_url,
         GREATEST(
           ts_rank(to_tsvector('english',
             coalesce(c.title,'') || ' ' || coalesce(c.description,'') || ' ' || coalesce(c.short_description,'')), ts_q),
           CASE WHEN c.title ILIKE like_q THEN 0.5 ELSE 0 END
         )::real
  FROM public.courses c
  WHERE c.is_published = true
    AND (
      to_tsvector('english',
        coalesce(c.title,'') || ' ' || coalesce(c.description,'') || ' ' || coalesce(c.short_description,'')) @@ ts_q
      OR c.title ILIKE like_q
      OR coalesce(c.short_description,'') ILIKE like_q
    )

  UNION ALL

  SELECT 'forum'::text, ft.id::text, ft.title,
         LEFT(ft.content, 200), ft.id::text,
         NULL::text,
         GREATEST(
           ts_rank(to_tsvector('english', coalesce(ft.title,'') || ' ' || coalesce(ft.content,'')), ts_q),
           CASE WHEN ft.title ILIKE like_q THEN 0.4 ELSE 0 END
         )::real
  FROM public.forum_topics ft
  WHERE to_tsvector('english', coalesce(ft.title,'') || ' ' || coalesce(ft.content,'')) @@ ts_q
     OR ft.title ILIKE like_q

  UNION ALL

  SELECT 'blog'::text, bp.id::text, bp.title,
         bp.excerpt, bp.slug,
         bp.featured_image_url,
         GREATEST(
           ts_rank(to_tsvector('english', coalesce(bp.title,'') || ' ' || coalesce(bp.content,'')), ts_q),
           CASE WHEN bp.title ILIKE like_q THEN 0.4 ELSE 0 END
         )::real
  FROM public.blog_posts bp
  WHERE bp.is_published = true
    AND (
      to_tsvector('english', coalesce(bp.title,'') || ' ' || coalesce(bp.content,'')) @@ ts_q
      OR bp.title ILIKE like_q
    )

  UNION ALL

  SELECT 'ebook'::text, eb.id::text, eb.title,
         eb.description, eb.id::text,
         eb.cover_image_url,
         GREATEST(
           ts_rank(to_tsvector('english', coalesce(eb.title,'') || ' ' || coalesce(eb.description,'')), ts_q),
           CASE WHEN eb.title ILIKE like_q THEN 0.4 ELSE 0 END
         )::real
  FROM public.ebooks eb
  WHERE eb.is_published = true
    AND (
      to_tsvector('english', coalesce(eb.title,'') || ' ' || coalesce(eb.description,'')) @@ ts_q
      OR eb.title ILIKE like_q
    )

  ORDER BY relevance DESC
  LIMIT result_limit;
END;
$function$;