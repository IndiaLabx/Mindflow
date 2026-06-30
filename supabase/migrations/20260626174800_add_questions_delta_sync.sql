-- 1. Add updated_at column to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Add trigger to questions table
DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at
BEFORE UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 4. Create RPC for delta sync
CREATE OR REPLACE FUNCTION get_filtered_quiz_metadata(p_last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    v1_id TEXT,
    subject TEXT,
    topic TEXT,
    "subTopic" TEXT,
    "examName" TEXT,
    "examYear" INTEGER,
    "examDateShift" TEXT,
    difficulty TEXT,
    "questionType" TEXT,
    tags TEXT[],
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    IF p_last_sync_at IS NULL THEN
        RETURN QUERY
        SELECT
            q.id, q.v1_id, q.subject, q.topic, q."subTopic", q."examName", q."examYear", q."examDateShift", q.difficulty, q."questionType", q.tags, q.updated_at
        FROM questions q;
    ELSE
        RETURN QUERY
        SELECT
            q.id, q.v1_id, q.subject, q.topic, q."subTopic", q."examName", q."examYear", q."examDateShift", q.difficulty, q."questionType", q.tags, q.updated_at
        FROM questions q
        WHERE q.updated_at > p_last_sync_at;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
