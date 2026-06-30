import React, { useEffect, useRef, useState } from 'react';
import { PresenceAvatar } from '../../../components/ui/PresenceAvatar';
import { getCanonicalAvatarUrl } from '../../../utils/avatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchReels, toggleLikeReel, Reel } from '../api/communityApi';
import { useAuth } from '../../auth/context/AuthContext';
import { Heart, MessageCircle, Share2, ArrowLeft, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../utils/cn';
import { CreatePostModal } from '../components/CreatePostModal';
import { ReelUploadModal } from '../components/ReelUploadModal';
import { Plus, Volume2, VolumeX } from 'lucide-react';
import { ReelSkeleton } from '../components/ReelSkeleton';
import { useNotificationStore } from '../../../stores/useNotificationStore';
import { Menu, Transition } from '@headlessui/react';
import { ShieldAlert, MoreVertical } from 'lucide-react';
import { ReportModal } from '../components/reports/ReportModal';
import { useDeleteReel } from '../hooks/useDeletion';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { Trash2 } from 'lucide-react';

import { submitReport } from '../api/reportsApi';
import { ErrorState } from '../../../components/ui/ErrorState';

let sharedIsMuted = true; // Shared mute state across all reels

export const ReelsFeed: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: reelsData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['community-reels'],
    queryFn: () => fetchReels(50),
  });

  const reels = reelsData?.data || [];

  if (isError) return <ErrorState message={(error as Error)?.message || "Failed to load"} onRetry={() => refetch()} />;
    if (isLoading) {
    return (
      <div className="h-full w-full bg-gray-900 overflow-y-scroll snap-y snap-mandatory hide-scrollbar relative z-50">
         <ReelSkeleton />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-900 overflow-y-scroll snap-y snap-mandatory hide-scrollbar relative z-50">
      {/* Absolute Back Button */}
      <div className="fixed top-4 left-4 z-50 mt-4 pt-[env(safe-area-inset-top,0px)]">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-gray-900/40 backdrop-blur-md text-white border border-white/10 shadow-md">
          <ArrowLeft size={24} />
        </button>
      </div>

      {reels.length === 0 ? (
        <div className="h-full w-full flex flex-col items-center justify-center text-slate-500">
          <p className="mb-4">No reels available</p>

        </div>
      ) : (
        reels.map((reel, index) => (
          <ReelItem
             key={reel.id}
             reel={reel}
             currentUser={user}
             index={index}
             activeIndex={activeIndex}
             onVisible={() => setActiveIndex(index)}
             sharedIsMuted={sharedIsMuted}
             setSharedIsMuted={(val) => { sharedIsMuted = val; }}
          />
        ))
      )}




    </div>
  );
};

const ReelItem: React.FC<{ reel: Reel, currentUser: any, index: number, activeIndex: number, onVisible: () => void, sharedIsMuted: boolean, setSharedIsMuted: (val: boolean) => void }> = ({ reel, currentUser, index, activeIndex, onVisible, sharedIsMuted, setSharedIsMuted }) => {
  const [isMuted, setIsMuted] = useState(sharedIsMuted);

  // Sync local mute state when shared state changes
  useEffect(() => {
    setIsMuted(sharedIsMuted);
  }, [sharedIsMuted]);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isHiddenLocally, setIsHiddenLocally] = useState(false);

  const { deleteReel, isPending: isDeleting } = useDeleteReel();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteConfirm = async () => {
      if (!currentUser) return;
      try {
          await deleteReel({ id: reel.id, ownerId: currentUser.id, videoUrl: reel.video_url });
          setIsDeleteModalOpen(false);
          // QueryClient handles the cache removal, UI will update.
      } catch (err) {
          // Error handled by hook toast
      }
  };


  const handleReportSubmit = async (reason: string, customNote: string) => {
    if (!currentUser) return;
    try {
      await submitReport({
        target_id: reel.id,
        target_type: 'reel',
        reporter_id: currentUser.id,
        reason,
        custom_note: customNote,
        evidence_data: {
            video_url: reel.video_url,
            caption: reel.caption,
            author_id: reel.user_id,
            author_name: reel.profiles?.full_name
        }
      });
      setIsReportModalOpen(false);
      showToast({ title: 'Report Submitted', message: 'Reel reported and hidden.', variant: 'success' });
      setIsHiddenLocally(true);

      // Allow exit animation to complete before removing from cache
      setTimeout(() => {
          queryClient.setQueryData(['community-reels'], (old: any) => {
             if (!old) return old;
             return {
                ...old,
                data: old.data.filter((r: any) => r.id !== reel.id)
             };
          });
      }, 300);
    } catch (error) {
      console.error('Error submitting report:', error);
      showToast({ title: 'Error', message: 'Failed to submit report', variant: 'error' });
    }
  };
  const { showToast } = useNotificationStore();

  const likeReelMutation = useMutation({
    mutationFn: (currentlyLiked: boolean) => toggleLikeReel(reel.id, currentUser!.id, currentlyLiked),
    onMutate: async (currentlyLiked) => {
      await queryClient.cancelQueries({ queryKey: ['community-reels'] });
      const previousReels = queryClient.getQueryData(['community-reels']);

      queryClient.setQueryData(['community-reels'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((r: any) => r.id === reel.id ? {
            ...r,
            is_liked_by_me: !currentlyLiked,
            likes_count: r.likes_count ? r.likes_count + (currentlyLiked ? -1 : 1) : (currentlyLiked ? 0 : 1)
          } : r)
        };
      });
      return { previousReels };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousReels) {
        queryClient.setQueryData(['community-reels'], context.previousReels);
      }
      showToast({ title: 'Error', message: 'Failed to like reel', variant: 'error' });
    }
  });

  const handleLike = () => {
    if (!currentUser) return;
    likeReelMutation.mutate(!!reel.is_liked_by_me);
  };

  // DOM Memory Virtualization: Only render the video player if it's the active one, the previous one, or the next one.
  const isNearActive = Math.abs(index - activeIndex) <= 1;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
          if (entry.isIntersecting) {
            onVisible();
            if (isNearActive) {
                videoRef.current?.play().catch(e => console.log('Auto-play blocked:', e));
                setIsPlaying(true);
            }
          } else {
            if (isNearActive) {
                videoRef.current?.pause();
                setIsPlaying(false);
            }
          }
        });
      },
      { threshold: 0.6 } // trigger when 60% of the reel is visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isNearActive, onVisible]);

  // Handle explicit play state when isNearActive changes
  useEffect(() => {
    if (!isNearActive && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isNearActive]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <AnimatePresence>
      {!isHiddenLocally && (
        <motion.div
          initial={{ opacity: 1, height: "100%" }}
          animate={{ opacity: isDeleting ? 0.5 : 1 }}
          exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
          transition={{ duration: 0.3 }}
          ref={containerRef}
          className={cn("h-full w-full snap-start relative bg-black flex items-center justify-center cursor-pointer overflow-hidden", isDeleting && "pointer-events-none")}
          onClick={togglePlay}
        >
      {/* Background Media (Video) using Byte-Range Requests */}
            {/* Background Media (Video) using DOM Virtualization */}
      {reel.video_url && isNearActive ? (
        <video
          ref={videoRef}
          src={reel.video_url}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          playsInline
          preload={index === activeIndex + 1 ? "auto" : "none"}
          muted={isMuted}
        />
      ) : (
          /* Thumbnail placeholder for off-screen reels to save memory */
          <div className="absolute inset-0 w-full h-full bg-slate-900 flex items-center justify-center">
               <Film className="w-12 h-12 text-white/20" />
          </div>
      )}

      {/* Overlay Gradient for Text Readability */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />


      {/* Top Controls Overlay */}
      <div className="absolute top-4 right-4 z-50 mt-4 pt-[env(safe-area-inset-top,0px)] flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            const newMuted = !isMuted;
            setIsMuted(newMuted);
            setSharedIsMuted(newMuted);
          }}
          className="p-2 rounded-full bg-gray-900/40 backdrop-blur-md text-white border border-white/10 shadow-md"
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>

      {/* Side Action Bar */}
      <div className="absolute right-4 bottom-6 flex flex-col items-center gap-6 z-10" onClick={(e: any) => e.stopPropagation()}>
        <button onClick={handleLike}
          className="flex flex-col items-center gap-1 group"
          aria-label={reel.is_liked_by_me ? "Unlike reel" : "Like reel"}>
          <div className="p-3 bg-gray-900/40 backdrop-blur-md rounded-full text-white border border-white/10 active:scale-90 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="More reel options"
            >
            <Heart size={28} className={cn(reel.is_liked_by_me && "fill-red-500 text-red-500")} />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md">{reel.likes_count || 0}</span>
        </button>

        <button onClick={() => navigate(`/community/reels/${reel.id}/comments`)}
          className="flex flex-col items-center gap-1 group"
          aria-label="View comments">
          <div className="p-3 bg-gray-900/40 backdrop-blur-md rounded-full text-white border border-white/10 active:scale-90 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="More reel options"
            >
            <MessageCircle size={28} />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md">{reel.comments_count || 0}</span>
        </button>

        <button className="flex flex-col items-center gap-1 group" aria-label="Share reel">
          <div className="p-3 bg-gray-900/40 backdrop-blur-md rounded-full text-white border border-white/10 active:scale-90 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="More reel options"
            >
            <Share2 size={28} />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md">Share</span>
        </button>

        <div onClick={(e) => e.stopPropagation()} className="z-50">
          <Menu as="div" className="relative flex flex-col items-center group">
            <Menu.Button
              onClick={(e) => {
                  e.stopPropagation();
                  if(isPlaying && videoRef.current) {
                      videoRef.current.pause();
                      setIsPlaying(false);
                  }
              }}
              className="p-3 bg-gray-900/40 backdrop-blur-md rounded-full text-white border border-white/10 active:scale-90 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="More reel options"
            >
              <MoreVertical size={28} />
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
              <Menu.Items className="absolute right-0 bottom-14 mb-2 w-48 origin-bottom-right bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 focus:outline-none z-[60]">
                <div className="py-1">
                  {currentUser && currentUser.id === reel.user_id && (
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
                          {isDeleting ? 'Deleting...' : 'Delete Reel'}
                        </button>
                      )}
                    </Menu.Item>
                  )}
                  {currentUser && currentUser.id !== reel.user_id && (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsReportModalOpen(true);
                        }}
                        className={cn(
                          active ? 'bg-gray-50 dark:bg-slate-700/50' : '',
                          'flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 font-medium'
                        )}
                      >
                        <ShieldAlert size={16} />
                        Report Reel
                      </button>
                    )}
                  </Menu.Item>
                  )}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>

      <div onClick={(e) => e.stopPropagation()} className="z-[70] relative">
        <ReportModal
            isOpen={isReportModalOpen}
            onClose={() => {
               setIsReportModalOpen(false);
               if(videoRef.current) { videoRef.current.play(); setIsPlaying(true); }
            }}
            targetName={reel.profiles?.full_name || 'Reel'}
            targetType="reel"
            onSubmit={handleReportSubmit}
        />
        <ConfirmDeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteConfirm}
            isDeleting={isDeleting}
        />
      </div>

      {/* Bottom Content Area */}
      <div className="absolute bottom-0 left-0 right-16 p-4 z-10 pb-6" onClick={(e: any) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => navigate(`/u/${reel.profiles?.username || reel.user_id}`)}>
          <div className="w-10 h-10 rounded-full bg-gray-200 border border-white/20 overflow-hidden">
<PresenceAvatar userId={reel.user_id} avatarUrl={getCanonicalAvatarUrl(reel.profiles, null)} altText="Avatar" className="w-full h-full" />
          </div>
          <span className="text-white font-semibold drop-shadow-md">{reel.profiles?.full_name || reel.profiles?.username || 'MindFlow User'}</span>
          <button className="px-3 py-1 rounded-full border border-white/50 text-white text-xs font-semibold backdrop-blur-sm bg-white/10">
            Follow
          </button>
        </div>

        {reel.caption && (
          <p className="text-white text-sm line-clamp-2 drop-shadow-md mb-2">
            {reel.caption}
          </p>
        )}
      </div>

      {/* Playing indicator / Pause icon overlay */}
      <AnimatePresence>
        {!isPlaying && isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none"
          >
             <div className="w-20 h-20 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white ml-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
