-- 1. Cleanup Legacy Data: Remove bloated 'activeQuestions' from existing JSONb state
UPDATE public.saved_quizzes
SET state = state - 'activeQuestions'
WHERE state ? 'activeQuestions';

-- 2. Define custom type for passing bridge data (question IDs and sort order)
DO $$ BEGIN
    CREATE TYPE public.quiz_question_input AS (
        question_id uuid,
        sort_order integer
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create Atomic RPC Function for Quiz Session Creation
CREATE OR REPLACE FUNCTION public.create_quiz_session(
    p_quiz_id uuid,
    p_user_id uuid,
    p_name text,
    p_created_at bigint,
    p_filters jsonb,
    p_mode text,
    p_state jsonb,
    p_questions public.quiz_question_input[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    q public.quiz_question_input;
BEGIN
    -- Start Transaction (Plpgsql functions run inside a transaction automatically, but this ensures explicit atomicity)

    -- Insert into saved_quizzes
    INSERT INTO public.saved_quizzes (
        id,
        user_id,
        name,
        created_at,
        filters,
        mode,
        state
    ) VALUES (
        p_quiz_id,
        p_user_id,
        p_name,
        p_created_at,
        p_filters,
        p_mode,
        p_state
    );

    -- Insert into bridge_saved_quiz_questions
    FOREACH q IN ARRAY p_questions LOOP
        INSERT INTO public.bridge_saved_quiz_questions (
            quiz_id,
            question_id,
            user_id,
            sort_order
        ) VALUES (
            p_quiz_id,
            q.question_id,
            p_user_id,
            q.sort_order
        );
    END LOOP;

END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_quiz_session TO authenticated;
