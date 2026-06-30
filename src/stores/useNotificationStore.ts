import { create } from 'zustand';
import { ReactNode } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'offline' | 'sync' | 'loading' | 'promotional';

export interface ToastOptions {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  duration?: number; // 0 for persistent
}

export type PopupVariant = 'success' | 'error' | 'warning' | 'info' | 'promotional';

export interface PopupAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface PopupOptions {
  variant: PopupVariant;
  title: string;
  message: ReactNode;
  actions?: PopupAction[];
  onClose?: () => void;
  dismissible?: boolean;
}

interface NotificationState {
  toasts: ToastOptions[];
  activePopup: PopupOptions | null;
  showToast: (options: Omit<ToastOptions, 'id'>) => void;
  removeToast: (id: string) => void;
  showPopup: (options: PopupOptions) => void;
  closePopup: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  toasts: [],
  activePopup: null,

  showToast: (options) => set((state) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToasts = [...state.toasts, { ...options, id }];
    // Limit to 5 toasts max in state
    if (newToasts.length > 5) {
      return { toasts: newToasts.slice(newToasts.length - 5) };
    }
    return { toasts: newToasts };
  }),

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((toast) => toast.id !== id)
  })),

  showPopup: (options) => set({
    activePopup: options
  }),

  closePopup: () => set({
    activePopup: null
  })
}));

// Create a wrapper hook to maintain compatibility with existing `useNotification` imports
export const useNotification = () => useNotificationStore();
