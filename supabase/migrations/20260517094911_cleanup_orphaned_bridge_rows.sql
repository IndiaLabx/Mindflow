-- Create the trigger function
CREATE OR REPLACE FUNCTION cleanup_orphaned_bridge_rows()
RETURNS TRIGGER AS $$
BEGIN
  -- Hard delete all mapping rows for the deleted quiz
  DELETE FROM public.bridge_saved_quiz_questions
  WHERE quiz_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to saved_quizzes
CREATE TRIGGER trigger_cleanup_orphaned_bridge_rows
AFTER UPDATE ON public.saved_quizzes
FOR EACH ROW
WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
EXECUTE FUNCTION cleanup_orphaned_bridge_rows();
