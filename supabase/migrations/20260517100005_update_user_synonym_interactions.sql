-- Migration: update_user_synonym_interactions to align with OWS/Idioms schema

CREATE TABLE IF NOT EXISTS public.user_synonym_interactions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    word_id uuid NOT NULL,
    mastery_level text NOT NULL DEFAULT 'new'::text,
    daily_challenge_score integer DEFAULT 0,
    gamification_score integer DEFAULT 0,
    viewed_explanation boolean DEFAULT false,
    viewed_word_family boolean DEFAULT false,
    last_interacted_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_synonym_interactions_pkey PRIMARY KEY (id),
    CONSTRAINT user_synonym_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT user_synonym_interactions_word_id_fkey FOREIGN KEY (word_id) REFERENCES public.synonym (id) ON DELETE CASCADE,
    CONSTRAINT user_synonym_interactions_user_id_word_id_key UNIQUE (user_id, word_id),
    CONSTRAINT user_synonym_interactions_mastery_level_check CHECK (mastery_level = ANY (ARRAY['new'::text, 'familiar'::text, 'mastered'::text]))
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_synonym_interactions_user_id ON public.user_synonym_interactions USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_user_synonym_interactions_word_id ON public.user_synonym_interactions USING btree (word_id) TABLESPACE pg_default;

ALTER TABLE public.user_synonym_interactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own synonym interactions" ON public.user_synonym_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can select their own synonym interactions" ON public.user_synonym_interactions FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own synonym interactions" ON public.user_synonym_interactions FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete their own synonym interactions" ON public.user_synonym_interactions FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create the ENUM type for synonym_status if it does not exist
DO $$ BEGIN
    CREATE TYPE public.synonym_status AS ENUM ('mastered', 'tricky', 'review', 'clueless', 'unseen');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to user_synonym_interactions
ALTER TABLE public.user_synonym_interactions
ADD COLUMN IF NOT EXISTS is_read boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS status public.synonym_status NULL,
ADD COLUMN IF NOT EXISTS next_review_at timestamp with time zone NULL,
ADD COLUMN IF NOT EXISTS swipe_velocity double precision NULL,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NULL DEFAULT timezone('utc'::text, now());

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = timezone('utc'::text, now());
   RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  CREATE TRIGGER update_user_synonym_interactions_updated_at
  BEFORE UPDATE ON public.user_synonym_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
