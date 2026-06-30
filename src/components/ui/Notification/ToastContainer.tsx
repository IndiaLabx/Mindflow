import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toast } from './Toast';
import { useNotification } from '../../../stores/useNotificationStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotification();

  return (
    <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col gap-2 p-4 md:items-center sm:px-6 md:px-8 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onRemove={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
