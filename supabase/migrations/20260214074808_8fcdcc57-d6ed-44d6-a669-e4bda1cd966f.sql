
-- Enable pg_net for HTTP calls from database
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Cron job: auto-migrate batch of 50 every 2 minutes
SELECT cron.schedule(
  'auto-migrate-lulustream',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ddvfcymvhnlvqcbhozpc.supabase.co/functions/v1/migrate-to-lulustream',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkdmZjeW12aG5sdnFjYmhvenBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MzkwMzUsImV4cCI6MjA4NDMxNTAzNX0.oPBKv2N0jJSUbG5b-YbTqC1edDVqVHayku6RRa34uGk"}'::jsonb,
    body := '{"action": "migrate", "batchSize": 50}'::jsonb
  );
  $$
);

-- Cron job: check upload progress every 3 minutes
SELECT cron.schedule(
  'check-progress-lulustream',
  '*/3 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ddvfcymvhnlvqcbhozpc.supabase.co/functions/v1/migrate-to-lulustream',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkdmZjeW12aG5sdnFjYmhvenBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MzkwMzUsImV4cCI6MjA4NDMxNTAzNX0.oPBKv2N0jJSUbG5b-YbTqC1edDVqVHayku6RRa34uGk"}'::jsonb,
    body := '{"action": "check-progress"}'::jsonb
  );
  $$
);
