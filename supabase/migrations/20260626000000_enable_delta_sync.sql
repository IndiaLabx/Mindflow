-- 1. Ensure moddatetime extension exists
CREATE EXTENSION IF NOT EXISTS moddatetime schema extensions;

-- 2. Add updated_at to static dictionary tables if they don't exist
ALTER TABLE public.idiom ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.ows ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Add triggers to automatically update the updated_at column on modification
DROP TRIGGER IF EXISTS handle_updated_at ON public.idiom;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.idiom
  FOR EACH ROW
  EXECUTE PROCEDURE moddatetime (updated_at);

DROP TRIGGER IF EXISTS handle_updated_at ON public.ows;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.ows
  FOR EACH ROW
  EXECUTE PROCEDURE moddatetime (updated_at);

-- 4. Update RPC: Idioms Delta Sync
CREATE OR REPLACE FUNCTION public.get_filtered_idiom_metadata(
    p_user_id UUID,
    p_last_sync TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    id TEXT,
    phrase TEXT,
    source_pdf TEXT,
    exam_year TEXT,
    difficulty TEXT,
    image_url TEXT,
    is_read BOOLEAN,
    status TEXT,
    next_review_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        i.id::TEXT as id,
        i.phrase,
        i.source_pdf,
        i.exam_year::TEXT as exam_year,
        i.difficulty,
        i.image_url,
        u.is_read,
        u.status,
        u.next_review_at
    FROM
        public.idiom i
    LEFT JOIN
        public.user_idiom_interactions u ON u.idiom_id::TEXT = i.id::TEXT AND u.user_id = p_user_id
    WHERE
        (p_last_sync IS NULL)
        OR (i.updated_at > p_last_sync)
        OR (u.updated_at > p_last_sync);
$$;

-- 5. Update RPC: OWS Delta Sync
CREATE OR REPLACE FUNCTION public.get_filtered_ows_metadata(
    p_user_id UUID,
    p_last_sync TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    id TEXT,
    word TEXT,
    source_pdf TEXT,
    exam_year TEXT,
    difficulty TEXT,
    theme TEXT,
    image_url TEXT,
    is_read BOOLEAN,
    status TEXT,
    next_review_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        o.id::TEXT as id,
        o.word,
        o.source_pdf,
        o.exam_year::TEXT as exam_year,
        o.difficulty,
        o.theme,
        o.image_url,
        u.is_read,
        u.status,
        u.next_review_at
    FROM
        public.ows o
    LEFT JOIN
        public.user_ows_interactions u ON u.word_id::TEXT = o.id::TEXT AND u.user_id = p_user_id
    WHERE
        (p_last_sync IS NULL)
        OR (o.updated_at > p_last_sync)
        OR (u.updated_at > p_last_sync);
$$;

-- 6. Create RPC: Synonyms Delta Sync (Unifying the architecture)
CREATE OR REPLACE FUNCTION public.get_filtered_synonym_metadata(
    p_user_id UUID,
    p_last_sync TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    id TEXT,
    word TEXT,
    is_read BOOLEAN,
    status TEXT,
    next_review_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        s.id::TEXT as id,
        s.word,
        u.is_read,
        u.status,
        u.next_review_at
    FROM
        public.synonym s
    LEFT JOIN
        public.user_synonym_interactions u ON u.word_id::TEXT = s.id::TEXT AND u.user_id = p_user_id
    WHERE
        (p_last_sync IS NULL)
        OR (s.updated_at > p_last_sync)
        OR (u.updated_at > p_last_sync);
$$;
