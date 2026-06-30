-- Enum for report status
CREATE TYPE report_status AS ENUM ('pending', 'being_reviewed', 'resolved', 'ignored');

-- Reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type TEXT NOT NULL DEFAULT 'user',
    target_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    custom_note TEXT CHECK (char_length(custom_note) <= 500),
    evidence_data JSONB NOT NULL,
    status report_status NOT NULL DEFAULT 'pending',
    admin_conclusion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trust_score INT DEFAULT 100,
ADD COLUMN IF NOT EXISTS shadow_flagged BOOLEAN DEFAULT FALSE;

-- Trigger function for shadow flagging
CREATE OR REPLACE FUNCTION check_and_shadow_flag_user()
RETURNS TRIGGER AS $$
DECLARE
    pending_reporters_count INT;
BEGIN
    -- Only check for 'user' target_type
    IF NEW.target_type = 'user' AND NEW.status = 'pending' THEN
        -- Count distinct reporters who have pending reports against this target
        SELECT COUNT(DISTINCT reporter_id) INTO pending_reporters_count
        FROM public.reports
        WHERE target_id = NEW.target_id
          AND target_type = 'user'
          AND status = 'pending';

        -- If 5 or more distinct reporters, flag the user
        IF pending_reporters_count >= 5 THEN
            UPDATE public.profiles
            SET shadow_flagged = TRUE
            WHERE id = NEW.target_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on reports table
DROP TRIGGER IF EXISTS trigger_shadow_flag_user ON public.reports;
CREATE TRIGGER trigger_shadow_flag_user
AFTER INSERT ON public.reports
FOR EACH ROW
EXECUTE FUNCTION check_and_shadow_flag_user();

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Reporters can SELECT their own reports
CREATE POLICY "Reporters can view own reports" ON public.reports
    FOR SELECT USING (auth.uid() = reporter_id);

-- Reporters can INSERT their own reports
CREATE POLICY "Reporters can insert own reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Admins can SELECT all reports
CREATE POLICY "Admins can view all reports" ON public.reports
    FOR SELECT USING ((auth.jwt() ->> 'email'::text) = 'admin@mindflow.com'::text);

-- Admins can UPDATE all reports
CREATE POLICY "Admins can update all reports" ON public.reports
    FOR UPDATE USING ((auth.jwt() ->> 'email'::text) = 'admin@mindflow.com'::text);
