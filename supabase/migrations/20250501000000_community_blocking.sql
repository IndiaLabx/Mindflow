-- Create user_blocks table
CREATE TABLE IF NOT EXISTS public.user_blocks (
    blocker_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (blocker_id, blocked_id)
);

-- RLS for user_blocks
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'user_blocks' AND policyname = 'Users can view blocks they are involved in'
    ) THEN
        CREATE POLICY "Users can view blocks they are involved in" ON public.user_blocks
        FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'user_blocks' AND policyname = 'Users can create blocks'
    ) THEN
        CREATE POLICY "Users can create blocks" ON public.user_blocks
        FOR INSERT WITH CHECK (auth.uid() = blocker_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'user_blocks' AND policyname = 'Users can remove their own blocks'
    ) THEN
        CREATE POLICY "Users can remove their own blocks" ON public.user_blocks
        FOR DELETE USING (auth.uid() = blocker_id);
    END IF;
END $$;

-- Helper function to get blocked users (mutual)
CREATE OR REPLACE FUNCTION public.get_blocked_users(user_uid uuid)
RETURNS TABLE (blocked_user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT blocked_id FROM public.user_blocks WHERE blocker_id = user_uid
    UNION
    SELECT blocker_id FROM public.user_blocks WHERE blocked_id = user_uid;
$$;

-- Trigger to sever followers/following on block
CREATE OR REPLACE FUNCTION public.sever_follows_on_block()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.user_followers
    WHERE (follower_id = NEW.blocker_id AND following_id = NEW.blocked_id)
       OR (follower_id = NEW.blocked_id AND following_id = NEW.blocker_id);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_block ON public.user_blocks;
CREATE TRIGGER on_user_block
AFTER INSERT ON public.user_blocks
FOR EACH ROW
EXECUTE FUNCTION public.sever_follows_on_block();

-- POSTS
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Public read posts" ON public.posts;
DROP POLICY IF EXISTS "Posts are viewable by non-blocked users" ON public.posts;

CREATE POLICY "Posts are viewable by non-blocked users" ON public.posts
FOR SELECT USING (
    user_id NOT IN (SELECT public.get_blocked_users(auth.uid()))
);

-- POST COMMENTS
DROP POLICY IF EXISTS "Post comments are viewable by everyone" ON public.post_comments;
DROP POLICY IF EXISTS "Public read comments" ON public.post_comments;
DROP POLICY IF EXISTS "Post comments are viewable by non-blocked users" ON public.post_comments;

CREATE POLICY "Post comments are viewable by non-blocked users" ON public.post_comments
FOR SELECT USING (
    user_id NOT IN (SELECT public.get_blocked_users(auth.uid()))
);

-- REELS
DROP POLICY IF EXISTS "Reels are viewable by everyone" ON public.reels;
DROP POLICY IF EXISTS "Reels are viewable by non-blocked users" ON public.reels;

CREATE POLICY "Reels are viewable by non-blocked users" ON public.reels
FOR SELECT USING (
    user_id NOT IN (SELECT public.get_blocked_users(auth.uid()))
);

-- REEL COMMENTS
DROP POLICY IF EXISTS "Reel comments are viewable by everyone" ON public.reel_comments;
DROP POLICY IF EXISTS "Reel comments are viewable by non-blocked users" ON public.reel_comments;

CREATE POLICY "Reel comments are viewable by non-blocked users" ON public.reel_comments
FOR SELECT USING (
    user_id NOT IN (SELECT public.get_blocked_users(auth.uid()))
);

-- PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by non-blocked users" ON public.profiles;

CREATE POLICY "Public profiles are viewable by non-blocked users" ON public.profiles
FOR SELECT USING (
    id NOT IN (SELECT public.get_blocked_users(auth.uid()))
);

-- FOLLOWERS
DROP POLICY IF EXISTS "Followers are viewable by everyone" ON public.user_followers;
DROP POLICY IF EXISTS "Users can see all followers" ON public.user_followers;
DROP POLICY IF EXISTS "Followers are viewable by non-blocked users" ON public.user_followers;

CREATE POLICY "Followers are viewable by non-blocked users" ON public.user_followers
FOR SELECT USING (
    follower_id NOT IN (SELECT public.get_blocked_users(auth.uid())) AND
    following_id NOT IN (SELECT public.get_blocked_users(auth.uid()))
);
