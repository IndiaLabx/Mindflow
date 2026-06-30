-- Create Enum for Notification Target Audience
CREATE TYPE public.notification_target_audience AS ENUM ('all', 'competitive', 'school');

-- Create Enum for Notification Type
CREATE TYPE public.notification_type AS ENUM ('announcements', 'tests_quizzes', 'study_materials', 'daily_reminders');

-- Table: public.notifications (Global announcements)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type public.notification_type NOT NULL,
    target_audience public.notification_target_audience DEFAULT 'all',
    link TEXT, -- Optional URL to redirect when clicked
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Table: public.user_notifications (Tracks which user has read which global notification)
-- This approach prevents inserting a row for every single user when a global announcement is made.
-- We only insert a row when a user reads it, or if it's a personalized notification.
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, notification_id)
);

-- Table: public.notification_preferences (User settings)
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    push_enabled BOOLEAN DEFAULT false,
    email_enabled BOOLEAN DEFAULT false,
    categories JSONB DEFAULT '{"announcements": true, "tests_quizzes": true, "study_materials": true, "daily_reminders": true}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: public.push_subscriptions (Web Push endpoints)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    auth TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies

-- Notifications: Everyone can read. Only admins can insert/update/delete.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Admins can manage notifications" ON public.notifications
FOR ALL USING (auth.jwt() ->> 'email' = 'admin@mindflow.com');

-- User Notifications (Read Receipts): Users can only view and insert their own.
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their read receipts" ON public.user_notifications
FOR ALL USING (auth.uid() = user_id);

-- Preferences: Users manage their own.
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their preferences" ON public.notification_preferences
FOR ALL USING (auth.uid() = user_id);

-- Subscriptions: Users manage their own.
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their subscriptions" ON public.push_subscriptions
FOR ALL USING (auth.uid() = user_id);

-- Enable Realtime for notifications
alter publication supabase_realtime add table public.notifications;

-- Trigger to create default preferences on user creation (if needed, or handled in code)
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists before creating to prevent errors on multiple runs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_preferences') THEN
    CREATE TRIGGER on_auth_user_created_preferences
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_preferences();
  END IF;
END
$$;
