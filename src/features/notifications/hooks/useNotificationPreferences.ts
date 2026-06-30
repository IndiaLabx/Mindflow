import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../auth/context/AuthContext';
import { NotificationPreferences } from '../types';

const defaultCategories = {
  announcements: true,
  tests_quizzes: true,
  study_materials: true,
  daily_reminders: true,
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPreferences(null);
      setIsLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          if (error.code === 'PGRST116') {
            // No rows found, should be handled by trigger, but just in case
            await supabase.from('notification_preferences').insert([{ user_id: user.id }]);
            setPreferences({
              user_id: user.id,
              push_enabled: false,
              email_enabled: false,
              categories: defaultCategories
            });
          } else {
             throw error;
          }
        } else {
          setPreferences({
             ...data,
             categories: { ...defaultCategories, ...data.categories }
          });
        }
      } catch (err) {
        console.error('Error fetching preferences:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [user]);

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!user) return;

    setPreferences(prev => prev ? { ...prev, ...updates } : null);

    try {
      await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', user.id);
    } catch (err) {
      console.error('Error updating preferences:', err);
    }
  };

  return { preferences, isLoading, updatePreferences };
}
