import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CommentThread } from '../components/CommentThread';
import { supabase } from '../../../lib/supabase';
import { fetchComments, toggleLikePost, toggleLikeComment, createComment, Post } from '../api/communityApi';
import { useAuth } from '../../auth/context/AuthContext';
import { Heart, MessageCircle, Share2, ArrowLeft, Send, Loader2 } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useNotificationStore } from '../../../stores/useNotificationStore';
import { translateError } from '../utils/errorTranslation';
import { CommentSkeleton } from '../components/CommentSkeleton';
import { useDeletePost } from '../hooks/useDeletion';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { Trash2, MoreVertical } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';

import { ErrorState } from '../../../components/ui/ErrorState';

import { KeyboardAwareBottomBar } from "../../../components/ui/KeyboardAwareBottomBar";
export const PostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useNotificationStore();
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string, username: string } | null>(null);

  const { deletePost, isPending: isDeleting } = useDeletePost();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteConfirm = async () => {
      if (!user || !post) return;
      try {
          await deletePost({ id: post.id, ownerId: user.id });
          setIsDeleteModalOpen(false);
          // Navigate back since the post is now deleted
          navigate(-1);
      } catch (err) {
          // Error handled by hook toast
      }
  };


  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['community-post', id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select(`*, profiles:user_id(id, full_name, username, avatar_url)`)
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        if (!data) return null;

      const [likesReq, commentsReq, myLikesReq] = await Promise.all([
        supabase.from('post_likes').select('post_id', { count: 'exact' }).eq('post_id', id),
        supabase.from('post_comments').select('post_id', { count: 'exact' }).eq('post_id', id),
        user ? supabase.from('post_likes').select('post_id').eq('user_id', user.id).eq('post_id', id).maybeSingle() : Promise.resolve({ data: null })
      ]);

        return {
          ...data,
          profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
          likes_count: likesReq.count || 0,
          comments_count: commentsReq.count || 0,
          is_liked_by_me: !!myLikesReq.data
        } as Post;
      } catch (err) {
        console.error('[Supabase Error - fetchPostPage]:', err);
        throw err;
      }
    },
    enabled: !!id
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['community-comments', id],
    queryFn: () => fetchComments(id!, user?.id),
    enabled: !!id
  });

  const likePostMutation = useMutation({
    mutationFn: (currentlyLiked: boolean) => toggleLikePost(id!, user!.id, currentlyLiked),
    onMutate: async (currentlyLiked) => {
      await queryClient.cancelQueries({ queryKey: ['community-post', id] });
      const previousPost = queryClient.getQueryData(['community-post', id]);

      queryClient.setQueryData(['community-post', id], (old: any) => ({
        ...old,
        is_liked_by_me: !currentlyLiked,
        likes_count: old.likes_count ? old.likes_count + (currentlyLiked ? -1 : 1) : (currentlyLiked ? 0 : 1)
      }));
      return { previousPost };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(['community-post', id], context.previousPost);
      }
    }
  });

  const submitCommentMutation = useMutation({
    mutationFn: (content: string) => createComment(id!, user!.id, content, replyingTo?.id),
    onSuccess: () => {
      setCommentText('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['community-comments', id] });
      queryClient.invalidateQueries({ queryKey: ['community-post', id] });
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

  if (postLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500 w-8 h-8" /></div>;
  }

  if (!post) {
    return <div className="p-4 text-center mt-20">Post not found</div>;
  }

  return (
    <div className="flex flex-col w-full max-w-[100vw] md:max-w-2xl mx-auto pb-[200px] min-h-screen bg-white relative">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 p-4 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <h1 className="font-semibold text-lg text-gray-900">Post</h1>
        </div>

        {user && post.user_id === user.id && (
            <Menu as="div" className="relative">
                <Menu.Button
                    className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <MoreVertical size={24} className="text-gray-700" />
                </Menu.Button>
                <Transition
                    as={React.Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                >
                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-xl shadow-lg border border-gray-100 focus:outline-none z-50">
                        <div className="py-1">
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={() => setIsDeleteModalOpen(true)}
                                        disabled={isDeleting}
                                        className={cn(
                                            active ? 'bg-red-50' : '',
                                            'flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 font-medium disabled:opacity-50'
                                        )}
                                    >
                                        <Trash2 size={16} />
                                        {isDeleting ? 'Deleting...' : 'Delete Post'}
                                    </button>
                                )}
                            </Menu.Item>
                        </div>
                    </Menu.Items>
                </Transition>
            </Menu>
        )}
      </div>
      <ConfirmDeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteConfirm}
            isDeleting={isDeleting}
        />

      {/* Main Post Content */}
        <div className="bg-white p-4 mb-0 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => navigate(`/u/${post.profiles?.username || post.user_id}`)}>
          <img
            src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${post.profiles?.full_name || 'User'}`}
            className="w-12 h-12 rounded-full object-cover border border-gray-200"
            alt="avatar"
          />
          <div>
            <div className="font-semibold text-gray-900">{post.profiles?.full_name || 'MindFlow User'}</div>
            <div className="text-sm text-gray-500">{new Date(post.created_at).toLocaleString()}</div>
          </div>
        </div>

        <div className="text-gray-900 text-lg mb-4 whitespace-pre-wrap">{post.content}</div>

        {post.media_url && (
          <img src={post.media_url} alt="media" className="w-full rounded-2xl mb-4 object-cover max-h-[60vh] border border-gray-100" />
        )}

        <div className="flex items-center gap-6 mt-2 pt-4 border-t border-gray-100">
          <button
            onClick={() => user && likePostMutation.mutate(!!post.is_liked_by_me)}
            className="flex items-center gap-2 group"
          >
            <div className={cn("p-2 rounded-full transition-all duration-300", post.is_liked_by_me ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-600 hover:bg-gray-100")}>
              <Heart size={24} className={cn(post.is_liked_by_me && "fill-current")} />
            </div>
            <span className="font-medium text-gray-600">{post.likes_count || 0}</span>
          </button>
          <div className="flex items-center gap-2 text-gray-600">
            <MessageCircle size={24} className="p-1" />
            <span className="font-medium">{post.comments_count || 0}</span>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="flex-1 bg-white px-4 py-2">
        <h2 className="font-semibold text-gray-900 mb-6">Comments</h2>

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
                    comment={comment}
                    onReply={(id, username) => setReplyingTo({ id, username })}
                    currentUserId={user?.id}
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
                src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email}`}
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

// Recursive Component for Threaded Comments
