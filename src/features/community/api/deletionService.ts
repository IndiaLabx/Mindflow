import { supabase } from '../../../lib/supabase';

// --- AUTHENTICATION GUARDS ---

/**
 * Validates ownership before allowing deletion operations on the client.
 * NOTE: This is a client-side convenience check. True security is enforced by Supabase RLS.
 */
export const verifyOwnership = async (contentUserId: string): Promise<boolean> => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return false;
        return user.id === contentUserId;
    } catch {
        return false;
    }
};

// --- CENTRALIZED DELETION SERVICE ---

/**
 * Logs structured deletion events to analytics_events for audit trails and future media cleanup.
 */
const logDeletionEvent = async (
    eventType: 'post_deleted' | 'reel_deleted' | 'comment_deleted',
    userId: string,
    targetId: string,
    providerMetadata?: any
) => {
    try {
        await supabase.from('analytics_events').insert({
            event_name: eventType,
            event_data: {
                user_id: userId,
                target_id: targetId,
                deleted_at: new Date().toISOString(),
                ...providerMetadata
            }
        });
    } catch (error) {
        console.error('[DeletionService] Failed to log deletion event:', error);
        // We don't throw here to avoid blocking the user's deletion action if logging fails.
    }
};

/**
 * Deletes a Post. Relies on ON DELETE CASCADE for likes/comments, and DB triggers for Storage cleanup.
 */
export const deletePostService = async (postId: string, postOwnerId: string): Promise<boolean> => {
    const isOwner = await verifyOwnership(postOwnerId);
    if (!isOwner) throw new Error("Unauthorized: You do not have permission to delete this post.");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthenticated");

    try {
        // 1. Resolve storage object path by fetching the post first
        const { data: post, error: fetchError } = await supabase
            .from('posts')
            .select('media_url, type')
            .eq('id', postId)
            .single();

        if (fetchError) {
            console.warn('[DeletionService] Post not found or error fetching:', fetchError.message);
            // We can continue to DB deletion just in case it exists without media
        } else if (post?.media_url && post.media_url.includes('supabase.co')) {
            // 2. Delete storage object via Storage API (Idempotent)
            try {
                // Extract the object path from the public URL
                // URL looks like: https://[project].supabase.co/storage/v1/object/public/post_media/user_id-timestamp.jpg
                const urlObj = new URL(post.media_url);
                const pathParts = urlObj.pathname.split('/public/');
                if (pathParts.length > 1) {
                    const fullPath = pathParts[1]; // e.g. "post_media/fileName.jpg"
                    const bucket = fullPath.split('/')[0];
                    const fileName = fullPath.substring(bucket.length + 1);

                    // Idempotent delete: if file doesn't exist, it won't throw
                    const { error: storageError } = await supabase.storage.from(bucket).remove([fileName]);
                    if (storageError) {
                        console.warn('[DeletionService] Storage deletion warning (idempotent):', storageError.message);
                    }
                }
            } catch (storageErr) {
                console.warn('[DeletionService] Could not parse media URL for storage deletion:', storageErr);
            }
        }

        // 3. Decouple Media to bypass potentially restrictive DB triggers on DELETE
        if (post?.media_url) {
            const { error: unlinkError } = await supabase
                .from('posts')
                .update({ media_url: null })
                .eq('id', postId)
                .eq('user_id', user.id);
            if (unlinkError) {
                console.warn('[DeletionService] Failed to unlink media prior to deletion:', unlinkError.message);
            }
        }

        // 4. Delete DB row safely
        const { error, count } = await supabase
            .from('posts')
            .delete({ count: 'exact' })
            .eq('id', postId)
            .eq('user_id', user.id);

        if (error) throw error;

        // 4. Log the audit event asynchronously
        logDeletionEvent('post_deleted', user.id, postId);

        return true;
    } catch (error: any) {
        console.error('[DeletionService] Failed to delete post:', error);
        throw new Error(error.message || "Failed to delete post");
    }
};

export const deleteReelService = async (reelId: string, reelOwnerId: string, videoUrl?: string): Promise<boolean> => {
    const isOwner = await verifyOwnership(reelOwnerId);
    if (!isOwner) throw new Error("Unauthorized: You do not have permission to delete this reel.");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthenticated");

    try {
        const { error } = await supabase
            .from('reels')
            .delete()
            .eq('id', reelId)
            .eq('user_id', user.id);

        if (error) throw error;

        // Structured audit logging for future Cloudinary cleanup
        const cloudinaryMetadata = videoUrl && videoUrl.includes('cloudinary.com') ? {
            provider: 'cloudinary',
            secure_url: videoUrl,
            resource_type: 'video',
            // Extract public_id heuristic (everything after /upload/v.../ and before the extension)
            public_id_hint: videoUrl.split('/upload/')[1]?.split('.')[0]?.replace(/^v\d+\//, '')
        } : null;

        logDeletionEvent('reel_deleted', user.id, reelId, cloudinaryMetadata);

        return true;
    } catch (error: any) {
        console.error('[DeletionService] Failed to delete reel:', error);
        throw new Error(error.message || "Failed to delete reel");
    }
};

/**
 * Deletes a Comment (Post or Reel). Relies on CASCADE for child replies and likes.
 */
export const deleteCommentService = async (
    commentId: string,
    commentOwnerId: string,
    type: 'post' | 'reel'
): Promise<boolean> => {
    const isOwner = await verifyOwnership(commentOwnerId);
    if (!isOwner) throw new Error("Unauthorized: You do not have permission to delete this comment.");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthenticated");

    try {
        const table = type === 'post' ? 'post_comments' : 'reel_comments';

        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', commentId)
            .eq('user_id', user.id);

        if (error) throw error;

        logDeletionEvent('comment_deleted', user.id, commentId, { comment_type: type });

        return true;
    } catch (error: any) {
        console.error(`[DeletionService] Failed to delete ${type} comment:`, error);
        throw new Error(error.message || "Failed to delete comment");
    }
};
