-- Fix the RLS policies and table structures for the newly created tables.
-- The previous migration had some issues with RLS policies and missing tables/columns.

-- We need to ensure that the notification_preferences and push_subscriptions tables have correct RLS policies.
-- And we need to fix the 'Admins can insert notifications' policy.

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
  CREATE POLICY "Admins can manage notifications" ON public.notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'admin@mindflow.com'
    )
  );
EXCEPTION WHEN undefined_object THEN null; END $$;

-- Fix User Notifications RLS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their read receipts" ON public.user_notifications;
  CREATE POLICY "Users can manage their read receipts" ON public.user_notifications
  FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN undefined_object THEN null; END $$;

-- Fix Preferences RLS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their preferences" ON public.notification_preferences;
  CREATE POLICY "Users can manage their preferences" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN undefined_object THEN null; END $$;

-- Fix Subscriptions RLS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their subscriptions" ON public.push_subscriptions;
  CREATE POLICY "Users can manage their subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN undefined_object THEN null; END $$;

-- Enable Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
