import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useNotificationStore } from '../../../stores/useNotificationStore';
import { deletePostService, deleteReelService, deleteCommentService } from '../api/deletionService';
import { translateError } from '../utils/errorTranslation';

export const useDeletePost = () => {
    const queryClient = useQueryClient();
    const { showToast } = useNotificationStore();
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: async ({ id, ownerId }: { id: string; ownerId: string }) => {
            setIsDeletingId(id);
            return await deletePostService(id, ownerId);
        },
        onSuccess: (_, variables) => {
            showToast({ title: 'Success', message: 'Post deleted successfully', variant: 'success' });

            // Soft optimistic UI: remove the item from caches
            queryClient.setQueryData(['community-posts'], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages?.map((page: any) => ({
                        ...page,
                        data: (Array.isArray(page.data) ? page.data : []).filter((p: any) => p.id !== variables.id)
                    })) || old.pages
                };
            });

            // Also clean up specific user posts if cached
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
            // Invalidate specific post if open in PostPage
            queryClient.invalidateQueries({ queryKey: ['community-post', variables.id] });
        },
        onError: (error: any) => {
            const translated = translateError(error, 'useDeletePost');
            showToast({ title: 'Error', message: translated.userMessage, variant: 'error' });
        },
        onSettled: () => {
            setIsDeletingId(null);
        }
    });

    return { deletePost: mutation.mutateAsync, isDeletingId, isPending: mutation.isPending };
};

export const useDeleteReel = () => {
    const queryClient = useQueryClient();
    const { showToast } = useNotificationStore();
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: async ({ id, ownerId, videoUrl }: { id: string; ownerId: string; videoUrl?: string }) => {
            setIsDeletingId(id);
            return await deleteReelService(id, ownerId, videoUrl);
        },
        onSuccess: (_, variables) => {
            showToast({ title: 'Success', message: 'Reel deleted successfully', variant: 'success' });

            // Soft optimistic UI: remove the item from cache
            queryClient.setQueryData(['community-reels'], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    data: (Array.isArray(old.data) ? old.data : []).filter((r: any) => r.id !== variables.id) || old.data
                };
            });

            // Also invalidate specific reel if open
            queryClient.invalidateQueries({ queryKey: ['community-reel', variables.id] });
        },
        onError: (error: any) => {
            const translated = translateError(error, 'useDeleteReel');
            showToast({ title: 'Error', message: translated.userMessage, variant: 'error' });
        },
        onSettled: () => {
            setIsDeletingId(null);
        }
    });

    return { deleteReel: mutation.mutateAsync, isDeletingId, isPending: mutation.isPending };
};

export const useDeleteComment = (type: 'post' | 'reel', parentId: string) => {
    const queryClient = useQueryClient();
    const { showToast } = useNotificationStore();
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: async ({ id, ownerId }: { id: string; ownerId: string }) => {
            setIsDeletingId(id);
            return await deleteCommentService(id, ownerId, type);
        },
        onSuccess: (_, variables) => {
            showToast({ title: 'Success', message: 'Comment deleted successfully', variant: 'success' });

            const queryKey = type === 'post'
                ? ['community-comments', parentId]
                : ['community-reel-comments', parentId];

            queryClient.invalidateQueries({ queryKey });

            // Also invalidate the parent to update comment counts
            const parentKey = type === 'post' ? ['community-post', parentId] : ['community-reel', parentId];
            queryClient.invalidateQueries({ queryKey: parentKey });
        },
        onError: (error: any) => {
            const translated = translateError(error, 'useDeleteComment');
            showToast({ title: 'Error', message: translated.userMessage, variant: 'error' });
        },
        onSettled: () => {
            setIsDeletingId(null);
        }
    });

    return { deleteComment: mutation.mutateAsync, isDeletingId, isPending: mutation.isPending };
};
