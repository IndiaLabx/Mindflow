import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Gift,
  X
} from 'lucide-react';
import { useNotification, PopupVariant } from '../../../stores/useNotificationStore';

const variantStyles = {
  success: {
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    icon: CheckCircle,
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
  },
  error: {
    iconColor: 'text-red-500 dark:text-red-400',
    icon: XCircle,
    bg: 'bg-red-50 dark:bg-red-900/30',
  },
  warning: {
    iconColor: 'text-amber-500 dark:text-amber-400',
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-900/30',
  },
  info: {
    iconColor: 'text-blue-500 dark:text-blue-400',
    icon: Info,
    bg: 'bg-blue-50 dark:bg-blue-900/30',
  },
  promotional: {
    iconColor: 'text-fuchsia-500 dark:text-fuchsia-400',
    icon: Gift,
    bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/30',
  },
};

export const Popup: React.FC = () => {
  const { activePopup, closePopup } = useNotification();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Prevent scrolling when popup is active
    if (activePopup) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [activePopup]);

  if (!activePopup) return null;

  const handleClose = () => {
    if (activePopup.onClose) {
      activePopup.onClose();
    }
    closePopup();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current && activePopup.dismissible !== false) {
      handleClose();
    }
  };

  const { variant, title, message, actions, dismissible } = activePopup;
  const style = variantStyles[variant as PopupVariant] || variantStyles.info;
  const Icon = style.icon;

  return (
    <AnimatePresence>
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        aria-labelledby="popup-title"
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          {dismissible !== false && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="p-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${style.bg}`}>
              <Icon className={`w-6 h-6 ${style.iconColor}`} />
            </div>

            <h3 id="popup-title" className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {title}
            </h3>

            <div className="text-slate-600 dark:text-slate-300 text-sm md:text-base mb-6">
              {message}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              {actions ? (
                actions.map((action, index) => {
                  const isPrimary = action.variant === 'primary' || (!action.variant && index === actions.length - 1);
                  const isDanger = action.variant === 'danger';

                  let btnClasses = "px-4 py-2 rounded-xl font-medium text-sm md:text-base transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 w-full sm:w-auto text-center";

                  if (isPrimary) {
                    btnClasses += " bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm";
                  } else if (isDanger) {
                    btnClasses += " bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm";
                  } else {
                    btnClasses += " bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 focus:ring-slate-400";
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        action.onClick();
                        closePopup();
                      }}
                      className={btnClasses}
                    >
                      {action.label}
                    </button>
                  );
                })
              ) : (
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium text-sm md:text-base hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 w-full sm:w-auto shadow-sm"
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
