-- Migration: Update clone_shared_quiz RPC to accept suffix

CREATE OR REPLACE FUNCTION public.clone_shared_quiz(p_original_quiz_id uuid, p_name_suffix text DEFAULT ' (Shared)')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_quiz_id uuid;
    v_original_quiz public.saved_quizzes%ROWTYPE;
    v_user_id uuid := auth.uid();
BEGIN
    -- Ensure the user is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to clone a quiz';
    END IF;

    -- Fetch the original quiz
    SELECT * INTO v_original_quiz
    FROM public.saved_quizzes
    WHERE id = p_original_quiz_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Original quiz not found';
    END IF;

    -- Generate a new UUID for the cloned quiz
    v_new_quiz_id := gen_random_uuid();

    -- Insert the cloned quiz
    INSERT INTO public.saved_quizzes (
        id,
        user_id,
        name,
        created_at,
        filters,
        mode,
        state
    ) VALUES (
        v_new_quiz_id,
        v_user_id,
        v_original_quiz.name || p_name_suffix,
        (extract(epoch from now()) * 1000)::bigint,
        v_original_quiz.filters,
        v_original_quiz.mode,
        jsonb_build_object(
            'currentQuestionIndex', 0,
            'score', 0,
            'answers', '{}'::jsonb,
            'timeTaken', '{}'::jsonb,
            'remainingTimes', '{}'::jsonb,
            'quizTimeRemaining', 0,
            'bookmarks', '[]'::jsonb,
            'markedForReview', '[]'::jsonb,
            'hiddenOptions', '{}'::jsonb,
            'isPaused', false,
            'status', 'quiz',
            'mode', v_original_quiz.mode,
            'quizId', v_new_quiz_id
        )
    );

    -- Copy bridge table entries
    INSERT INTO public.bridge_saved_quiz_questions (
        quiz_id,
        question_id,
        user_id,
        sort_order
    )
    SELECT
        v_new_quiz_id,
        question_id,
        v_user_id,
        sort_order
    FROM public.bridge_saved_quiz_questions
    WHERE quiz_id = p_original_quiz_id;

    -- Return JSON containing the new quiz ID and the mode to easily redirect on the client
    RETURN json_build_object(
        'new_quiz_id', v_new_quiz_id,
        'mode', v_original_quiz.mode
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.clone_shared_quiz TO authenticated;
