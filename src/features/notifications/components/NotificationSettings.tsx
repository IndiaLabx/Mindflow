import React from 'react';
import { useNotificationPreferences, usePushNotifications } from '../hooks';
import { cn } from '../../../utils/cn';
import { Switch } from '@headlessui/react';
import { Bell, Volume2, Calendar, FileText, Megaphone } from 'lucide-react';

export const NotificationSettings: React.FC = () => {
  const { preferences, isLoading, updatePreferences } = useNotificationPreferences();
  const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!preferences) return null;

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await subscribe();
      if (success) {
        updatePreferences({ push_enabled: true });
      }
    } else {
      await unsubscribe();
      updatePreferences({ push_enabled: false });
    }
  };

  const handleCategoryToggle = (category: keyof typeof preferences.categories) => {
    updatePreferences({
      categories: {
        ...preferences.categories,
        [category]: !preferences.categories[category]
      }
    });
  };

  const categories = [
    { id: 'announcements', label: 'Announcements', description: 'Platform updates and news', icon: Megaphone },
    { id: 'tests_quizzes', label: 'Tests & Quizzes', description: 'Reminders for upcoming mock tests', icon: Calendar },
    { id: 'study_materials', label: 'Study Materials', description: 'Alerts when new PDFs are added', icon: FileText },
    { id: 'daily_reminders', label: 'Daily Reminders', description: 'Nudges to maintain your streak', icon: Volume2 },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
          <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Preferences</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage how you receive alerts and updates</p>
        </div>
      </div>

      <div className="space-y-4">
        {isSupported && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Push Notifications</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Receive alerts even when the app is closed</p>
            </div>
            <Switch
              checked={preferences.push_enabled}
              onChange={handlePushToggle}
              className={cn(
                preferences.push_enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700',
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 dark:focus:ring-offset-gray-900'
              )}
            >
              <span className="sr-only">Use push notifications</span>
              <span
                aria-hidden="true"
                className={cn(
                  preferences.push_enabled ? 'translate-x-5' : 'translate-x-0',
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                )}
              />
            </Switch>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <h4 className="font-medium text-gray-900 dark:text-white">Notification Categories</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Choose what types of alerts you want to see</p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isEnabled = preferences.categories[cat.id];
              return (
                <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      isEnabled ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{cat.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{cat.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onChange={() => handleCategoryToggle(cat.id)}
                    className={cn(
                      isEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700',
                      'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none'
                    )}
                  >
                    <span className="sr-only">Toggle {cat.label}</span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        isEnabled ? 'translate-x-4' : 'translate-x-0',
                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                      )}
                    />
                  </Switch>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
