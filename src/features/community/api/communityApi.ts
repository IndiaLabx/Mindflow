import { supabase } from '../../../lib/supabase';

export type Post = {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  hls_stream_url: string | null;
  type: 'text' | 'image' | 'reel';
  created_at: string;
  updated_at: string;
  profiles?: { id?: string; full_name: string | null; username?: string; avatar_url: string | null };
  likes_count?: number;
  comments_count?: number;
  is_liked_by_me?: boolean;
};

export type SearchProfile = {
  id: string;
  full_name: string | null;
  username: string;
  avatar_url: string | null;
  similarity: number;
  is_following?: boolean;
};

export const fetchPosts = async (limit = 20, cursor?: string): Promise<{ data: Post[], nextCursor: string | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    let followingIds: string[] = [];

    // Attempt to fetch from following list first
    if (user) {
        const { data: followersData } = await supabase
            .from('user_followers')
            .select('following_id')
            .eq('follower_id', user.id);

        if (followersData && followersData.length > 0) {
            followingIds = followersData.map((f: any) => f.following_id);
            // Optionally, include the user's own posts
            followingIds.push(user.id);
        }
    }

    let postsData: any[] = [];

    // If following someone, fetch their posts
    if (followingIds.length > 0) {
        let q = supabase
            .from('posts')
            .select(`
            *,
            profiles:user_id(id, full_name, username, avatar_url)
            `)
            .in('user_id', followingIds)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (cursor) q = q.lt('created_at', cursor);
        const res = await q;
        postsData = res.data || [];
    }

    // Cold Start Fallback: If no posts from following or empty feed, fetch globally trending/recent
    if (!postsData || postsData.length === 0) {
        let fallbackQuery = supabase
            .from('posts')
            .select(`
            *,
            profiles:user_id(id, full_name, username, avatar_url)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (cursor) fallbackQuery = fallbackQuery.lt('created_at', cursor);

        const fallbackRes = await fallbackQuery;
        postsData = fallbackRes.data || [];
    }

    if (!postsData || postsData.length === 0) return { data: [], nextCursor: null };

    const postIds = postsData.map((p: any) => p.id);

    const [likesReq, commentsReq, myLikesReq] = await Promise.all([
      supabase.from('post_likes').select('post_id', { count: 'exact' }).in('post_id', postIds),
      supabase.from('post_comments').select('post_id', { count: 'exact' }).in('post_id', postIds),
      user ? supabase.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', postIds) : Promise.resolve({ data: [] })
    ]);

    const likesCountMap = (likesReq.data || []).reduce((acc: any, curr: any) => {
      acc[curr.post_id] = (acc[curr.post_id] || 0) + 1;
      return acc;
    }, {});

    const commentsCountMap = (commentsReq.data || []).reduce((acc: any, curr: any) => {
      acc[curr.post_id] = (acc[curr.post_id] || 0) + 1;
      return acc;
    }, {});

    const myLikedPostIds = new Set((myLikesReq.data || []).map((l: any) => l.post_id));

    const formattedData = postsData.map((p: any) => ({
      ...p,
      profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
      likes_count: likesCountMap[p.id] || 0,
      comments_count: commentsCountMap[p.id] || 0,
      is_liked_by_me: myLikedPostIds.has(p.id)
    }));

    const nextCursor = formattedData.length === limit ? formattedData[formattedData.length - 1].created_at : null;
    return { data: formattedData, nextCursor };
  } catch (err) {
    console.error('[Supabase Error - fetchPosts]:', err);
    return { data: [], nextCursor: null };
  }
};



export type Comment = {
    id: string;
    post_id: string;
    user_id: string;
    parent_comment_id: string | null;
    content: string;
    created_at: string;
    updated_at: string;
    profiles?: { id?: string; full_name: string | null; username?: string; avatar_url: string | null };
    likes_count?: number;
    is_liked_by_me?: boolean;
    replies?: Comment[];
};

export const fetchComments = async (postId: string, userId?: string): Promise<Comment[]> => {
    try {
        const { data: commentsData, error } = await supabase
            .from('post_comments')
            .select(`
                *,
                profiles:user_id(id, full_name, username, avatar_url)
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        if (!commentsData || commentsData.length === 0) return [];

        const commentIds = commentsData.map((c: any) => c.id);

        const [likesReq, myLikesReq] = await Promise.all([
            supabase.from('comment_likes').select('comment_id', { count: 'exact' }).in('comment_id', commentIds),
            userId ? supabase.from('comment_likes').select('comment_id').eq('user_id', userId).in('comment_id', commentIds) : Promise.resolve({ data: [] })
        ]);

        const likesCountMap = (likesReq.data || []).reduce((acc: any, curr: any) => {
            acc[curr.comment_id] = (acc[curr.comment_id] || 0) + 1;
            return acc;
        }, {});

        const myLikedCommentIds = new Set((myLikesReq.data || []).map((l: any) => l.comment_id));

        const formattedComments: Comment[] = commentsData.map((c: any) => ({
            ...c,
            profiles: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles,
            likes_count: likesCountMap[c.id] || 0,
            is_liked_by_me: myLikedCommentIds.has(c.id),
            replies: []
        }));

        // Organize into a tree structure
        const commentMap = new Map<string, Comment>();
        const rootComments: Comment[] = [];

        formattedComments.forEach(c => commentMap.set(c.id, c));

        formattedComments.forEach(c => {
            if (c.parent_comment_id && commentMap.has(c.parent_comment_id)) {
                commentMap.get(c.parent_comment_id)!.replies!.push(c);
            } else {
                rootComments.push(c);
            }
        });

        return rootComments;

    } catch (err) {
        console.error('[Supabase Error - fetchComments]:', err);
        return [];
    }
};

export const toggleLikeComment = async (commentId: string, userId: string, currentlyLiked: boolean) => {
    try {
        if (currentlyLiked) {
            return await supabase.from('comment_likes').delete().match({ comment_id: commentId, user_id: userId });
        } else {
            return await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: userId });
        }
    } catch (err) {
        console.error('[Supabase Error - toggleLikeComment]:', err);
        throw err;
    }
};

export const createComment = async (postId: string, userId: string, content: string, parentCommentId: string | null = null) => {
    const { data, error } = await supabase.from('post_comments').insert({
        post_id: postId,
        user_id: userId,
        content: content.trim(),
        parent_comment_id: parentCommentId
    }).select(`
        *,
        profiles:user_id(id, full_name, username, avatar_url)
    `).single();

    if (error) throw error;

    return {
        ...data,
        profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
        likes_count: 0,
        is_liked_by_me: false,
        replies: []
    } as Comment;
};


export const toggleLikePost = async (postId: string, userId: string, currentlyLiked: boolean) => {
    try {
        if (currentlyLiked) {
            return await supabase.from('post_likes').delete().match({ post_id: postId, user_id: userId });
        } else {
            return await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
        }
    } catch (err) {
        console.error('[Supabase Error - toggleLikePost]:', err);
        throw err;
    }
};

export const searchProfiles = async (query: string, currentUserId?: string): Promise<SearchProfile[]> => {
    if (!query.trim()) return [];

    try {
        const { data, error } = await supabase.rpc('search_profiles_trgm', {
            search_query: query,
            limit_num: 20
        });

        if (error) throw error;

        let results = data as SearchProfile[];

        // Exclude the current user from search results
        if (currentUserId) {
            results = results.filter(p => p.id !== currentUserId);
        }

        // Fetch following status
        if (currentUserId && results.length > 0) {
            const profileIds = results.map(p => p.id);
            const { data: follows } = await supabase
                .from('user_followers')
                .select('following_id')
                .eq('follower_id', currentUserId)
                .in('following_id', profileIds);

            const followingSet = new Set(follows?.map((f: any) => f.following_id) || []);
            results = results.map(p => ({
                ...p,
                is_following: followingSet.has(p.id)
            }));
        }

        return results;
    } catch (err) {
        console.error('[Supabase Error - searchProfiles]:', err);
        return [];
    }
};

export const toggleFollow = async (followerId: string, followingId: string, currentlyFollowing: boolean) => {
    try {
        if (currentlyFollowing) {
            return await supabase.from('user_followers')
                .delete()
                .match({ follower_id: followerId, following_id: followingId });
        } else {
            return await supabase.from('user_followers')
                .insert({ follower_id: followerId, following_id: followingId });
        }
    } catch (err) {
        console.error('[Supabase Error - toggleFollow]:', err);
        throw err;
    }
};

export const createPost = async (userId: string, content: string, type: 'text' | 'image' | 'reel' = 'text', mediaUrl?: string) => {
    try {
        let media_url = mediaUrl || null;

        const { data, error } = await supabase.from('posts').insert({
            user_id: userId,
            content: content.trim() ? content.trim() : null,
            type,
            media_url
        }).select().single();

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('[Supabase Error - createPost]:', err);
        throw err;
    }
};

export type UserProfileDetails = {
    id: string;
    full_name: string | null;
    username: string;
    avatar_url: string | null;
    created_at: string;
    followers_count: number;
    following_count: number;
    is_following: boolean;
};

export const fetchUserProfile = async (identifier: string, currentUserId?: string): Promise<UserProfileDetails | null> => {
    try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

        let query = supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, created_at');

        if (isUUID) {
            query = query.eq('id', identifier);
        } else {
            query = query.eq('username', identifier);
        }

        const { data: profile, error } = await query.maybeSingle();

        if (error || !profile) return null;

        const [followersReq, followingReq, isFollowingReq] = await Promise.all([
            supabase.from('user_followers').select('follower_id', { count: 'exact' }).eq('following_id', profile.id),
            supabase.from('user_followers').select('following_id', { count: 'exact' }).eq('follower_id', profile.id),
            currentUserId ? supabase.from('user_followers').select('follower_id').match({ follower_id: currentUserId, following_id: profile.id }).maybeSingle() : Promise.resolve({ data: null })
        ]);

        return {
            ...profile,
            followers_count: followersReq.count || 0,
            following_count: followingReq.count || 0,
            is_following: !!isFollowingReq.data
        };
    } catch (err) {
        console.error('[Supabase Error - fetchUserProfile]:', err);
        return null;
    }
};

export const fetchUserPosts = async (profileId: string, limit = 20): Promise<Post[]> => {
    try {
        const { data: postsData, error } = await supabase
            .from('posts')
            .select(`
                *,
                profiles:user_id(id, full_name, username, avatar_url)
            `)
            .eq('user_id', profileId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        if (!postsData || postsData.length === 0) return [];

        const postIds = postsData.map((p: any) => p.id);
        const { data: { user } } = await supabase.auth.getUser();

        const [likesReq, commentsReq, myLikesReq] = await Promise.all([
            supabase.from('post_likes').select('post_id', { count: 'exact' }).in('post_id', postIds),
            supabase.from('post_comments').select('post_id', { count: 'exact' }).in('post_id', postIds),
            user ? supabase.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', postIds) : Promise.resolve({ data: [] })
        ]);

        const likesCountMap = (likesReq.data || []).reduce((acc: any, curr: any) => {
            acc[curr.post_id] = (acc[curr.post_id] || 0) + 1;
            return acc;
        }, {});

        const commentsCountMap = (commentsReq.data || []).reduce((acc: any, curr: any) => {
            acc[curr.post_id] = (acc[curr.post_id] || 0) + 1;
            return acc;
        }, {});

        const myLikedPostIds = new Set((myLikesReq.data || []).map((l: any) => l.post_id));

        return postsData.map((p: any) => ({
            ...p,
            profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
            likes_count: likesCountMap[p.id] || 0,
            comments_count: commentsCountMap[p.id] || 0,
            is_liked_by_me: myLikedPostIds.has(p.id)
        }));
    } catch (err) {
        console.error('[Supabase Error - fetchUserPosts]:', err);
        return [];
    }
};

export const getOrCreateChatRoom = async (user1Id: string, user2Id: string): Promise<string | null> => {
    try {
        // Find existing direct chat room
        const { data: rooms1 } = await supabase.from('chat_participants').select('room_id').eq('user_id', user1Id);
        const { data: rooms2 } = await supabase.from('chat_participants').select('room_id').eq('user_id', user2Id);

        if (rooms1 && rooms2) {
            const r1Ids = new Set(rooms1.map((r: any) => r.room_id));
            const commonRoom = rooms2.find((r: any) => r1Ids.has(r.room_id));
            if (commonRoom) {
                // verify it's a direct room
                const { data: roomDetails } = await supabase.from('chat_rooms').select('type').eq('id', commonRoom.room_id).maybeSingle();
                if (roomDetails && roomDetails.type === 'direct') {
                    return commonRoom.room_id;
                }
            }
        }

        // Create new room
        const { data: newRoom, error: roomError } = await supabase.from('chat_rooms').insert({ type: 'direct' }).select('id').single();
        if (roomError || !newRoom) throw roomError;

        // Add participants
        await supabase.from('chat_participants').insert([
            { room_id: newRoom.id, user_id: user1Id },
            { room_id: newRoom.id, user_id: user2Id }
        ]);

        return newRoom.id;
    } catch (err) {
        console.error('[Supabase Error - getOrCreateChatRoom]:', err);
        return null;
    }
};



export type Reel = {
  id: string;
  user_id: string;
  video_url: string;
  caption: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { id?: string; full_name: string | null; username?: string; avatar_url: string | null };
  likes_count?: number;
  comments_count?: number;
  is_liked_by_me?: boolean;
};

export type ReelComment = {
    id: string;
    reel_id: string;
    user_id: string;
    parent_comment_id: string | null;
    content: string;
    created_at: string;
    updated_at: string;
    profiles?: { id?: string; full_name: string | null; username?: string; avatar_url: string | null };
    likes_count?: number;
    is_liked_by_me?: boolean;
    replies?: ReelComment[];
};




export const fetchReels = async (limit = 20, cursor?: string): Promise<{ data: Reel[], nextCursor: string | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    // Use the custom RPC function for the weighted chronological algorithm feed
    const { data: reelsData, error } = await supabase
        .rpc('get_reels_feed', {
            p_limit: limit,
            p_cursor: cursor || null
        });

    if (error) throw error;
    if (!reelsData || reelsData.length === 0) return { data: [], nextCursor: null };

    const reelIds = reelsData.map((p: any) => p.id);
    const userIds = [...new Set(reelsData.map((p: any) => p.user_id))];

    const [myLikesReq, profilesReq] = await Promise.all([
      user ? supabase.from('reel_likes').select('reel_id').eq('user_id', user.id).in('reel_id', reelIds) : Promise.resolve({ data: [] }),
      supabase.from('profiles').select('id, full_name, username, avatar_url').in('id', userIds)
    ]);

    const myLikedReelIds = new Set((myLikesReq.data || []).map((l: any) => l.reel_id));

    // Map profiles
    const profilesMap = (profilesReq.data || []).reduce((acc: any, profile: any) => {
        acc[profile.id] = profile;
        return acc;
    }, {});

    const formattedData = reelsData.map((p: any) => ({
      ...p,
      profiles: profilesMap[p.user_id],
      is_liked_by_me: myLikedReelIds.has(p.id)
    }));

    return {
      data: formattedData as Reel[],
      nextCursor: reelsData.length === limit ? reelsData[reelsData.length - 1].created_at : null
    };
  } catch (err) {
    console.error('[Supabase Error - fetchReels]:', err);
    return { data: [], nextCursor: null };
  }
};

export const fetchReel = async (id: string, currentUserId?: string): Promise<Reel | null> => {
    try {
        const { data, error } = await supabase
            .from('reels')
            .select(`*, profiles:user_id(id, full_name, username, avatar_url)`)
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        const [likesReq, commentsReq, myLikesReq] = await Promise.all([
            supabase.from('reel_likes').select('reel_id', { count: 'exact' }).eq('reel_id', id),
            supabase.from('reel_comments').select('reel_id', { count: 'exact' }).eq('reel_id', id),
            currentUserId ? supabase.from('reel_likes').select('reel_id').eq('user_id', currentUserId).eq('reel_id', id).maybeSingle() : Promise.resolve({ data: null })
        ]);

        return {
            ...data,
            profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
            likes_count: likesReq.count || 0,
            comments_count: commentsReq.count || 0,
            is_liked_by_me: !!myLikesReq.data
        } as Reel;
    } catch (err) {
        console.error('[Supabase Error - fetchReel]:', err);
        return null;
    }
};

export const toggleLikeReel = async (reelId: string, userId: string, currentlyLiked: boolean) => {
    try {
        if (currentlyLiked) {
            return await supabase.from('reel_likes').delete().match({ reel_id: reelId, user_id: userId });
        } else {
            return await supabase.from('reel_likes').insert({ reel_id: reelId, user_id: userId });
        }
    } catch (err) {
        console.error('[Supabase Error - toggleLikeReel]:', err);
        throw err;
    }
};

export const createReel = async (userId: string, videoUrl: string, caption?: string) => {
    try {
        const { data, error } = await supabase.from('reels').insert({
            user_id: userId,
            video_url: videoUrl,
            caption: caption?.trim() || null
        }).select().single();

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('[Supabase Error - createReel]:', err);
        throw err;
    }
};

export const fetchReelComments = async (reelId: string, userId?: string): Promise<ReelComment[]> => {
    try {
        const { data: commentsData, error } = await supabase
            .from('reel_comments')
            .select(`
                *,
                profiles:user_id(id, full_name, username, avatar_url)
            `)
            .eq('reel_id', reelId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        if (!commentsData || commentsData.length === 0) return [];

        const commentIds = commentsData.map((c: any) => c.id);

        const [likesReq, myLikesReq] = await Promise.all([
            supabase.from('reel_comment_likes').select('comment_id', { count: 'exact' }).in('comment_id', commentIds),
            userId ? supabase.from('reel_comment_likes').select('comment_id').eq('user_id', userId).in('comment_id', commentIds) : Promise.resolve({ data: [] })
        ]);

        const likesCountMap = (likesReq.data || []).reduce((acc: any, curr: any) => {
            acc[curr.comment_id] = (acc[curr.comment_id] || 0) + 1;
            return acc;
        }, {});

        const myLikedCommentIds = new Set((myLikesReq.data || []).map((l: any) => l.comment_id));

        const formattedComments: ReelComment[] = commentsData.map((c: any) => ({
            ...c,
            profiles: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles,
            likes_count: likesCountMap[c.id] || 0,
            is_liked_by_me: myLikedCommentIds.has(c.id),
            replies: []
        }));

        // Organize into a tree structure
        const commentMap = new Map<string, ReelComment>();
        const rootComments: ReelComment[] = [];

        formattedComments.forEach(c => commentMap.set(c.id, c));

        formattedComments.forEach(c => {
            if (c.parent_comment_id && commentMap.has(c.parent_comment_id)) {
                commentMap.get(c.parent_comment_id)!.replies!.push(c);
            } else {
                rootComments.push(c);
            }
        });

        return rootComments;

    } catch (err) {
        console.error('[Supabase Error - fetchReelComments]:', err);
        return [];
    }
};

export const toggleLikeReelComment = async (commentId: string, userId: string, currentlyLiked: boolean) => {
    try {
        if (currentlyLiked) {
            return await supabase.from('reel_comment_likes').delete().match({ comment_id: commentId, user_id: userId });
        } else {
            return await supabase.from('reel_comment_likes').insert({ comment_id: commentId, user_id: userId });
        }
    } catch (err) {
        console.error('[Supabase Error - toggleLikeReelComment]:', err);
        throw err;
    }
};

export const createReelComment = async (reelId: string, userId: string, content: string, parentCommentId: string | null = null) => {
    try {
        const { data, error } = await supabase.from('reel_comments').insert({
            reel_id: reelId,
            user_id: userId,
            content: content.trim(),
            parent_comment_id: parentCommentId
        }).select(`
            *,
            profiles:user_id(id, full_name, username, avatar_url)
        `).single();

        if (error) throw error;

        return {
            ...data,
            profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
            likes_count: 0,
            is_liked_by_me: false,
            replies: []
        } as ReelComment;
    } catch (err) {
        console.error('[Supabase Error - createReelComment]:', err);
        throw err;
    }
};


// --- Community Blocking Feature ---

export const blockUser = async (blockerId: string, blockedId: string) => {
    try {
        const { error } = await supabase.from('user_blocks').insert({
            blocker_id: blockerId,
            blocked_id: blockedId
        });
        if (error) throw error;
    } catch (err) {
        console.error('[Supabase Error - blockUser]:', err);
        throw err;
    }
};

export const unblockUser = async (blockerId: string, blockedId: string) => {
    try {
        const { error } = await supabase.from('user_blocks').delete().match({
            blocker_id: blockerId,
            blocked_id: blockedId
        });
        if (error) throw error;
    } catch (err) {
        console.error('[Supabase Error - unblockUser]:', err);
        throw err;
    }
};

// Returns if currentUserId has blocked otherUserId, and if otherUserId has blocked currentUserId
export const checkBlockStatus = async (currentUserId: string, otherUserId: string): Promise<{ hasBlocked: boolean, isBlockedBy: boolean }> => {
    try {
        const { data, error } = await supabase
            .from('user_blocks')
            .select('blocker_id, blocked_id')
            .or(`and(blocker_id.eq.${currentUserId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${currentUserId})`);

        if (error) throw error;

        let hasBlocked = false;
        let isBlockedBy = false;

        if (data && data.length > 0) {
            data.forEach(block => {
                if (block.blocker_id === currentUserId && block.blocked_id === otherUserId) {
                    hasBlocked = true;
                }
                if (block.blocker_id === otherUserId && block.blocked_id === currentUserId) {
                    isBlockedBy = true;
                }
            });
        }

        return { hasBlocked, isBlockedBy };
    } catch (err) {
        console.error('[Supabase Error - checkBlockStatus]:', err);
        return { hasBlocked: false, isBlockedBy: false };
    }
};

// Fetch Profile Username
export const fetchProfileUsername = async (userId: string) => {
  const { data, error } = await supabase.from('profiles').select('username').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data?.username || null;
};
