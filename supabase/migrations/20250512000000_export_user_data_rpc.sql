-- Function to export all user data
CREATE OR REPLACE FUNCTION public.export_user_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    user_id uuid;
BEGIN
    user_id := auth.uid();

    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT jsonb_build_object(
        'profile', (SELECT row_to_json(t) FROM (SELECT * FROM public.profiles WHERE id = user_id) t),
        'notification_preferences', (SELECT row_to_json(t) FROM (SELECT * FROM public.notification_preferences WHERE user_id = user_id) t),
        'posts', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.posts WHERE user_id = user_id) t),
        'post_likes', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.post_likes WHERE user_id = user_id) t),
        'post_comments', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.post_comments WHERE user_id = user_id) t),
        'reels', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.reels WHERE user_id = user_id) t),
        'reel_likes', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.reel_likes WHERE user_id = user_id) t),
        'reel_comments', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.reel_comments WHERE user_id = user_id) t),
        'quiz_history', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.quiz_history WHERE user_id = user_id) t),
        'saved_quizzes', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.saved_quizzes WHERE user_id = user_id) t),
        'user_answers', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.user_answers WHERE user_id = user_id) t),
        'user_bookmarks', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.user_bookmarks WHERE user_id = user_id) t),
        'user_exam_blueprints', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.user_exam_blueprints WHERE user_id = user_id) t),
        'user_ows_interactions', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.user_ows_interactions WHERE user_id = user_id) t),
        'user_idiom_interactions', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.user_idiom_interactions WHERE user_id = user_id) t),
        'following', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.user_followers WHERE follower_id = user_id) t),
        'followers', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.user_followers WHERE following_id = user_id) t),
        'chat_messages', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.chat_room_messages WHERE sender_id = user_id) t),
        'blocked_users', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.user_blocks WHERE blocker_id = user_id) t),
        'payments', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.payments WHERE user_id = user_id) t),
        'reports', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM public.reports WHERE reporter_id = user_id) t)
    ) INTO result;

    -- Replace null arrays with empty arrays
    result := (
        SELECT jsonb_object_agg(
            key,
            CASE
                WHEN value IS NULL AND key != 'profile' AND key != 'notification_preferences' THEN '[]'::jsonb
                ELSE value
            END
        )
        FROM jsonb_each(result)
    );

    RETURN result;
END;
$$;
