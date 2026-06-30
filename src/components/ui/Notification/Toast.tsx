import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  WifiOff,
  RefreshCw,
  Loader2,
  Gift,
  X
} from 'lucide-react';
import { ToastOptions, useNotification } from '../../../stores/useNotificationStore';

export interface ToastProps extends ToastOptions {
  onRemove: (id: string) => void;
}

const variantStyles = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    textColor: 'text-emerald-800 dark:text-emerald-200',
    icon: CheckCircle,
    role: 'status',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/40',
    border: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-500 dark:text-red-400',
    textColor: 'text-red-800 dark:text-red-200',
    icon: XCircle,
    role: 'alert',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-500 dark:text-amber-400',
    textColor: 'text-amber-800 dark:text-amber-200',
    icon: AlertTriangle,
    role: 'alert',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-500 dark:text-blue-400',
    textColor: 'text-blue-800 dark:text-blue-200',
    icon: Info,
    role: 'status',
  },
  offline: {
    bg: 'bg-slate-50 dark:bg-slate-800/60',
    border: 'border-slate-300 dark:border-slate-600',
    iconColor: 'text-slate-500 dark:text-slate-400',
    textColor: 'text-slate-800 dark:text-slate-200',
    icon: WifiOff,
    role: 'alert',
  },
  sync: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-800',
    iconColor: 'text-indigo-500 dark:text-indigo-400',
    textColor: 'text-indigo-800 dark:text-indigo-200',
    icon: RefreshCw,
    role: 'status',
  },
  loading: {
    bg: 'bg-gray-50 dark:bg-gray-800/60',
    border: 'border-gray-200 dark:border-gray-700',
    iconColor: 'text-gray-500 dark:text-gray-400',
    textColor: 'text-gray-800 dark:text-gray-200',
    icon: Loader2,
    role: 'status',
  },
  promotional: {
    bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/40',
    border: 'border-fuchsia-200 dark:border-fuchsia-800',
    iconColor: 'text-fuchsia-500 dark:text-fuchsia-400',
    textColor: 'text-fuchsia-800 dark:text-fuchsia-200',
    icon: Gift,
    role: 'status',
  },
};

export const Toast: React.FC<ToastProps> = ({
  id,
  variant,
  title,
  message,
  duration,
  onRemove
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Determine default duration if not specified
  const getDuration = () => {
    if (duration !== undefined) return duration;
    if (variant === 'success' || variant === 'info' || variant === 'sync' || variant === 'promotional') return 5000;
    if (variant === 'error' || variant === 'warning') return 7000;
    if (variant === 'loading' || variant === 'offline') return 0; // persistent until manually dismissed
    return 5000;
  };

  const actualDuration = getDuration();

  const startTimer = () => {
    if (actualDuration > 0 && !isPaused) {
      timeoutRef.current = setTimeout(() => {
        onRemove(id);
      }, actualDuration);
    }
  };

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    startTimer();
    return () => clearTimer();
  }, [isPaused, actualDuration]);

  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      drag="x"
      dragConstraints={{ left: -100, right: 100 }}
      dragElastic={0.2}
      onDragEnd={(e, info) => {
        if (Math.abs(info.offset.x) > 50) {
          onRemove(id);
        }
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role={style.role}
      className={`relative w-full max-w-sm sm:max-w-md mx-auto pointer-events-auto rounded-xl border p-4 shadow-lg backdrop-blur-sm transition-colors ${style.bg} ${style.border}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 shrink-0 ${style.iconColor}`}>
          <Icon className={`w-5 h-5 ${variant === 'loading' ? 'animate-spin' : ''}`} />
        </div>

        <div className={`flex-1 min-w-0 ${style.textColor}`}>
          {title && (
            <h4 className="text-sm font-semibold mb-1 truncate">
              {title}
            </h4>
          )}
          <p className="text-sm leading-snug opacity-90 break-words">
            {message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={() => onRemove(id)}
          className={`shrink-0 p-1 rounded-md opacity-50 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-500 ${style.textColor}`}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Optional: Progress bar for visual duration feedback */}
      {actualDuration > 0 && (
        <div className="absolute bottom-0 left-0 h-1 bg-black/5 dark:bg-white/10 w-full overflow-hidden rounded-b-xl">
          <motion.div
            className={`h-full ${style.bg.includes('emerald') ? 'bg-emerald-500' :
                                style.bg.includes('red') ? 'bg-red-500' :
                                style.bg.includes('amber') ? 'bg-amber-500' :
                                style.bg.includes('blue') ? 'bg-blue-500' :
                                style.bg.includes('indigo') ? 'bg-indigo-500' :
                                style.bg.includes('fuchsia') ? 'bg-fuchsia-500' :
                                'bg-slate-500'}`}
            initial={{ width: '100%' }}
            animate={{ width: isPaused ? '100%' : '0%' }}
            transition={{ duration: actualDuration / 1000, ease: 'linear' }}
          />
        </div>
      )}
    </motion.div>
  );
};
