import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../auth/context/AuthContext';
import { AppNotification } from '../types';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Get user target audience from settings store or default to all
      const targetAudienceRaw = localStorage.getItem('mindflow-settings');
      let audience = 'competitive'; // default
      if (targetAudienceRaw) {
          try {
             const parsed = JSON.parse(targetAudienceRaw);
             if (parsed.state && parsed.state.targetAudience) {
                 audience = parsed.state.targetAudience;
             }
          } catch(e) {}
      }

      // Fetch all notifications matching audience or 'all'
      const { data: allNotifs, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .in('target_audience', ['all', audience])
        .order('created_at', { ascending: false })
        .limit(50);

      if (notifError) throw notifError;

      // Fetch read receipts
      const { data: readReceipts, error: readError } = await supabase
        .from('user_notifications')
        .select('notification_id')
        .eq('user_id', user.id);

      if (readError) throw readError;

      const readIds = new Set(readReceipts?.map(r => r.notification_id) || []);

      // Merge data
      const merged: AppNotification[] = (allNotifs || []).map(n => ({
        ...n,
        is_read: readIds.has(n.id)
      }));

      setNotifications(merged);
      setUnreadCount(merged.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    if (!user) return;

    // Listen for new notifications
    const subscription = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
           fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    // Optimistic update
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, is_read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await supabase
        .from('user_notifications')
        .insert([{ user_id: user.id, notification_id: notificationId }])
        .select();
    } catch (error) {
      console.error('Error marking as read:', error);
      // Revert if failed
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unread = notifications.filter(n => !n.is_read);
    if (unread.length === 0) return;

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      const inserts = unread.map(n => ({
        user_id: user.id,
        notification_id: n.id
      }));

      await supabase
        .from('user_notifications')
        .insert(inserts);
    } catch (error) {
      console.error('Error marking all as read:', error);
      fetchNotifications();
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
}
