CREATE TABLE IF NOT EXISTS public.chat_message_likes (
    message_id UUID NOT NULL REFERENCES public.chat_room_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (message_id, user_id)
);

ALTER TABLE public.chat_message_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view likes for messages in their rooms"
    ON public.chat_message_likes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_room_messages m
            JOIN public.chat_participants p ON m.room_id = p.room_id
            WHERE m.id = chat_message_likes.message_id
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add their own likes"
    ON public.chat_message_likes
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.chat_room_messages m
            JOIN public.chat_participants p ON m.room_id = p.room_id
            WHERE m.id = chat_message_likes.message_id
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove their own likes"
    ON public.chat_message_likes
    FOR DELETE
    USING (auth.uid() = user_id);
