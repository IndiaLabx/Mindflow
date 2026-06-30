DO $$
DECLARE
    r RECORD;
    v_kept_id uuid;
BEGIN
    -- Create a temporary table to rank duplicates
    CREATE TEMP TABLE idiom_duplicates ON COMMIT DROP AS
    WITH ranked AS (
        SELECT id, v1_id, phrase, meaning_english, created_at,
               ROW_NUMBER() OVER(
                   PARTITION BY v1_id
                   ORDER BY COALESCE(LENGTH(phrase), 0) + COALESCE(LENGTH(meaning_english), 0) DESC, created_at ASC
               ) as rnk
        FROM idiom
        WHERE v1_id IN (
            SELECT v1_id FROM idiom GROUP BY v1_id HAVING count(*) > 1
        )
    )
    SELECT * FROM ranked;

    -- Loop through the duplicates (rank > 1)
    FOR r IN SELECT * FROM idiom_duplicates WHERE rnk > 1 LOOP
        -- Find the ID of the idiom we are keeping for this v1_id
        SELECT id INTO v_kept_id FROM idiom_duplicates WHERE v1_id = r.v1_id AND rnk = 1 LIMIT 1;

        -- Handle user_idiom_interactions to prevent unique constraint violations
        -- Delete interactions pointing to the duplicate IF the user already interacted with the kept idiom
        DELETE FROM user_idiom_interactions
        WHERE idiom_id = r.id::text
          AND user_id IN (
              SELECT user_id FROM user_idiom_interactions WHERE idiom_id = v_kept_id::text
          );

        -- Update any remaining interactions pointing to the duplicate so they point to the kept idiom
        UPDATE user_idiom_interactions
        SET idiom_id = v_kept_id::text
        WHERE idiom_id = r.id::text;

        -- Finally, delete the duplicate idiom
        DELETE FROM idiom WHERE id = r.id;
    END LOOP;
END $$;
