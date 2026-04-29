
-- Update global_search function to include image_url
CREATE OR REPLACE FUNCTION public.global_search(search_query TEXT, result_limit INTEGER DEFAULT 20)
RETURNS TABLE(
  result_type TEXT,
  result_id TEXT,
  title TEXT,
  description TEXT,
  slug TEXT,
  image_url TEXT,
  relevance REAL
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Courses
  SELECT 'course'::TEXT, id::TEXT, c.title, c.short_description, c.slug, c.thumbnail_url,
    ts_rank(to_tsvector('english', coalesce(c.title,'') || ' ' || coalesce(c.description,'') || ' ' || coalesce(c.short_description,'')), plainto_tsquery('english', search_query)) as relevance
  FROM public.courses c
  WHERE c.is_published = true
    AND to_tsvector('english', coalesce(c.title,'') || ' ' || coalesce(c.description,'') || ' ' || coalesce(c.short_description,''))
    @@ plainto_tsquery('english', search_query)

  UNION ALL

  -- Forum topics
  SELECT 'forum'::TEXT, ft.id::TEXT, ft.title, LEFT(ft.content, 200), ft.id::TEXT, NULL as image_url,
    ts_rank(to_tsvector('english', coalesce(ft.title,'') || ' ' || coalesce(ft.content,'')), plainto_tsquery('english', search_query))
  FROM public.forum_topics ft
  WHERE to_tsvector('english', coalesce(ft.title,'') || ' ' || coalesce(ft.content,''))
    @@ plainto_tsquery('english', search_query)

  UNION ALL

  -- Blog posts
  SELECT 'blog'::TEXT, bp.id::TEXT, bp.title, bp.excerpt, bp.slug, bp.featured_image_url,
    ts_rank(to_tsvector('english', coalesce(bp.title,'') || ' ' || coalesce(bp.content,'')), plainto_tsquery('english', search_query))
  FROM public.blog_posts bp
  WHERE bp.is_published = true
    AND to_tsvector('english', coalesce(bp.title,'') || ' ' || coalesce(bp.content,''))
    @@ plainto_tsquery('english', search_query)

  UNION ALL

  -- Ebooks
  SELECT 'ebook'::TEXT, eb.id::TEXT, eb.title, eb.description, eb.id::TEXT, eb.cover_image_url,
    ts_rank(to_tsvector('english', coalesce(eb.title,'') || ' ' || coalesce(eb.description,'')), plainto_tsquery('english', search_query))
  FROM public.ebooks eb
  WHERE eb.is_published = true
    AND to_tsvector('english', coalesce(eb.title,'') || ' ' || coalesce(eb.description,''))
    @@ plainto_tsquery('english', search_query)

  ORDER BY relevance DESC
  LIMIT result_limit;
$$;
