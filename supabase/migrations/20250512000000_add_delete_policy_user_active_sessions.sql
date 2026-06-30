-- Add DELETE policy for user_active_sessions so users can sign out from their devices
CREATE POLICY "Users can delete their own active session"
ON public.user_active_sessions FOR DELETE
USING (auth.uid() = user_id);
