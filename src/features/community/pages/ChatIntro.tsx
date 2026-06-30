import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../utils/cn';

interface ChatIntroProps {
  user: {
    user_id: string;
    full_name?: string | null;
    avatar_url?: string | null;
    username?: string | null;
  };
}

export const ChatIntro: React.FC<ChatIntroProps> = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center p-8 mt-10 mb-6 text-center">
      <div className="w-24 h-24 mb-4 rounded-full overflow-hidden shadow-lg border-2 border-white bg-indigo-500">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.full_name || 'User'} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold uppercase">
            {(user.full_name || 'U').charAt(0)}
          </div>
        )}
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.full_name || 'Unknown User'}</h2>
      {user.username ? (
        <p className="text-gray-500 font-medium mb-4">/u/{user.username}</p>
      ) : (
        <p className="text-gray-500 font-medium mb-4">/u/user_{user.user_id.substring(0, 5)}</p>
      )}

      <button
        onClick={() => navigate(`/u/${user.username || user.user_id}`)}
        className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-full transition-colors text-sm"
      >
        View profile
      </button>
    </div>
  );
};
