import React from 'react';
import { WifiOff, RefreshCw, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
  actionText?: string;
  actionIcon?: LucideIcon;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "Unable to connect to the server. Please check your network.",
  onRetry,
  actionText = "Retry",
  actionIcon: ActionIcon = RefreshCw
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[300px] w-full p-6 text-center space-y-4"
    >
      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400">
        <WifiOff size={40} className="opacity-80" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Connection Error</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {message}
        </p>
      </div>
      <button
        onClick={onRetry}
        className="mt-4 flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all active:scale-95 shadow-md shadow-primary-600/20"
      >
        <ActionIcon size={18} />
        <span>{actionText}</span>
      </button>
    </motion.div>
  );
};
