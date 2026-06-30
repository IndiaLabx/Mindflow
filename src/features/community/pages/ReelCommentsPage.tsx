import React, { useState } from 'react';
import { getCanonicalAvatarUrl } from '../../../utils/avatar';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { fetchReelComments, toggleLikeReel, createReelComment, Reel } from '../api/communityApi';
import { useAuth } from '../../auth/context/AuthContext';
import { Heart, ArrowLeft, Send, Loader2, MessageCircle } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useNotificationStore } from '../../../stores/useNotificationStore';
import { translateError } from '../utils/errorTranslation';
import { CommentSkeleton } from '../components/CommentSkeleton';
import { CommentThread } from '../components/CommentThread';
import { ErrorState } from '../../../components/ui/ErrorState';

import { KeyboardAwareBottomBar } from "../../../components/ui/KeyboardAwareBottomBar";
export const ReelCommentsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useNotificationStore();
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string, username: string } | null>(null);

  const { data: reel, isLoading: reelLoading } = useQuery({
    queryKey: ['community-reel', id],
    queryFn: async () => {
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
        user ? supabase.from('reel_likes').select('reel_id').eq('user_id', user.id).eq('reel_id', id).maybeSingle() : Promise.resolve({ data: null })
      ]);

        return {
          ...data,
          profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
          likes_count: likesReq.count || 0,
          comments_count: commentsReq.count || 0,
          is_liked_by_me: !!myLikesReq.data
        } as Reel;
      } catch (err) {
        console.error('[Supabase Error - fetchReelPage]:', err);
        throw err;
      }
    },
    enabled: !!id
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['community-reel-comments', id],
    queryFn: () => fetchReelComments(id!, user?.id),
    enabled: !!id
  });

  const likeReelMutation = useMutation({
    mutationFn: (currentlyLiked: boolean) => toggleLikeReel(id!, user!.id, currentlyLiked),
    onMutate: async (currentlyLiked) => {
      await queryClient.cancelQueries({ queryKey: ['community-reel', id] });
      const previousReel = queryClient.getQueryData(['community-reel', id]);

      queryClient.setQueryData(['community-reel', id], (old: any) => ({
        ...old,
        is_liked_by_me: !currentlyLiked,
        likes_count: old.likes_count ? old.likes_count + (currentlyLiked ? -1 : 1) : (currentlyLiked ? 0 : 1)
      }));
      return { previousReel };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousReel) {
        queryClient.setQueryData(['community-reel', id], context.previousReel);
      }
    }
  });

  const submitCommentMutation = useMutation({
    mutationFn: (content: string) => createReelComment(id!, user!.id, content, replyingTo?.id),
    onSuccess: () => {
      setCommentText('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['community-reel-comments', id] });
      queryClient.invalidateQueries({ queryKey: ['community-reel', id] });
      showToast({ title: 'Success', message: 'Comment posted', variant: 'success' });
    },
    onError: (error: any) => {
      const translated = translateError(error, 'submitCommentMutation');
      showToast({ title: 'Error', message: translated.userMessage, variant: 'error' });
    }
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    submitCommentMutation.mutate(commentText);
  };

  if (reelLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500 w-8 h-8" /></div>;
  }

  if (!reel) {
    return <div className="p-4 text-center mt-20">Reel not found</div>;
  }

  return (
    <div className="flex flex-col w-full max-w-[100vw] md:max-w-2xl mx-auto pb-[200px] min-h-screen bg-white relative">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 p-4 flex items-center gap-4 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <h1 className="font-semibold text-lg text-gray-900">Comments</h1>
      </div>

      {/* Reel Info Header (NO VIDEO) */}
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2 cursor-pointer" onClick={() => navigate(`/u/${reel.profiles?.username || reel.user_id}`)}>
          <img
            src={getCanonicalAvatarUrl(reel.profiles, null)}
            className="w-12 h-12 rounded-full object-cover border border-gray-200"
            alt="avatar"
          />
          <div>
            <div className="font-semibold text-gray-900">{reel.profiles?.full_name || reel.profiles?.username || 'MindFlow User'}</div>
            <div className="text-xs text-gray-500">{new Date(reel.created_at).toLocaleString()}</div>
          </div>
        </div>

        {reel.caption && (
          <div className="text-gray-800 text-sm mb-3 whitespace-pre-wrap">{reel.caption}</div>
        )}

        <div className="flex items-center gap-6 mt-2">
          <button
            onClick={() => user && likeReelMutation.mutate(!!reel.is_liked_by_me)}
            className="flex items-center gap-2 group"
          >
            <div className={cn("p-1.5 rounded-full transition-all duration-300", reel.is_liked_by_me ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-600 hover:bg-gray-100")}>
              <Heart size={20} className={cn(reel.is_liked_by_me && "fill-current")} />
            </div>
            <span className="font-medium text-gray-600 text-sm">{reel.likes_count || 0}</span>
          </button>
          <div className="text-sm font-medium text-gray-500">{reel.comments_count || 0} comments</div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="flex-1 bg-white px-4 py-4">
        {commentsLoading ? (
          <div className="space-y-6">
            <CommentSkeleton />
            <CommentSkeleton />
            <CommentSkeleton isReply />
          </div>
        ) : (
          <div className="space-y-6">
            {comments && comments.length > 0 ? (
                comments.map(comment => (
                  <CommentThread
                    key={comment.id}
                    comment={comment as any} // Cast because CommentThread expects PostComment currently
                    onReply={(id, username) => setReplyingTo({ id, username })}
                    currentUserId={user?.id}
                    isReelComment={true}
                  />
                ))
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-3">
                    <MessageCircle size={48} className="text-gray-300" strokeWidth={1.5} />
                    <p className="text-base font-medium">No comments yet</p>
                    <p className="text-sm">Be the first to share your thoughts!</p>
                </div>
            )}
          </div>
        )}
      </div>

      {/* Comment Input Sticky Bottom */}
      {/* Comment Input Keyboard-Aware Fixed Bottom */}
      <KeyboardAwareBottomBar hasGlobalFooter={true} className="!py-3">
        {replyingTo && (
          <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-t-xl mb-3 -mt-3 border border-gray-100 border-b-0 shadow-sm">
            <span className="text-xs text-gray-500">Replying to <span className="font-semibold text-gray-900">{replyingTo.username}</span></span>
            <button type="button" onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-900 text-xs font-bold px-2 py-1">Cancel</button>
          </div>
        )}
        <form onSubmit={handleCommentSubmit} className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
              <img
                src={getCanonicalAvatarUrl(null, user)}
                className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-100 mt-1"
                alt="avatar"
              />
              <textarea
                value={commentText}
                onChange={(e) => {
                    setCommentText(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onFocus={(e) => {
                    // Smoothly scroll to bring composer into view when keyboard opens
                    setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300);
                }}
                placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                className="flex-1 bg-gray-100/80 border border-transparent rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-100 transition-colors outline-none resize-none min-h-[46px] max-h-[120px]"
                rows={1}
                disabled={submitCommentMutation.isPending}
              />
          </div>
          {commentText.trim() && (
             <div className="flex justify-end pr-1">
                <button
                    type="submit"
                    disabled={submitCommentMutation.isPending}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                    {submitCommentMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> Post</>}
                </button>
             </div>
          )}
        </form>
      </KeyboardAwareBottomBar>
    </div>
  );
};
