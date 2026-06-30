export type NotificationTargetAudience = 'all' | 'competitive' | 'school';
export type NotificationType = 'announcements' | 'tests_quizzes' | 'study_materials' | 'daily_reminders';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  target_audience: NotificationTargetAudience;
  link: string | null;
  created_at: string;
  is_read?: boolean;
}

export interface NotificationPreferences {
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  categories: {
    announcements: boolean;
    tests_quizzes: boolean;
    study_materials: boolean;
    daily_reminders: boolean;
  };
}
