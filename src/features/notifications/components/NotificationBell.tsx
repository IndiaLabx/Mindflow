import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../auth/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { unreadCount, refresh } = useNotifications();

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => {
            refresh();
            navigate('/notification');
        }}
        className={cn(
          "relative p-2 rounded-full transition-colors",
          "hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        )}
      </button>
    </div>
  );
};
