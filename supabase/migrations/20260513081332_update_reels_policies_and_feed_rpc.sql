-- 1. Ensure correct RLS policies for the reels table
-- Drop existing policies if any to avoid conflicts, then recreate them exactly as needed.
DROP POLICY IF EXISTS "Reels are viewable by everyone." ON public.reels;
DROP POLICY IF EXISTS "Users can insert their own reels." ON public.reels;
DROP POLICY IF EXISTS "Users can update their own reels." ON public.reels;
DROP POLICY IF EXISTS "Users can delete their own reels." ON public.reels;

-- Select: Viewable by anyone
CREATE POLICY "Reels are viewable by everyone."
    ON public.reels FOR SELECT
    USING (true);

-- Insert: Only authenticated users, and they must insert their own user_id
CREATE POLICY "Users can insert their own reels."
    ON public.reels FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Update: Users can only update their own reels
CREATE POLICY "Users can update their own reels."
    ON public.reels FOR UPDATE
    USING (auth.uid() = user_id);

-- Delete: Users can only delete their own reels
CREATE POLICY "Users can delete their own reels."
    ON public.reels FOR DELETE
    USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;


-- 2. Create the Weighted Chronological Algorithm RPC for the Reels Feed
-- Formula: Score = (Likes * 2) + (Comments * 3) - (Hours_Old * 0.5)
CREATE OR REPLACE FUNCTION get_reels_feed(p_limit INT, p_cursor TIMESTAMPTZ DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    video_url TEXT,
    caption TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    likes_count BIGINT,
    comments_count BIGINT,
    score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.user_id,
        r.video_url,
        r.caption,
        r.created_at,
        r.updated_at,
        COALESCE(lc.likes_count, 0) AS likes_count,
        COALESCE(cc.comments_count, 0) AS comments_count,
        (
            (COALESCE(lc.likes_count, 0) * 2.0) +
            (COALESCE(cc.comments_count, 0) * 3.0) -
            (EXTRACT(EPOCH FROM (now() - r.created_at)) / 3600.0 * 0.5)
        ) AS score
    FROM
        public.reels r
    LEFT JOIN (
        SELECT reel_id, COUNT(*) AS likes_count
        FROM public.reel_likes
        GROUP BY reel_id
    ) lc ON r.id = lc.reel_id
    LEFT JOIN (
        SELECT reel_id, COUNT(*) AS comments_count
        FROM public.reel_comments
        GROUP BY reel_id
    ) cc ON r.id = cc.reel_id
    WHERE
        (p_cursor IS NULL OR r.created_at < p_cursor)
    ORDER BY
        score DESC, r.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
