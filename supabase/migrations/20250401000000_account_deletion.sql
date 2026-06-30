-- Enable pg_cron extension if not exists
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Add soft delete columns to public.profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS delete_requested_at timestamp with time zone;

-- Update the foreign key constraint on public.profiles to CASCADE on delete
-- First, drop the existing constraint
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Then, add it back with ON DELETE CASCADE
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Create a function to delete users who requested deletion 7+ days ago
CREATE OR REPLACE FUNCTION delete_scheduled_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Ensures it runs with elevated privileges to modify auth.users
AS $$
BEGIN
    DELETE FROM auth.users
    WHERE id IN (
        SELECT id
        FROM public.profiles
        WHERE status = 'pending_deletion'
          AND delete_requested_at < NOW() - INTERVAL '7 days'
    );
END;
$$;

-- Schedule the cron job to run daily at midnight
-- It calls the function we just created
SELECT cron.schedule(
    'delete-scheduled-users-daily', -- Job name
    '0 0 * * *',                   -- Cron expression (daily at midnight)
    $$SELECT delete_scheduled_users();$$ -- Command to execute
);
