-- Create the user_active_sessions table to manage concurrent sessions
CREATE TABLE IF NOT EXISTS public.user_active_sessions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token UUID NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_active_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies so users can only access their own session row
CREATE POLICY "Users can view their own active session"
ON public.user_active_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own active session"
ON public.user_active_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own active session"
ON public.user_active_sessions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure the table is added to the publication for Realtime to work
BEGIN;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'user_active_sessions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.user_active_sessions;
    END IF;
  END
  $$;
COMMIT;
