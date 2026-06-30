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
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_history_id uuid := gen_random_uuid();
BEGIN
    -- Ensure the user is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to submit a quiz session';
    END IF;

    -- Update saved_quizzes state and set status to 'result'
    UPDATE public.saved_quizzes
    SET state = p_final_state,
        status = 'result'
    WHERE id = p_quiz_id AND user_id = v_user_id;

    -- If no row was updated, the quiz might not exist or doesn't belong to the user
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quiz not found or unauthorized';
    END IF;

    -- Insert into quiz_history
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
        now(),
        p_total_questions,
        p_total_correct,
        p_total_incorrect,
        p_total_skipped,
        p_time_taken,
        p_overall_accuracy,
        p_difficulty,
        p_subject_stats
    );

    RETURN v_history_id;

END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_quiz_session TO authenticated;
