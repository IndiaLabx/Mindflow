import React, { useEffect } from 'react';
import { useDebugStore } from '../../../stores/useDebugStore';
import { getCanonicalAvatarUrl } from '../../../utils/avatar';
import { PresenceAvatar } from '../../../components/ui/PresenceAvatar';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { Plus } from 'lucide-react';
import { cn } from '../../../utils/cn';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

// Mock data for future "24-hour Status Updates"
const mockStories = [
  { id: '1', name: 'Alice', avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=Alice', isViewed: false },
  { id: '2', name: 'Bob', avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=Bob', isViewed: true },
  { id: '3', name: 'Charlie', avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=Charlie', isViewed: false },
  { id: '4', name: 'Diana', avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=Diana', isViewed: false },
  { id: '5', name: 'Ethan', avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=Ethan', isViewed: true },
  { id: '6', name: 'Fiona', avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=Fiona', isViewed: false },
];

export const SocialHeader: React.FC = () => {
  const { user, profile } = useAuth();
  useEffect(() => {
    useDebugStore.getState().logEvent('SocialHeader rendered', { profileExists: !!profile });
  }, [user, profile]);
  const navigate = useNavigate();

  const { data: profileUsername } = useQuery({
    queryKey: ['my-username', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle();
      return data?.username || null;
    },
    enabled: !!user,
  });

  const handleProfileClick = () => {
    if (user) {
      navigate(`/u/${profileUsername || user.id}`);
    }
  };

  const userAvatar = getCanonicalAvatarUrl(profile, user);

  return (
    <div className="w-full bg-white/5 dark:bg-slate-900/5 backdrop-blur-md border-b border-indigo-100/20 dark:border-indigo-900/20 py-3 mb-4">
      <div className="flex overflow-x-auto no-scrollbar px-4 gap-4 items-center">
        {/* User's Profile Entry Point */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleProfileClick}
          className="flex flex-col items-center gap-1 cursor-pointer min-w-[72px]"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600">
              <PresenceAvatar
                userId={user?.id || ''}
                avatarUrl={userAvatar}
                altText="Your Story"
                className="w-full h-full rounded-full border-2 border-white dark:border-slate-900"
              />
            </div>
            {/* Plus Badge */}
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm">
              <Plus className="w-3 h-3 text-white" />
            </div>
          </div>
          <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 truncate w-full text-center">
            Your Story
          </span>
        </motion.div>

        {/* Mock Stories for Future Updates */}
        {mockStories.map((story) => (
          <motion.div
            key={story.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-1 cursor-pointer min-w-[72px]"
          >
            <div className={cn(
              "w-16 h-16 rounded-full p-[2px]",
              story.isViewed
                ? "bg-gray-200 dark:bg-slate-700"
                : "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500"
            )}>
              <img
                src={story.avatarUrl}
                alt={`${story.name}'s story`}
                className="w-full h-full rounded-full border-2 border-white dark:border-slate-900 object-cover"
              />
            </div>
            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 truncate w-full text-center">
              {story.name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
