-- 1. Add Unique Constraint to enable strict database-level concurrency arbitration
ALTER TABLE public.quiz_history
DROP CONSTRAINT IF EXISTS unique_quiz_user_attempt;

ALTER TABLE public.quiz_history
ADD CONSTRAINT unique_quiz_user_attempt UNIQUE (quiz_id, user_id);

-- 2. Create the hardened, idempotent RPC
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
SET search_path = public -- Security Definer Hardening
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_history_id uuid;
BEGIN
    -- Ensure the user is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to submit a quiz session';
    END IF;

    -- Basic JSONB validation to prevent malformed payloads
    IF jsonb_typeof(p_final_state) != 'object' THEN
        RAISE EXCEPTION 'Invalid JSONB payload for final state';
    END IF;

    -- Update saved_quizzes state explicitly AND guard against re-finalizing
    UPDATE public.saved_quizzes
    SET
        state = p_final_state,
        status = 'result' -- Explicit relational state completion
    WHERE
        id = p_quiz_id
        AND user_id = v_user_id
        AND status != 'result'; -- Finalization Guard: Prevent mutating already completed quizzes

    -- If no row was updated, the quiz might not exist, doesn't belong to the user, or was ALREADY completed
    IF NOT FOUND THEN
        -- We don't raise an exception here anymore, because it might just be a retry of an already completed quiz.
        -- We will just proceed to the idempotent UPSERT below to ensure history is intact and return the ID.
    END IF;

    -- Generate a new ID, but we will rely on ON CONFLICT to ignore it if replacing an existing row
    v_history_id := gen_random_uuid();

    -- Strict Idempotent Upsert (Database acts as the referee for race conditions)
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
