-- Reels table
CREATE TABLE IF NOT EXISTS public.reels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reels are viewable by everyone."
    ON public.reels FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own reels."
    ON public.reels FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reels."
    ON public.reels FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reels."
    ON public.reels FOR DELETE
    USING (auth.uid() = user_id);

-- Reel Likes table
CREATE TABLE IF NOT EXISTS public.reel_likes (
    reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (reel_id, user_id)
);

ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reel likes are viewable by everyone."
    ON public.reel_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own reel likes."
    ON public.reel_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reel likes."
    ON public.reel_likes FOR DELETE
    USING (auth.uid() = user_id);

-- Reel Comments table
CREATE TABLE IF NOT EXISTS public.reel_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES public.reel_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.reel_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reel comments are viewable by everyone."
    ON public.reel_comments FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own reel comments."
    ON public.reel_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reel comments."
    ON public.reel_comments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reel comments."
    ON public.reel_comments FOR DELETE
    USING (auth.uid() = user_id);

-- Reel Comment Likes table
CREATE TABLE IF NOT EXISTS public.reel_comment_likes (
    comment_id UUID NOT NULL REFERENCES public.reel_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (comment_id, user_id)
);

ALTER TABLE public.reel_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reel comment likes are viewable by everyone."
    ON public.reel_comment_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own reel comment likes."
    ON public.reel_comment_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reel comment likes."
    ON public.reel_comment_likes FOR DELETE
    USING (auth.uid() = user_id);
