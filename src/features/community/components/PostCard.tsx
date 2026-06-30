import React, { useState, useRef } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { getCanonicalAvatarUrl } from '../../../utils/avatar';
import { PresenceAvatar } from '../../../components/ui/PresenceAvatar';
import { PresenceDot } from '../../../components/ui/PresenceDot';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreVertical, Send } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createComment, Post } from '../api/communityApi';
import { cn } from '../../../utils/cn';
import { useNotificationStore } from '../../../stores/useNotificationStore';
import { Menu, Transition } from '@headlessui/react';
import { ShieldAlert } from 'lucide-react';
import { ReportModal } from './reports/ReportModal';
import { useDeletePost } from '../hooks/useDeletion';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { Trash2, Loader2 } from 'lucide-react';

import { submitReport } from '../api/reportsApi';

export const PostCard: React.FC<{
  navigate: any;
  post: Post;
  user: any;
  onLike: () => void;
  onDoubleTap: (x: number, y: number) => void;
}> = React.memo(({ post, onLike, onDoubleTap, navigate, user }) => {
  const lastTapRef = useRef<number>(0);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState('');
  const queryClient = useQueryClient();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isHiddenLocally, setIsHiddenLocally] = useState(false);

  const { deletePost, isPending: isDeleting } = useDeletePost();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteConfirm = async () => {
      if (!user) return;
      try {
          await deletePost({ id: post.id, ownerId: user.id });
          setIsDeleteModalOpen(false);
          // QueryClient handles the cache removal, UI will update.
      } catch (err) {
          // Error handled by hook toast
      }
  };


  const handleReportSubmit = async (reason: string, customNote: string) => {
    if (!user) return;
    setIsReporting(true);
    try {
      await submitReport({
        target_id: post.id,
        target_type: 'post',
        reporter_id: user.id,
        reason,
        custom_note: customNote,
        evidence_data: {
            content: post.content,
            media_url: post.media_url,
            author_id: post.user_id,
            author_name: post.profiles?.full_name
        }
      });
      setIsReportModalOpen(false);
      showToast({ title: 'Report Submitted', message: 'Post hidden. Thanks for reporting.', variant: 'success' });
      setIsHiddenLocally(true);
      // Remove from query cache
      queryClient.setQueryData(['community-posts'], (old: any) => {
         if (!old) return old;
         return {
            ...old,
            pages: old.pages.map((page: any) => ({
                ...page,
                data: page.data.filter((p: any) => p.id !== post.id)
            }))
         };
      });
    } catch (error) {
      console.error('Error submitting report:', error);
      showToast({ title: 'Error', message: 'Failed to submit report', variant: 'error' });
    } finally {
      setIsReporting(false);
    }
  };
  const { showToast } = useNotificationStore();

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      let clientX = 0;
      let clientY = 0;
      if ('changedTouches' in e) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
      }
      onDoubleTap(clientX, clientY);
    }
    lastTapRef.current = now;
  };

  const commentMutation = useMutation({
    mutationFn: (content: string) => createComment(post.id, user!.id, content),
    onSuccess: () => {
      setCommentText('');
      setShowCommentBox(false);
      showToast({ title: 'Success', message: 'Comment added!', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
    onError: () => {
      showToast({ title: 'Error', message: 'Failed to post comment', variant: 'error' });
    }
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    commentMutation.mutate(commentText);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDeleting ? 0.5 : 1, y: 0 }}
      className={cn("w-full bg-white backdrop-blur-xl border border-gray-200 rounded-3xl p-4 mb-6 shadow-sm", isDeleting && "pointer-events-none")}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`/u/${post.profiles?.username || post.user_id}`); }}>
          <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-300 overflow-hidden">
            <PresenceAvatar
              userId={post.user_id}
              avatarUrl={getCanonicalAvatarUrl(post.profiles, null)}
              altText={post.profiles?.full_name || 'User'}
              className="w-full h-full"
            />
          </div>
          <div>
            <div className="font-semibold text-gray-900 flex items-center gap-2">
              {post.profiles?.full_name || 'MindFlow User'}
              <PresenceDot userId={post.user_id} />
            </div>
            <div className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()}</div>
          </div>
        </div>
        <Menu as="div" className="relative">
          <Menu.Button
            className="text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="More post options"
          >
            <MoreVertical size={20} />
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
            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 focus:outline-none z-50">
              <div className="py-1">
                {user && user.id === post.user_id && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={(e) => { e.stopPropagation(); setIsDeleteModalOpen(true); }}
                          disabled={isDeleting}
                          className={cn(
                            active ? 'bg-red-50 dark:bg-slate-700/50' : '',
                            'flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 font-medium disabled:opacity-50'
                          )}
                        >
                          <Trash2 size={16} />
                          {isDeleting ? 'Deleting...' : 'Delete Post'}
                        </button>
                      )}
                    </Menu.Item>
                )}
                {user && user.id !== post.user_id && (
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className={cn(
                        active ? 'bg-gray-50 dark:bg-slate-700/50' : '',
                        'flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 font-medium'
                      )}
                    >
                      <ShieldAlert size={16} />
                      Report Post
                    </button>
                  )}
                </Menu.Item>
                )}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>

        <ReportModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            targetName={post.profiles?.full_name || 'Post'}
            targetType="post"
            onSubmit={handleReportSubmit}
        />
        <ConfirmDeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteConfirm}
            isDeleting={isDeleting}
        />
      </div>

      <div
        className="text-gray-900 mb-4 whitespace-pre-wrap select-none cursor-pointer [touch-action:manipulation]"
        onMouseUp={handleTouchEnd}
        onTouchEnd={handleTouchEnd}
        onClick={() => navigate(`/community/post/${post.id}`)}
      >
        {post.content}
      </div>

      {post.media_url && (
        <div
          className="w-full rounded-2xl overflow-hidden mb-4 bg-gray-50 relative select-none cursor-pointer [touch-action:manipulation]"
          onMouseUp={handleTouchEnd}
          onTouchEnd={handleTouchEnd}
          onClick={() => navigate(`/community/post/${post.id}`)}
        >
          <img src={post.media_url} alt="Post media" className="w-full h-auto object-cover max-h-[60vh]" loading="lazy" />
        </div>
      )}

      {post.hls_stream_url && (
        <div className="w-full aspect-[9/16] rounded-2xl overflow-hidden mb-4 bg-black relative flex items-center justify-center">
          <span className="text-gray-500 text-sm">Video View</span>
        </div>
      )}

      <div className="flex items-center gap-6 mt-2 pt-4 border-t border-gray-100">
        <button
          onClick={onLike}
          className="flex items-center gap-2 group"
          aria-label={post.is_liked_by_me ? "Unlike post" : "Like post"}
        >
          <motion.div
            whileTap={{ scale: 0.8 }}
            className={cn(
              "p-2.5 rounded-full transition-all duration-300",
              post.is_liked_by_me
                ? "bg-red-500/10 text-red-500"
                : "bg-gray-50 text-gray-600 group-hover:bg-gray-100 group-hover:text-red-400"
            )}
          >
            <Heart size={20} className={cn(post.is_liked_by_me && "fill-current")} />
          </motion.div>
          <span className="text-sm font-medium text-gray-600">{post.likes_count || 0}</span>
        </button>

        <button
            onClick={() => setShowCommentBox(!showCommentBox)}
            className="flex items-center gap-2 group"
            aria-expanded={showCommentBox}
            aria-label="Toggle comment section"
        >
          <div className="p-2.5 rounded-full bg-gray-50 text-gray-600 group-hover:bg-gray-100 transition-all duration-300 group-hover:text-indigo-400">
            <MessageCircle size={20} />
          </div>
          <span className="text-sm font-medium text-gray-600">{post.comments_count || 0}</span>
        </button>

        <button className="flex items-center gap-2 group ml-auto" aria-label="Share post">
          <div className="p-2.5 rounded-full bg-gray-50 text-gray-600 group-hover:bg-gray-100 transition-all duration-300 hover:text-gray-900">
            <Share2 size={20} />
          </div>
        </button>
      </div>

      <AnimatePresence>
        {showCommentBox && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t border-gray-100 overflow-hidden"
            onSubmit={handleCommentSubmit}
          >
            <div className="flex flex-col gap-3">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-1">
                  <PresenceAvatar
                    userId={user?.id || ''}
                    avatarUrl={getCanonicalAvatarUrl(null, user)}
                    className="w-full h-full"
                    altText="Your avatar"
                  />
                </div>
                <textarea
                  value={commentText}
                  onChange={(e) => {
                    setCommentText(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  placeholder="Add a comment..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[44px] max-h-[120px]"
                  rows={1}
                  disabled={commentMutation.isPending}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!commentText.trim() || commentMutation.isPending}
                  className="px-6 py-2 rounded-full bg-indigo-600 text-white font-medium text-sm disabled:opacity-50 transition-opacity flex items-center gap-2"
                  aria-label="Submit comment">
                  {commentMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> Post Comment</>}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default PostCard;
