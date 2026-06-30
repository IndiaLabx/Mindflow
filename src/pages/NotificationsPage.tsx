import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, ExternalLink, Inbox } from 'lucide-react';
import { useNotifications } from '@/features/notifications';
import { useNotification } from '@/stores/useNotificationStore';
import { formatDistanceToNow } from 'date-fns';
import { isAfter } from 'date-fns';
import { subDays } from 'date-fns';
import { cn } from '@/utils/cn';
import { AppNotification } from '@/features/notifications';
import { useNavigate } from 'react-router-dom';

const NotificationSkeleton = () => (
  <div className="p-4 sm:p-5 flex items-start gap-4 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 animate-pulse mb-3">
    <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 mt-2 flex-shrink-0" />
    <div className="flex-1 space-y-3">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-20 mt-2" />
    </div>
  </div>
);

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    await markAllAsRead();
    showToast({
      title: 'Success',
      message: 'All notifications marked as read',
      variant: 'success'
    });
  };

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    if (notification.link) {
      if (notification.link.startsWith('http')) {
        window.open(notification.link, '_blank', 'noopener,noreferrer');
      } else {
        navigate(notification.link);
      }
    }
  };

  const groupedNotifications = useMemo(() => {
    const unread: AppNotification[] = [];
    const recent: AppNotification[] = [];
    const earlier: AppNotification[] = [];

    const sevenDaysAgo = subDays(new Date(), 7);

    notifications.forEach(notif => {
      if (!notif.is_read) {
        unread.push(notif);
      } else if (isAfter(new Date(notif.created_at), sevenDaysAgo)) {
        recent.push(notif);
      } else {
        earlier.push(notif);
      }
    });

    return { unread, recent, earlier };
  }, [notifications]);

  const NotificationItem = ({ notification }: { notification: AppNotification }) => (
    <motion.button
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => handleNotificationClick(notification)}
      className={cn(
        "w-full text-left p-4 sm:p-5 flex items-start gap-4 transition-all duration-300",
        "bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl",
        "border border-white/40 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]",
        !notification.is_read ? "shadow-[0_8px_32px_0_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/20" : "hover:bg-white/80 dark:hover:bg-slate-800/80"
      )}
    >
      <div className={cn(
        "w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 transition-colors duration-300",
        !notification.is_read ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" : "bg-transparent"
      )} />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className={cn(
            "text-base font-semibold truncate leading-tight",
            !notification.is_read ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
          )}>
            {notification.title}
          </h3>
          {notification.link && (
            <div className="flex-shrink-0 text-slate-400">
              {notification.link.startsWith('http') ? <ExternalLink className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </div>
          )}
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">
          {notification.message}
        </p>

        <div className="flex items-center gap-3 mt-1">
            <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wide uppercase",
                "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            )}>
                {notification.type.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>
        </div>
      </div>
    </motion.button>
  );

  const Section = ({ title, items }: { title: string, items: AppNotification[] }) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-8 relative z-10">
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 px-2">
          {title} <span className="ml-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-0.5 px-2 rounded-full text-xs">{items.length}</span>
        </h2>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {items.map(notif => (
              <NotificationItem key={notif.id} notification={notif} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-[#0B0F19]">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-500/20 dark:bg-indigo-600/20 blur-[120px] animate-blob z-0 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-purple-500/20 dark:bg-purple-600/20 blur-[120px] animate-blob animation-delay-2000 z-0 pointer-events-none" />

      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tracking-tight">
              Notifications
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Stay updated with your latest alerts</p>
          </div>

          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl font-semibold text-sm transition-colors shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Mark all read</span>
                <span className="sm:hidden">Read all</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3 relative z-10">
            {[1, 2, 3, 4].map(i => <NotificationSkeleton key={i} />)}
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 px-4 text-center relative z-10"
          >
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/50 dark:border-white/5">
              <Inbox className="w-10 h-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">You're all caught up!</h2>
            <p className="text-slate-500 dark:text-slate-400">New notifications will appear here</p>
          </motion.div>
        ) : (
          <div className="relative z-10 space-y-6">
            <Section title="Unread" items={groupedNotifications.unread} />
            <Section title="Recent" items={groupedNotifications.recent} />
            <Section title="Earlier" items={groupedNotifications.earlier} />
          </div>
        )}
      </div>
    </div>
  );
};
