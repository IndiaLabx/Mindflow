import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { fetchPosts, toggleLikePost, createComment, Post } from '../api/communityApi';
import { useSocialRealtime } from '../hooks/useSocialRealtime';
import { useAuth } from '../../auth/context/AuthContext';
import { Heart, MessageCircle, Share2, MoreVertical, Plus, Send, Loader2, PenSquare, Film, X } from 'lucide-react';
import { ReelUploadModal } from '../components/ReelUploadModal';
import { cn } from '../../../utils/cn';
import { useNotificationStore } from '../../../stores/useNotificationStore';
import { useNavigate } from 'react-router-dom';
import { CreatePostModal } from '../components/CreatePostModal';
import { PostCardSkeleton } from '../components/PostCardSkeleton';
import { PostCard } from '../components/PostCard';
import { ErrorBoundary } from '@/providers/ErrorBoundary';
import { SocialHeader } from '../components/SocialHeader';
import { ErrorState } from '../../../components/ui/ErrorState';

// --- Particle Component for "Wow" Effect ---
const FloatingHeart: React.FC<{ x: number, y: number, onComplete: () => void }> = ({ x, y, onComplete }) => {
  const xOffset = (Math.random() - 0.5) * 60;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, x: x - 24, y: y - 24, rotate: -20 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1.2, 1, 0.8],
        y: y - 150,
        x: x - 24 + xOffset,
        rotate: 20
      }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      onAnimationComplete={onComplete}
      className="fixed z-[9999] pointer-events-none drop-shadow-lg text-red-500"
    >
      <Heart size={48} className="fill-current" />
    </motion.div>
  );
};

export const CommunityFeed: React.FC = () => {
  const { user } = useAuth();
  useSocialRealtime();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const { showToast } = useNotificationStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReelModalOpen, setIsReelModalOpen] = useState(false);
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['community-posts'],
    queryFn: ({ pageParam }) => fetchPosts(10, pageParam as string | undefined),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const likeMutation = useMutation({
    mutationFn: ({ postId, currentlyLiked }: { postId: string, currentlyLiked: boolean }) => 
      toggleLikePost(postId, user!.id, currentlyLiked),
    onMutate: async ({ postId, currentlyLiked }) => {
      await queryClient.cancelQueries({ queryKey: ['community-posts'] });
      const previousData = queryClient.getQueryData(['community-posts']);
      
      queryClient.setQueryData(['community-posts'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((p: Post) => {
              if (p.id === postId) {
                return {
                  ...p,
                  is_liked_by_me: !currentlyLiked,
                  likes_count: p.likes_count ? p.likes_count + (currentlyLiked ? -1 : 1) : (currentlyLiked ? 0 : 1)
                };
              }
              return p;
            })
          }))
        };
      });
      return { previousData };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['community-posts'], context.previousData);
      }
      showToast({ title: 'Error', message: 'Failed to like post. Please try again.', variant: 'error' });
    }
  });

  const handleDoubleTapLike = (postId: string, currentlyLiked: boolean, x: number, y: number) => {
    if (!currentlyLiked) {
      if (user) {
         likeMutation.mutate({ postId, currentlyLiked });
      }
      const newParticle = { id: Date.now() + Math.random(), x, y };
      setParticles(prev => [...prev, newParticle]);
      if (navigator.vibrate) navigator.vibrate(50);
    }
  };

  const removeParticle = useCallback((id: number) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  }, []);

  if (status === 'pending') {
    return (
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto pb-32 pt-0 px-0 md:px-4">
      <SocialHeader />
      <div className="w-full px-4">
        {[1, 2, 3].map(i => <PostCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto pb-32 pt-0 px-0 md:px-4">
      <SocialHeader />
      <div className="w-full px-4 flex flex-col items-center">
      <AnimatePresence>
        {particles.map(p => (
          <FloatingHeart key={p.id} x={p.x} y={p.y} onComplete={() => removeParticle(p.id)} />
        ))}
      </AnimatePresence>

      {data?.pages.map((page: any, i: number) => (
        <React.Fragment key={i}>
          {page.data.map((post: Post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={() => {
                if (!user) return;
                likeMutation.mutate({ postId: post.id, currentlyLiked: !!post.is_liked_by_me });
              }}
              onDoubleTap={(x, y) => handleDoubleTapLike(post.id, !!post.is_liked_by_me, x, y)}
              navigate={navigate}
              user={user}
            />
          ))}
        </React.Fragment>
      ))}

      {/* Loading Indicator for Next Page */}
      <div ref={ref} className="w-full flex justify-center py-4">
        {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />}
      </div>


      {/* --- Speed Dial FAB --- */}
      <div className="fixed bottom-24 md:bottom-20 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {isSpeedDialOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-end gap-3 mb-2"
            >
              <div className="flex items-center gap-3">
                <span className="text-white text-xs font-semibold px-2 py-1 bg-black/60 backdrop-blur-md rounded-md shadow-md">
                  Upload Reel
                </span>
                <button
                  onClick={() => {
                    setIsReelModalOpen(true);
                    setIsSpeedDialOpen(false);
                  }}
                  className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all relative group"
                >
                  <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  {/* Subtle Pulse Animation for Premium Feel */}
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 opacity-30 animate-pulse -z-10 blur-sm"></div>
                  <Film size={20} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-white text-xs font-semibold px-2 py-1 bg-black/60 backdrop-blur-md rounded-md shadow-md">
                  Create Post
                </span>
                <button
                  onClick={() => {
                    setIsCreateModalOpen(true);
                    setIsSpeedDialOpen(false);
                  }}
                  className="p-3 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-gray-100 dark:border-slate-700 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
                >
                  <PenSquare size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsSpeedDialOpen(!isSpeedDialOpen)}
          className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all relative"
        >
          <div className={`transition-transform duration-300 ${isSpeedDialOpen ? 'rotate-45' : 'rotate-0'}`}>
            <Plus size={28} />
          </div>
        </button>
      </div>

      </div>
      <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} feedType="posts" />
      <ReelUploadModal isOpen={isReelModalOpen} onClose={() => setIsReelModalOpen(false)} onSuccess={() => {}} />
    </div>
  );
};

