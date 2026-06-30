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

CREATE POLICY "Users can insert their own synonym interactions" ON public.user_synonym_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own synonym interactions" ON public.user_synonym_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own synonym interactions" ON public.user_synonym_interactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own synonym interactions" ON public.user_synonym_interactions
    FOR DELETE USING (auth.uid() = user_id);
