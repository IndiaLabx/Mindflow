-- 1. Add Soft Delete Column to quiz_history
ALTER TABLE public.quiz_history
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 2. Create the RPC function for performance metrics
CREATE OR REPLACE FUNCTION get_user_performance_metrics()
RETURNS TABLE (
  total_quizzes BIGINT,
  total_correct BIGINT,
  total_incorrect BIGINT,
  total_skipped BIGINT,
  total_time_spent FLOAT,
  total_questions BIGINT,
  average_accuracy FLOAT,
  subject_stats JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  RETURN QUERY
  WITH user_history AS (
    SELECT *
    FROM quiz_history
    WHERE user_id = v_user_id
      AND deleted_at IS NULL
  ),
  aggregated_metrics AS (
    SELECT
      COUNT(id)::BIGINT AS total_quizzes,
      COALESCE(SUM(total_correct), 0)::BIGINT AS total_correct,
      COALESCE(SUM(total_incorrect), 0)::BIGINT AS total_incorrect,
      COALESCE(SUM(total_skipped), 0)::BIGINT AS total_skipped,
      COALESCE(SUM(total_time_spent), 0)::FLOAT AS total_time_spent,
      COALESCE(SUM(total_questions), 0)::BIGINT AS total_questions
    FROM user_history
  ),
  unnested_stats AS (
    SELECT
      key AS subject_name,
      (value->>'attempted')::INT AS attempted,
      (value->>'correct')::INT AS correct,
      (value->>'incorrect')::INT AS incorrect,
      (value->>'skipped')::INT AS skipped
    FROM user_history, jsonb_each(subject_stats)
  ),
  merged_stats AS (
    SELECT
      subject_name,
      jsonb_build_object(
        'attempted', COALESCE(SUM(attempted), 0),
        'correct', COALESCE(SUM(correct), 0),
        'incorrect', COALESCE(SUM(incorrect), 0),
        'skipped', COALESCE(SUM(skipped), 0)
      ) AS stats
    FROM unnested_stats
    GROUP BY subject_name
  )
  SELECT
    am.total_quizzes,
    am.total_correct,
    am.total_incorrect,
    am.total_skipped,
    am.total_time_spent,
    am.total_questions,
    CASE
      WHEN am.total_questions > 0 THEN
        (am.total_correct::FLOAT / am.total_questions::FLOAT) * 100
      ELSE 0::FLOAT
    END AS average_accuracy,
    COALESCE(
      (SELECT jsonb_object_agg(subject_name, stats) FROM merged_stats),
      '{}'::jsonb
    ) AS subject_stats
  FROM aggregated_metrics am;
END;
$$;

-- 3. Create the RPC function to reset analytics
CREATE OR REPLACE FUNCTION reset_user_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  UPDATE quiz_history
  SET deleted_at = NOW()
  WHERE user_id = v_user_id
    AND deleted_at IS NULL;
END;
$$;
