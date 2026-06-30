import React, { useState, useEffect, useRef } from 'react';
import { getCanonicalAvatarUrl } from '../../../utils/avatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserRooms, fetchMessages, sendMessage, uploadChatMedia, ChatRoom, ChatMessage } from '../api/chatApi';
import { useAuth } from '../../auth/context/AuthContext';
import { useSocialRealtime } from '../hooks/useSocialRealtime';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { usePresenceStore } from '../../../stores/usePresenceStore';

import { supabase } from '../../../lib/supabase';
import { PresenceAvatar } from '../../../components/ui/PresenceAvatar';
import { PresenceDot } from '../../../components/ui/PresenceDot';
import { motion } from 'framer-motion';
import { Send, Image as ImageIcon, File, ArrowLeft } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChatListSkeleton } from '../components/ChatListSkeleton';
import { ChatIntro } from './ChatIntro';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatInputBar } from './ChatInputBar';
import { Info, MoreVertical } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { submitReport } from '../api/reportsApi';
import { ReportModal } from '../components/reports/ReportModal';
import { BlockUserPromptModal } from '../components/reports/BlockUserPromptModal';
import { ShieldAlert } from 'lucide-react';
import { checkBlockStatus, blockUser, unblockUser } from '../api/communityApi';
import { useNotification } from '../../../hooks/useNotification';

export const ChatRooms: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(location.state?.roomId || null);

  // Clear location state after capturing so refresh doesn't auto-open it
  useEffect(() => {

    return () => {

    };
  }, []);
  useEffect(() => {
      if (location.state?.roomId) {
          navigate(location.pathname, { replace: true, state: {} });
      }
  }, [location, navigate]);

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['chat-rooms', user?.id],
    queryFn: () => fetchUserRooms(user!.id),
    enabled: !!user,
  });

  if (isLoading) return <ChatListSkeleton />;

  if (activeRoomId) {
    let room = rooms?.find(r => r.id === activeRoomId);
    // Fallback if room isn't in cache yet
    if (!room) {
        room = { id: activeRoomId, type: 'direct', created_at: '', updated_at: '' };
    }
    return <ActiveChatRoom room={room!} onBack={() => setActiveRoomId(null)} />;
  }

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto pb-[env(safe-area-inset-bottom)] px-4">
      <div className="flex items-center gap-3 mb-6 mt-4"><button onClick={() => navigate('/community')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-800"><ArrowLeft size={24} /></button><h2 className="text-2xl font-bold text-gray-900">Messages</h2></div>
      <div className="space-y-2">
        {rooms?.map(room => {
          // For direct chats, find the other person
          const otherParticipant = room.participants?.find(p => p.user_id !== user?.id);
          const title = room.type === 'direct' ? otherParticipant?.full_name || 'Unknown User' : 'Group Chat';
          const avatar = room.type === 'direct' ? getCanonicalAvatarUrl(otherParticipant, null) : null;

          return (
            <motion.button
              key={room.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveRoomId(room.id)}
              className="w-full bg-white backdrop-blur-md border border-gray-200 rounded-2xl p-4 flex items-center gap-4 text-left"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 shadow-sm">
                <PresenceAvatar
                  userId={otherParticipant?.user_id || ''}
                  avatarUrl={getCanonicalAvatarUrl(otherParticipant, null)}
                  altText={otherParticipant?.full_name || 'User'}
                  className="w-full h-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate flex items-center gap-2">
                  {title}
                  {room.type === 'direct' && otherParticipant?.user_id && (
                    <PresenceDot userId={otherParticipant.user_id} />
                  )}
                </div>
                <div className="text-sm text-gray-500 truncate">Tap to open chat</div>
              </div>
            </motion.button>
          );
        })}
        {rooms?.length === 0 && (
          <div className="text-gray-500 text-center mt-10">No messages yet.</div>
        )}
      </div>
    </div>
  );
};

const ActiveChatRoom: React.FC<{ room: ChatRoom; onBack: () => void }> = ({ room, onBack }) => {
  const { user } = useAuth();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBlockPromptOpen, setIsBlockPromptOpen] = useState(false);

  const queryClient = useQueryClient();
  const { sendTypingStatus } = useSocialRealtime();
  

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  
  
  const [isUploading, setIsUploading] = useState(false);



  const { data: messages, isLoading } = useQuery({
    queryKey: ['chat-messages', room.id],
    queryFn: () => fetchMessages(room.id),
  });

  // Realtime subscription for incoming messages
  useEffect(() => {
    const channel = supabase.channel(`room:${room.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_room_messages', filter: `room_id=eq.${room.id}` }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        
        // If we sent it, we already optimistic updated. We might need to reconcile id, but standard cache invalidation works.
        if (newMsg.sender_id !== user?.id) {
            queryClient.setQueryData<ChatMessage[]>(['chat-messages', room.id], (old) => {
                if (!old) return [newMsg];
                // avoid dupes
                if (old.find(m => m.id === newMsg.id)) return old;
                return [...old, { ...newMsg, status: 'sent' }];
            });
            // Smart auto-scroll for incoming: we could check if user is at bottom before scrolling
            // but for simplicity here we just scroll to bottom when new msg arrives
            setTimeout(() => {
               virtuosoRef.current?.scrollToIndex({ index: 'LAST', align: 'end', behavior: 'smooth' });
            }, 100);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id, queryClient, user]);

  const sendMutation = useMutation({
    mutationFn: (msg: Partial<ChatMessage>) => sendMessage(msg),
    onMutate: async (newMsg) => {
      await queryClient.cancelQueries({ queryKey: ['chat-messages', room.id] });
      const previousMessages = queryClient.getQueryData<ChatMessage[]>(['chat-messages', room.id]);
      
      const optimisticMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        room_id: room.id,
        sender_id: user!.id,
        text_content: newMsg.text_content || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'sending'
      };

      queryClient.setQueryData<ChatMessage[]>(['chat-messages', room.id], (old) => {
        return old ? [...old, optimisticMsg] : [optimisticMsg];
      });

      // Instantly scroll to bottom for our own optimistic message
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({ index: 'LAST', align: 'end', behavior: 'smooth' });
      }, 50);

      return { previousMessages, tempId: optimisticMsg.id };
    },
    onSuccess: (realMsg, variables, context) => {
       queryClient.setQueryData<ChatMessage[]>(['chat-messages', room.id], (old) => {
         if (!old) return [realMsg];
         return old.map(m => m.id === context?.tempId ? { ...realMsg, status: 'sent' } : m);
       });
    },
    onError: (err, newMsg, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['chat-messages', room.id], context.previousMessages);
      }
    }
  });

  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      
      // Step A: Upload raw file to bucket
      const publicUrl = await uploadChatMedia(file, user.id);
      
      // Step B & C: Optimistic UI & Postgres Insert handled by sendMutation
      sendMutation.mutate({
        room_id: room.id,
        sender_id: user.id,
        text_content: type === 'image' ? 'Sent an image' : 'Sent a file',
        media_url: publicUrl,
        media_type: type
      });
      
    } catch (error) {
      console.error("Failed to upload media:", error);
      // Fallback: Notify user of failure (could use toast here)
      alert("Failed to upload media. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };






  const { showToast } = useNotification();
  const otherParticipant = room.participants?.find(p => p.user_id !== user?.id);

  const { data: blockStatus, refetch: refetchBlockStatus } = useQuery({
    queryKey: ['blockStatus', user?.id, otherParticipant?.user_id],
    queryFn: () => checkBlockStatus(user!.id, otherParticipant!.user_id),
    enabled: !!user?.id && !!otherParticipant?.user_id,
  });

  const blockMutation = useMutation({
    mutationFn: () => blockUser(user!.id, otherParticipant!.user_id),
    onSuccess: () => {
      showToast({ title: 'User Blocked', message: 'You have blocked this user.', variant: 'success' });
      refetchBlockStatus();
    },
    onError: () => {
      showToast({ title: 'Error', message: 'Failed to block user. Please try again.', variant: 'error' });
    }
  });

  const unblockMutation = useMutation({
    mutationFn: () => unblockUser(user!.id, otherParticipant!.user_id),
    onSuccess: () => {
      showToast({ title: 'User Unblocked', message: 'You have unblocked this user.', variant: 'success' });
      refetchBlockStatus();
    },
    onError: () => {
      showToast({ title: 'Error', message: 'Failed to unblock user. Please try again.', variant: 'error' });
    }
  });


  const reportMutation = useMutation({
    mutationFn: (data: { reason: string, customNote: string }) => {
        return submitReport({
            target_id: otherParticipant!.user_id,
            reporter_id: user!.id,
            reason: data.reason,
            custom_note: data.customNote,
            evidence_data: {
                id: otherParticipant!.user_id,
                username: otherParticipant!.full_name || 'Unknown',
                full_name: otherParticipant!.full_name || 'Unknown',
                avatar_url: otherParticipant!.avatar_url,
                bio: null // Not available in ChatRoom participants by default
            }
        });
    },
    onSuccess: () => {
        setIsReportModalOpen(false);
        showToast({ title: 'Report Submitted', message: 'Thank you for keeping MindFlow safe. We are reviewing this.', variant: 'success' });
        setIsBlockPromptOpen(true);
    },
    onError: () => {
        showToast({ title: 'Error', message: 'Failed to submit report. Please try again.', variant: 'error' });
    }
  });

  const title = room.type === 'direct' ? otherParticipant?.full_name || 'Unknown User' : 'Group Chat';

  const isOnline = usePresenceStore(state => otherParticipant ? state.isUserOnline(otherParticipant.user_id) : false);

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Offline';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Active just now';
    if (diffInSeconds < 3600) return `Active ${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `Active ${Math.floor(diffInSeconds / 3600)}h ago`;

    const diffInDays = Math.floor(diffInSeconds / 86400);
    if (diffInDays === 1) return 'Active yesterday';
    return `Active ${diffInDays}d ago`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col w-full md:relative md:h-[100dvh] md:max-w-2xl md:mx-auto md:border-x md:border-gray-100 md:shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-800" aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm">
             <PresenceAvatar
                userId={otherParticipant?.user_id || ''}
                avatarUrl={getCanonicalAvatarUrl(otherParticipant, null)}
                altText={otherParticipant?.full_name || 'User'}
                className="w-full h-full"
             />
        </div>
        <div className="flex-1 overflow-hidden">
            <div className="font-semibold text-gray-900 truncate flex items-center gap-2">
              {title}
              {room.type === 'direct' && otherParticipant?.user_id && (
                <PresenceDot userId={otherParticipant.user_id} />
              )}
            </div>
            {room.type === 'direct' && (
              <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                {isOnline ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-green-600 font-medium">Active now</span>
                  </>
                ) : (
                  <span>{formatTimeAgo(otherParticipant?.last_seen ?? undefined)}</span>
                )}
              </div>
            )}
        </div>

        <Menu as="div" className="relative">
            <Menu.Button className="p-2 -mr-2 rounded-full hover:bg-gray-100 text-gray-800 focus:outline-none">
                <Info size={24} strokeWidth={1.5} />
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
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none overflow-hidden z-50">
                    <div className="py-1">
                        {blockStatus?.hasBlocked ? (
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={() => unblockMutation.mutate()}
                                        className={cn(
                                            active ? 'bg-gray-50 text-gray-900' : 'text-gray-700',
                                            'block w-full text-left px-4 py-2.5 text-sm font-medium'
                                        )}
                                    >
                                        Unblock User
                                    </button>
                                )}
                            </Menu.Item>
                        ) : (
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={() => blockMutation.mutate()}
                                        className={cn(
                                            active ? 'bg-red-50 text-red-600' : 'text-red-600',
                                            'block w-full text-left px-4 py-2.5 text-sm font-medium'
                                        )}
                                    >
                                        Block User
                                    </button>
                                )}
                            </Menu.Item>
                        )}
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={() => setIsReportModalOpen(true)}
                                    className={cn(
                                        active ? 'bg-red-50 text-red-600' : 'text-red-600',
                                        'group flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors'
                                    )}
                                >
                                    <ShieldAlert className="w-4 h-4" /> Report User
                                </button>
                            )}
                        </Menu.Item>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>

      </div>

      {/* Messages Area (Virtualized) */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-10 text-gray-600">Loading messages...</div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            components={{
              Header: () => (
                room.type === 'direct' && otherParticipant ? <ChatIntro user={otherParticipant} /> : <div className="h-4" />
              )
            }}
            data={messages || []}
            initialTopMostItemIndex={(messages?.length || 0) - 1}
            itemContent={(index, msg) => {
              const prevMsg = index > 0 ? messages?.[index - 1] : null;
              let showTimeSeparator = false;
              let timeSeparatorText = '';

              if (msg && msg.created_at) {
                  const currentMsgDate = new Date(msg.created_at);
                  if (!prevMsg) {
                      showTimeSeparator = true;
                  } else {
                      const prevMsgDate = new Date(prevMsg.created_at);
                      const diffInHours = (currentMsgDate.getTime() - prevMsgDate.getTime()) / (1000 * 60 * 60);

                      const isDifferentDay = currentMsgDate.toDateString() !== prevMsgDate.toDateString();

                      if (diffInHours > 1 || isDifferentDay) {
                          showTimeSeparator = true;
                      }
                  }

                  if (showTimeSeparator) {
                      const today = new Date();
                      const isToday = currentMsgDate.toDateString() === today.toDateString();

                      const timeStr = currentMsgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      if (isToday) {
                          timeSeparatorText = `Today ${timeStr}`;
                      } else {
                          const dateStr = currentMsgDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                          timeSeparatorText = `${dateStr} ${timeStr}`;
                      }
                  }
              }

              const handleLikeToggle = (messageId: string, isLiked: boolean) => {
                  queryClient.setQueryData<ChatMessage[]>(['chat-messages', room.id], (old) => {
                      if (!old) return old;
                      return old.map(m => {
                          if (m.id === messageId) {
                              const likes = m.likes || [];
                              if (isLiked) {
                                  return { ...m, likes: likes.filter(l => l.user_id !== user?.id) };
                              } else {
                                  return { ...m, likes: [...likes, { user_id: user!.id }] };
                              }
                          }
                          return m;
                      });
                  });
              };
              const isMine = msg.sender_id === user?.id;
              return (
                <ChatMessageItem
                  msg={msg}
                  isMine={isMine}
                  showTimeSeparator={showTimeSeparator}
                  timeSeparatorText={timeSeparatorText}
                  otherParticipantAvatar={getCanonicalAvatarUrl(otherParticipant, null)}
                  onLikeToggle={handleLikeToggle}
                />
              );
            }}
          />
        )}
      </div>

      {/* Input Area */}
      <ChatInputBar
        isBlocker={blockStatus?.hasBlocked}
        isBlocked={blockStatus?.isBlockedBy}
        onUnblock={() => unblockMutation.mutate()}
        onSend={(text) => {
          sendMutation.mutate({
            room_id: room.id,
            sender_id: user!.id,
            text_content: text
          });
        }}
        onUpload={handleFileUpload}
        isUploading={isUploading}
        onTyping={(isTyping) => sendTypingStatus(room.id, isTyping)}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={(reason, customNote) => reportMutation.mutate({ reason, customNote })}
        targetName={otherParticipant?.full_name || 'User'}
        targetType="user"
      />

      <BlockUserPromptModal
        isOpen={isBlockPromptOpen}
        onClose={() => setIsBlockPromptOpen(false)}
        onBlock={() => blockMutation.mutate()}
        targetName={otherParticipant?.full_name || 'User'}
      />
    </div>
  );
};
