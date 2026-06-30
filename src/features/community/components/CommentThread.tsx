import React, { useState, useMemo } from 'react';
import { PresenceAvatar } from '../../../components/ui/PresenceAvatar';
import { PresenceDot } from '../../../components/ui/PresenceDot';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toggleLikeComment, toggleLikeReelComment } from '../api/communityApi';
import { cn } from '../../../utils/cn';
import { useDeleteComment } from '../hooks/useDeletion';
import { Trash2, Loader2, MoreVertical, Flag } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

import { useNotificationStore } from '../../../stores/useNotificationStore';

// Helper to flatten the replies array to avoid infinite DOM recursion
const flattenReplies = (replies: any[], replyingToUsername?: string): any[] => {
  let flat: any[] = [];
  replies.forEach(reply => {
    flat.push({ ...reply, replyingToUsername });
    if (reply.replies && reply.replies.length > 0) {
      const username = reply.profiles?.username || reply.profiles?.full_name || 'User';
      flat = flat.concat(flattenReplies(reply.replies, username));
    }
  });
  return flat;
};

const SingleComment: React.FC<{
  comment: any;
  onReply: (id: string, username: string) => void;
  currentUserId?: string;
  isReply?: boolean;
  isReelComment?: boolean;
  replyingToUsername?: string;
}> = React.memo(({ comment, onReply, currentUserId, isReply, isReelComment, replyingToUsername }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useNotificationStore();

  const { deleteComment, isPending: isDeleting } = useDeleteComment(
      isReelComment ? 'reel' : 'post',
      isReelComment ? comment.reel_id : comment.post_id
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteConfirm = async () => {
      if (!currentUserId) return;
      try {
          await deleteComment({ id: comment.id, ownerId: currentUserId });
          setIsDeleteModalOpen(false);
      } catch (err) {
          // Error handled by hook toast
      }
  };


  const likeCommentMutation = useMutation({
    mutationFn: (currentlyLiked: boolean) =>
      isReelComment
        ? toggleLikeReelComment(comment.id, currentUserId!, currentlyLiked)
        : toggleLikeComment(comment.id, currentUserId!, currentlyLiked),
    onMutate: async (currentlyLiked) => {
      const queryKey = isReelComment
        ? ['community-reel-comments', comment.reel_id]
        : ['community-comments', comment.post_id];

      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
          if (!old) return old;
          // Helper to recursively find and update the comment in the tree
          const updateInTree = (nodes: any[]): any[] => {
            return nodes.map((c: any) => {
              if (c.id === comment.id) {
                return { ...c, is_liked_by_me: !currentlyLiked, likes_count: (c.likes_count || 0) + (currentlyLiked ? -1 : 1) };
              }
              if (c.replies) {
                return { ...c, replies: updateInTree(c.replies) };
              }
              return c;
            });
          };
          return updateInTree(old);
      });
      return { previousData, queryKey };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousData && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      showToast({ title: 'Error', message: 'Failed to like comment', variant: 'error' });
    }
  });

  return (
    <div className={cn("w-full flex items-start justify-between mb-5 transition-opacity", isReply ? "mt-3 pl-12" : "mt-2", isDeleting && "opacity-50 pointer-events-none")}>
      <div onClick={(e) => { e.stopPropagation(); navigate(`/u/${comment.profiles?.username || comment.user_id}`); }} className={cn("shrink-0 cursor-pointer", isReply ? "w-8 h-8" : "w-10 h-10")}>
        <PresenceAvatar
          userId={comment.user_id}
          avatarUrl={comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${comment.profiles?.full_name || 'User'}`}
          altText="avatar"
          className="w-full h-full"
        />
      </div>
        <div className="flex-1 pr-1 ml-3 flex flex-col justify-start">
          <div className="flex justify-between items-start">
          <div className="text-[14px] leading-snug pr-2">
            <div className="inline-flex items-center gap-1.5 mr-2">
              <span
                className="font-bold text-gray-900 cursor-pointer hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/u/${comment.profiles?.username || comment.user_id}`);
                }}
              >
                {comment.profiles?.full_name || 'User'}
              </span>
              <PresenceDot userId={comment.user_id} className="w-2 h-2" />
            </div>
            <div className="text-gray-900 whitespace-pre-wrap break-words min-w-0" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                {replyingToUsername && (
                    <span className="text-blue-600 font-medium mr-1 cursor-pointer hover:underline">
                        @{replyingToUsername}
                    </span>
                )}
                {comment.content}
            </div>
          </div>
          <div className="shrink-0 pt-0.5">
             {(comment.user_id === currentUserId) ? (
                 <Menu as="div" className="relative">
                    <Menu.Button className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                        <MoreVertical size={16} />
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
                        <Menu.Items className="absolute right-0 mt-1 w-40 origin-top-right bg-white rounded-xl shadow-lg border border-gray-100 focus:outline-none z-50">
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
                                            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            {isDeleting ? 'Deleting...' : 'Delete'}
                                        </button>
                                    )}
                                </Menu.Item>
                            </div>
                        </Menu.Items>
                    </Transition>
                 </Menu>
             ) : (
                <Menu as="div" className="relative">
                    <Menu.Button className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                        <MoreVertical size={16} />
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
                        <Menu.Items className="absolute right-0 mt-1 w-40 origin-top-right bg-white rounded-xl shadow-lg border border-gray-100 focus:outline-none z-50">
                            <div className="py-1">
                                <Menu.Item>
                                    {({ active }) => (
                                        <button
                                            className={cn(
                                                active ? 'bg-gray-50' : '',
                                                'flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 font-medium'
                                            )}
                                            onClick={() => {}}
                                        >
                                            <Flag size={16} /> Report
                                        </button>
                                    )}
                                </Menu.Item>
                            </div>
                        </Menu.Items>
                    </Transition>
                 </Menu>
             )}
          </div>
          </div>

        <div className="flex items-center gap-4 mt-1.5">
          <span className="text-[12px] text-gray-500 font-medium">
            {new Date(comment.created_at).toLocaleDateString()}
          </span>
          <button
            onClick={() => onReply(comment.id, comment.profiles?.username || comment.profiles?.full_name || 'User')}
            disabled={isDeleting}
            className="text-[12px] text-gray-500 font-semibold hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            Reply
          </button>



          <ConfirmDeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteConfirm}
            isDeleting={isDeleting}
            title="Delete Comment"
            message="Are you sure you want to delete this comment?"
          />
        </div>
      </div>

      <div className="flex flex-col items-center justify-start ml-auto pl-3 pt-2">
        <button
          onClick={() => currentUserId && likeCommentMutation.mutate(!!comment.is_liked_by_me)}
          className={cn("p-3 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-3 transition-all", comment.is_liked_by_me ? "text-red-500 scale-110" : "text-gray-400 hover:text-gray-600")}
          aria-label={comment.is_liked_by_me ? "Unlike comment" : "Like comment"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={comment.is_liked_by_me ? "currentColor" : "none"} stroke="currentColor" strokeWidth={comment.is_liked_by_me ? "0" : "2"} strokeLinecap="round" strokeLinejoin="round">
             <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
        {(comment.likes_count || 0) > 0 && (
          <span className="text-[10px] font-semibold text-gray-500 mt-0.5">{comment.likes_count}</span>
        )}

      </div>
    </div>
  );
});

export const CommentThread: React.FC<{
  comment: any;
  onReply: (id: string, username: string) => void;
  currentUserId?: string;
  isReelComment?: boolean;
  isReply?: boolean;
}> = React.memo(({ comment, onReply, currentUserId, isReelComment, isReply }) => {
  const [showReplies, setShowReplies] = useState(false);

  const flatRepliesCorrected = useMemo(() => {
    if (!comment.replies || comment.replies.length === 0) return [];

    let flat: any[] = [];
    comment.replies.forEach((reply: any) => {
        // Level 1 replies get NO replyingToUsername
        flat.push({ ...reply, replyingToUsername: undefined });
        if (reply.replies && reply.replies.length > 0) {
            const username = reply.profiles?.username || reply.profiles?.full_name || 'User';
            flat = flat.concat(flattenReplies(reply.replies, username));
        }
    });
    return flat;
  }, [comment.replies]);

  return (
    <div className="flex flex-col w-full">
      {/* Top Level Parent Comment */}
      <SingleComment
        comment={comment}
        onReply={onReply}
        currentUserId={currentUserId}
        isReelComment={isReelComment}
        isReply={isReply}
      />

      {/* View Replies Toggle & Flat Replies List */}
      {flatRepliesCorrected.length > 0 && (
        <div className="pl-12">
            {!showReplies ? (
              <div
                className="flex items-center gap-3 mt-1 mb-3 cursor-pointer"
                onClick={() => setShowReplies(true)}
              >
                 <div className="w-8 h-px bg-gray-300"></div>
                 <span className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                     View replies ({flatRepliesCorrected.length})
                 </span>
              </div>
            ) : (
              <div className="flex flex-col">
                  <div
                    className="flex items-center gap-3 mt-1 mb-2 cursor-pointer"
                    onClick={() => setShowReplies(false)}
                  >
                     <div className="w-8 h-px bg-gray-300"></div>
                     <span className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                         Hide replies
                     </span>
                  </div>
                  {flatRepliesCorrected.map((reply: any) => (
                    <SingleComment
                      key={reply.id}
                      comment={reply}
                      onReply={onReply}
                      currentUserId={currentUserId}
                      isReelComment={isReelComment}
                      isReply={true}
                      replyingToUsername={reply.replyingToUsername}
                    />
                  ))}
              </div>
            )}
        </div>
      )}
    </div>
  );
});

export default CommentThread;
