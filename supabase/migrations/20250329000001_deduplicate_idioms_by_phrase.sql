WITH phrase_duplicates AS (
    SELECT
        LOWER(TRIM(phrase)) as normalized_phrase,
        array_agg(id) as ids
    FROM idiom
    GROUP BY LOWER(TRIM(phrase))
    HAVING COUNT(*) > 1
),
ordered_phrase_duplicates AS (
    SELECT
        pd.normalized_phrase,
        i.id,
        ROW_NUMBER() OVER(
            PARTITION BY pd.normalized_phrase
            ORDER BY
                LENGTH(COALESCE(i.phrase, '')) + LENGTH(COALESCE(i.meaning_english, '')) DESC,
                i.created_at ASC
        ) as rn
    FROM phrase_duplicates pd
    JOIN idiom i ON LOWER(TRIM(i.phrase)) = pd.normalized_phrase
),
keepers AS (
    SELECT normalized_phrase, id as keeper_id
    FROM ordered_phrase_duplicates
    WHERE rn = 1
),
to_delete AS (
    SELECT o.id as duplicate_id, k.keeper_id
    FROM ordered_phrase_duplicates o
    JOIN keepers k ON o.normalized_phrase = k.normalized_phrase
    WHERE o.rn > 1
),
updated_interactions AS (
    UPDATE user_idiom_interactions uii
    SET idiom_id = td.keeper_id::text
    FROM to_delete td
    WHERE uii.idiom_id = td.duplicate_id::text
    RETURNING uii.id
)
DELETE FROM idiom
WHERE id IN (SELECT duplicate_id FROM to_delete);
