-- Enable the pg_cron extension if it's not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the nightly cleanup job for hard deleting soft-deleted quizzes older than 30 days
-- '0 3 * * *' means it will run at 3:00 AM every day
SELECT cron.schedule(
    'nightly_quiz_cleanup',
    '0 3 * * *',
    $$
    DELETE FROM public.saved_quizzes
    WHERE deleted_at < NOW() - INTERVAL '30 days';
    $$
);
