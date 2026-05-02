-- Setup pg_cron to call the edge function daily at midnight
-- Note: pg_net extension must be enabled for this to work on Supabase.
-- Note: Replace the PROJECT_REF placeholder with the actual project URL during deployment.

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'ai-internship-auto-approve',
  '0 0 * * *', -- Run at midnight every day
  $$
  SELECT net.http_post(
    url := 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/cron-internship-ai-reviewer',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer [YOUR_ANON_KEY]"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 15000
  );
  $$
);
