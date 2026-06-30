import React from 'react';
import { getCanonicalAvatarUrl } from '../../../utils/avatar';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PresenceAvatar } from '../../../components/ui/PresenceAvatar';
import { PresenceDot } from '../../../components/ui/PresenceDot';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus, UserCheck, MessageSquare, Image as ImageIcon, Video, FileText, MoreVertical } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { submitReport } from '../api/reportsApi';
import { ReportModal } from '../components/reports/ReportModal';
import { BlockUserPromptModal } from '../components/reports/BlockUserPromptModal';
import { ShieldAlert } from 'lucide-react';
import { checkBlockStatus, blockUser, unblockUser } from '../api/communityApi';
import { useNotification } from '../../../hooks/useNotification';
import { fetchUserProfile, fetchUserPosts, toggleFollow, getOrCreateChatRoom } from '../api/communityApi';
import { useAuth } from '../../auth/context/AuthContext';
import { cn } from '../../../utils/cn';
import { ErrorState } from '../../../components/ui/ErrorState';

export const UserProfile: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useNotification();
    const queryClient = useQueryClient();

    const [isReportModalOpen, setIsReportModalOpen] = React.useState(false);
    const [isBlockPromptOpen, setIsBlockPromptOpen] = React.useState(false);

    const { data: profile, isLoading: isProfileLoading } = useQuery({
        queryKey: ['user-profile', username, currentUser?.id],
        queryFn: () => fetchUserProfile(username!, currentUser?.id),
        enabled: !!username,
    });

    const { data: posts, isLoading: isPostsLoading } = useQuery({
        queryKey: ['user-posts', profile?.id],
        queryFn: () => fetchUserPosts(profile!.id),
        enabled: !!profile?.id,
    });

    const toggleFollowMutation = useMutation({
        mutationFn: () => toggleFollow(currentUser!.id, profile!.id, !!profile?.is_following),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile', username, currentUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
            queryClient.invalidateQueries({ queryKey: ['community-search'] });
        }
    });

    const messageMutation = useMutation({
        mutationFn: () => getOrCreateChatRoom(currentUser!.id, profile!.id),
        onSuccess: (roomId) => {
            if (roomId) {
                // Navigate to messages, perhaps passing room ID or assuming chat screen loads recent
                // The current ChatRooms component uses activeRoomId local state.
                // We'll navigate to /messages and in a real app would pass the ID via state.
                navigate('/messages', { state: { roomId } });
            }
        }
    });

    const isOwnProfile = currentUser?.id === profile?.id;

    const { data: blockStatus, refetch: refetchBlockStatus } = useQuery({
        queryKey: ['blockStatus', currentUser?.id, profile?.id],
        queryFn: () => checkBlockStatus(currentUser!.id, profile!.id),
        enabled: !!currentUser?.id && !!profile?.id && !isOwnProfile,
    });

    const blockMutation = useMutation({
        mutationFn: () => blockUser(currentUser!.id, profile!.id),
        onSuccess: () => {
            showToast({ title: 'User Blocked', message: 'You have blocked this user.', variant: 'success' });
            refetchBlockStatus();
            // Invalidate queries so that posts/comments from this user disappear
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
            queryClient.invalidateQueries({ queryKey: ['reels'] });
        },
        onError: () => {
            showToast({ title: 'Error', message: 'Failed to block user. Please try again.', variant: 'error' });
        }
    });

    const unblockMutation = useMutation({
        mutationFn: () => unblockUser(currentUser!.id, profile!.id),
        onSuccess: () => {
            showToast({ title: 'User Unblocked', message: 'You have unblocked this user.', variant: 'success' });
            refetchBlockStatus();
            // Invalidate queries to restore their content
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
            queryClient.invalidateQueries({ queryKey: ['reels'] });
        },
        onError: () => {
            showToast({ title: 'Error', message: 'Failed to unblock user. Please try again.', variant: 'error' });
        }
    });

    const reportMutation = useMutation({
        mutationFn: (data: { reason: string, customNote: string }) => submitReport({
            target_id: profile!.id,
            reporter_id: currentUser!.id,
            reason: data.reason,
            custom_note: data.customNote,
            evidence_data: {
                id: profile!.id,
                username: profile!.username,
                full_name: profile!.full_name,
                avatar_url: getCanonicalAvatarUrl(profile, null),
                bio: null // bio not directly typed here
            }
        }),
        onSuccess: () => {
            setIsReportModalOpen(false);
            showToast({ title: 'Report Submitted', message: 'Thank you for keeping MindFlow safe. We are reviewing this.', variant: 'success' });
            setIsBlockPromptOpen(true);
        },
        onError: () => {
            showToast({ title: 'Error', message: 'Failed to submit report. Please try again.', variant: 'error' });
        }
    });

    if (isProfileLoading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">Loading Profile...</div>;
    }

    if (!profile) {
        return <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-600">
            <h2 className="text-xl font-bold mb-2">User not found</h2>
            <button onClick={() => navigate(-1)} className="text-blue-500 hover:underline">Go back</button>
        </div>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 pb-20">
            {/* Header */}
            <div className="sticky top-0 z-50 p-4 bg-white/80 backdrop-blur-xl border-b border-gray-200 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="font-semibold text-lg flex items-center gap-2">
                    {profile.username || profile.full_name || 'User'}
                    <PresenceDot userId={profile.id} />
                </div>
                {!isOwnProfile && (
                    <Menu as="div" className="relative ml-auto">
                        <Menu.Button className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors">
                            <MoreVertical size={24} className="text-gray-600" />
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
                                </div>

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
                                </Menu.Items>
                        </Transition>
                    </Menu>
                )}
            </div>

            {/* Profile Info */}
            <div className="p-6 flex flex-col items-center border-b border-gray-200 bg-gradient-to-b from-blue-900/10 to-transparent">
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-lg shadow-blue-500/20 overflow-hidden">
                    <PresenceAvatar
                        userId={profile.id}
                        avatarUrl={getCanonicalAvatarUrl(profile, null)}
                        altText={profile.full_name || 'User'}
                        className="w-full h-full"
                    />
                </div>

                <h1 className="text-2xl font-bold mb-1 flex items-center justify-center gap-2">
                    {profile.full_name}
                    <PresenceDot userId={profile.id} />
                </h1>
                <p className="text-gray-600 text-sm mb-6">Joined {new Date(profile.created_at).toLocaleDateString()}</p>

                <div className="flex gap-8 mb-6 text-center">
                    <div>
                        <div className="font-bold text-xl">{posts?.length || 0}</div>
                        <div className="text-gray-600 text-sm">Posts</div>
                    </div>
                    <div>
                        <div className="font-bold text-xl">{profile.followers_count}</div>
                        <div className="text-gray-600 text-sm">Followers</div>
                    </div>
                    <div>
                        <div className="font-bold text-xl">{profile.following_count}</div>
                        <div className="text-gray-600 text-sm">Following</div>
                    </div>
                </div>

                {isOwnProfile ? (
                    <div className="flex gap-3 w-full max-w-xs">
                        <button
                            onClick={() => navigate('/profile')}
                            className="flex-1 py-2.5 bg-white/10 text-gray-900 hover:bg-white/20 border border-gray-200 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                        >
                            Edit Profile
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-3 w-full max-w-xs">
                        <button
                            onClick={() => toggleFollowMutation.mutate()}
                            disabled={toggleFollowMutation.isPending}
                            className={cn(
                                "flex-1 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                                profile.is_following
                                    ? "bg-white/10 text-gray-900 hover:bg-white/20 border border-gray-200"
                                    : "bg-blue-600 text-gray-900 shadow-lg shadow-blue-600/30 hover:bg-blue-500"
                            )}
                        >
                            {profile.is_following ? <><UserCheck size={18} /> Following</> : <><UserPlus size={18} /> Follow</>}
                        </button>
                        <button
                            onClick={() => messageMutation.mutate()}
                            disabled={messageMutation.isPending}
                            className="flex-1 py-2.5 bg-white/10 text-gray-900 hover:bg-white/20 border border-gray-200 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                        >
                            <MessageSquare size={18} /> Message
                        </button>
                    </div>
                )}
            </div>

            {/* Posts Grid/List */}
            <div className="flex-1 p-4">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Posts</h2>
                {isPostsLoading ? (
                    <div className="flex justify-center mt-10">
                        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                ) : posts && posts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {posts.map((post, i) => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                key={post.id}
                                className="aspect-square bg-gray-100 border border-gray-200 rounded-xl overflow-hidden relative group cursor-pointer hover:border-blue-500/50 transition-colors"
                            >
                                {post.media_url ? (
                                    <img src={post.media_url} alt="Post media" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full p-3 flex items-center justify-center text-center bg-gradient-to-br from-slate-800 to-slate-900">
                                        <p className="text-xs sm:text-sm line-clamp-4 text-gray-800 font-medium">{post.content}</p>
                                    </div>
                                )}

                                <div className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-md rounded-full text-gray-900">
                                    {post.type === 'reel' ? <Video size={14} /> :
                                     post.type === 'image' ? <ImageIcon size={14} /> :
                                     <FileText size={14} />}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 mt-10">
                        No posts yet.
                    </div>
                )}
            </div>

            {profile && (
                <>
                    <ReportModal
                        isOpen={isReportModalOpen}
                        onClose={() => setIsReportModalOpen(false)}
                        onSubmit={(reason: string, customNote: string) => reportMutation.mutate({ reason, customNote })}
                        targetName={profile.full_name || profile.username}
                    />
                    <BlockUserPromptModal
                        isOpen={isBlockPromptOpen}
                        onClose={() => setIsBlockPromptOpen(false)}
                        onBlock={() => blockMutation.mutate()}
                        targetName={profile.full_name || profile.username}
                    />
                </>
            )}
        </div>
    );
};
