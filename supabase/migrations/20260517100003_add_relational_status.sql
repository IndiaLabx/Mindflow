-- 1. Add Explicit Relational Columns
ALTER TABLE public.saved_quizzes
ADD COLUMN IF NOT EXISTS status text DEFAULT 'quiz';

ALTER TABLE public.saved_quizzes
ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- 2. Backfill existing data from JSONB
UPDATE public.saved_quizzes
SET status = COALESCE(state->>'status', 'quiz')
WHERE status = 'quiz' OR status IS NULL;

-- 3. Update RPC to use the new relational columns
CREATE OR REPLACE FUNCTION public.submit_quiz_session(
    p_quiz_id uuid,
    p_final_state jsonb,
    p_total_questions integer,
    p_total_correct integer,
    p_total_incorrect integer,
    p_total_skipped integer,
    p_time_taken double precision,
    p_overall_accuracy integer,
    p_difficulty text,
    p_subject_stats jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_history_id uuid;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to submit a quiz session';
    END IF;

    IF jsonb_typeof(p_final_state) != 'object' THEN
        RAISE EXCEPTION 'Invalid JSONB payload for final state';
    END IF;

    -- Update saved_quizzes explicitly using the new relational columns
    UPDATE public.saved_quizzes
    SET
        state = p_final_state,
        status = 'result',
        completed_at = now()
    WHERE
        id = p_quiz_id
        AND user_id = v_user_id
        AND status IS DISTINCT FROM 'result'; -- Finalization Guard on relational column

    IF NOT FOUND THEN
        -- Might be a retry of an already completed quiz. Proceed to upsert.
    END IF;

    v_history_id := gen_random_uuid();

    -- Strict Idempotent Upsert
    INSERT INTO public.quiz_history (
        id,
        quiz_id,
        user_id,
        date,
        total_questions,
        total_correct,
        total_incorrect,
        total_skipped,
        total_time_spent,
        overall_accuracy,
        difficulty,
        subject_stats
    ) VALUES (
        v_history_id,
        p_quiz_id,
        v_user_id,
        (extract(epoch from now()) * 1000)::bigint,
        p_total_questions,
        p_total_correct,
        p_total_incorrect,
        p_total_skipped,
        p_time_taken,
        p_overall_accuracy,
        p_difficulty,
        p_subject_stats
    )
    ON CONFLICT (quiz_id, user_id)
    DO UPDATE SET
        date = (extract(epoch from now()) * 1000)::bigint,
        total_questions = EXCLUDED.total_questions,
        total_correct = EXCLUDED.total_correct,
        total_incorrect = EXCLUDED.total_incorrect,
        total_skipped = EXCLUDED.total_skipped,
        total_time_spent = EXCLUDED.total_time_spent,
        overall_accuracy = EXCLUDED.overall_accuracy,
        difficulty = EXCLUDED.difficulty,
        subject_stats = EXCLUDED.subject_stats
    RETURNING id INTO v_history_id;

    RETURN v_history_id;

END;
$$;
