
-- ==============================================
-- PERFORMANCE INDEXES FOR 10M+ USER SCALE
-- ==============================================

-- Enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status ON public.enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_status ON public.enrollments(course_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON public.enrollments(user_id, course_id);

-- Progress (no course_id column)
CREATE INDEX IF NOT EXISTS idx_progress_user_lesson ON public.progress(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_progress_completed ON public.progress(user_id, completed) WHERE completed = true;

-- Courses
CREATE INDEX IF NOT EXISTS idx_courses_published_order ON public.courses(is_published, order_index) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_courses_featured ON public.courses(is_featured, is_published) WHERE is_featured = true AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category_id, is_published);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);

-- Lessons & Modules
CREATE INDEX IF NOT EXISTS idx_lessons_module_order ON public.lessons(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_modules_course_order ON public.modules(course_id, order_index);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON public.payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_order ON public.payments(gateway_order_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- Activity
CREATE INDEX IF NOT EXISTS idx_activity_user_date ON public.activity_history(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_type ON public.activity_history(activity_type, started_at DESC);

-- Community
CREATE INDEX IF NOT EXISTS idx_community_feed_created ON public.community_feed(created_at DESC);

-- Forum
CREATE INDEX IF NOT EXISTS idx_forum_topics_category ON public.forum_topics(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_answers_topic ON public.forum_answers(topic_id, created_at);

-- Profiles (auth critical path)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- User roles (RLS performance)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);

-- Certificates
CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON public.certificates(certificate_number);

-- Streaks
CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON public.user_streaks(user_id);

-- AI chat
CREATE INDEX IF NOT EXISTS idx_ai_chat_user_created ON public.ai_chat_history(user_id, created_at DESC);

-- Job queue
CREATE INDEX IF NOT EXISTS idx_job_queue_status_priority ON public.job_queue(status, priority, scheduled_for) WHERE status = 'pending';

-- Platform events
CREATE INDEX IF NOT EXISTS idx_platform_events_unprocessed ON public.platform_events(processed, created_at) WHERE processed = false;

-- Analytics
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_time ON public.analytics_events(event_type, created_at DESC);

-- Abandoned carts
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_recovered ON public.abandoned_carts(recovered, email_sent, created_at);

-- ==============================================
-- INFRASTRUCTURE TABLES
-- ==============================================

-- Rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  bucket_key TEXT NOT NULL,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(identifier, bucket_key)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON public.rate_limit_buckets(identifier, bucket_key, window_start);

-- Cache table for hot data
CREATE TABLE IF NOT EXISTS public.server_cache (
  cache_key TEXT PRIMARY KEY,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_server_cache_expires ON public.server_cache(expires_at);

-- RLS
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cache" ON public.server_cache FOR SELECT USING (expires_at > now());

-- Cache functions
CREATE OR REPLACE FUNCTION public.upsert_cache(p_key TEXT, p_value JSONB, p_ttl_seconds INTEGER DEFAULT 300)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.server_cache (cache_key, cache_value, expires_at)
  VALUES (p_key, p_value, now() + (p_ttl_seconds || ' seconds')::INTERVAL)
  ON CONFLICT (cache_key) DO UPDATE SET cache_value = EXCLUDED.cache_value, expires_at = EXCLUDED.expires_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.server_cache WHERE expires_at < now();
  DELETE FROM public.rate_limit_buckets WHERE window_start < now() - INTERVAL '1 hour';
END;
$$;

-- Rate limit function
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_identifier TEXT, p_bucket_key TEXT, p_max_requests INTEGER, p_window_seconds INTEGER)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_bucket RECORD;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := now() - (p_window_seconds || ' seconds')::INTERVAL;

  INSERT INTO public.rate_limit_buckets (identifier, bucket_key, request_count, window_start)
  VALUES (p_identifier, p_bucket_key, 1, now())
  ON CONFLICT (identifier, bucket_key) DO UPDATE
    SET request_count = CASE 
          WHEN rate_limit_buckets.window_start < v_window_start THEN 1
          ELSE rate_limit_buckets.request_count + 1
        END,
        window_start = CASE
          WHEN rate_limit_buckets.window_start < v_window_start THEN now()
          ELSE rate_limit_buckets.window_start
        END
  RETURNING * INTO v_bucket;

  RETURN jsonb_build_object(
    'allowed', v_bucket.request_count <= p_max_requests,
    'count', v_bucket.request_count,
    'limit', p_max_requests,
    'reset_at', v_bucket.window_start + (p_window_seconds || ' seconds')::INTERVAL
  );
END;
$$;
