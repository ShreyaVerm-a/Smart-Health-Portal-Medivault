-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable the pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule the medicine reminder check to run every 5 minutes
SELECT cron.schedule(
  'check-medicine-reminders-every-5-minutes',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://zyvgdptebvkxmihgiszr.supabase.co/functions/v1/check-medicine-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dmdkcHRlYnZreG1paGdpc3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjAyMzUsImV4cCI6MjA3MDMzNjIzNX0.OvBX59jBg9_QjlLOfjPNQ-V80NKl-Td6DFYyBhw3U70"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);