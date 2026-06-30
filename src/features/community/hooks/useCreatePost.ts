import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { uploadMediaWithProgress } from '../api/uploadMedia';
import { createPost } from '../api/communityApi';
import { useNotificationStore } from '../../../stores/useNotificationStore';
import { Post } from '../api/communityApi';
import { translateError } from '../utils/errorTranslation';

export const useCreatePost = (feedType: 'posts' | 'reels') => {
    const queryClient = useQueryClient();
    const { showToast } = useNotificationStore();
    const [uploadProgress, setUploadProgress] = useState(0);

    const mutation = useMutation({
        mutationFn: async ({
            userId,
            content,
            file,
            postType,
        }: {
            userId: string;
            content: string;
            file: File | null;
            postType: 'text' | 'image' | 'reel';
        }) => {
            let mediaUrl: string | undefined = undefined;

            if (file) {
                mediaUrl = await uploadMediaWithProgress(file, userId, (progress) => {
                    setUploadProgress(progress);
                });
            }

            const finalType = postType === 'text' && !file && feedType === 'reels' ? 'reel' : postType;

            return await createPost(userId, content, finalType, mediaUrl);
        },
        onSuccess: (newPost) => {
            const queryKey = feedType === 'reels' ? ['community-posts-reels'] : ['community-posts'];

            queryClient.setQueryData(queryKey, (old: any) => {
                if (!old) return old;
                // If the feed query is an infinite query shape:
                if (old.pages) {
                    return {
                        ...old,
                        pages: old.pages.map((page: any, index: number) => {
                            if (index === 0) {
                                return {
                                    ...page,
                                    data: [newPost, ...(Array.isArray(page.data) ? page.data : [])],
                                };
                            }
                            return page;
                        }),
                    };
                }
                // Otherwise fallback to simple array:
                if (Array.isArray(old)) {
                    return [newPost, ...old];
                }
                return old;
            });

            // Also invalidate user posts if the user is viewing their profile
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });

            showToast({ title: 'Success', message: 'Published successfully!', variant: 'success' });
            setUploadProgress(0); // reset progress on success
        },
        onError: (err: any) => {
            const translated = translateError(err, 'useCreatePost');
            showToast({ title: 'Error', message: translated.userMessage, variant: 'error' });
            setUploadProgress(0); // reset progress on error
        }
    });

    return { createPost: mutation.mutateAsync, isPending: mutation.isPending, uploadProgress, resetProgress: () => setUploadProgress(0) };
};
