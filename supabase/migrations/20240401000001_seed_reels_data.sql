INSERT INTO public.reels (user_id, video_url, caption)
SELECT
    (SELECT id FROM auth.users LIMIT 1),
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    '#mindflow Sample Reel 1'
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1);
