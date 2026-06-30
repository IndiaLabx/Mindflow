CREATE TABLE IF NOT EXISTS public.analytics_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_name text NOT NULL,
    event_data jsonb,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated inserts" ON public.analytics_events
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow anon inserts" ON public.analytics_events
FOR INSERT TO anon WITH CHECK (true);

GRANT INSERT ON TABLE public.analytics_events TO authenticated;
GRANT INSERT ON TABLE public.analytics_events TO anon;
