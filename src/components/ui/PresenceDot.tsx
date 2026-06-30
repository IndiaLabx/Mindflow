import React from 'react';
import { usePresenceStore } from '../../stores/usePresenceStore';
import { cn } from '../../utils/cn';

interface PresenceDotProps {
  userId: string;
  className?: string;
}

export const PresenceDot: React.FC<PresenceDotProps> = ({ userId, className }) => {
  const isOnline = usePresenceStore(state => state.isUserOnline(userId));

  if (!isOnline) return null;

  return (
    <div
      className={cn("w-2.5 h-2.5 bg-green-500 rounded-full shrink-0", className)}
      title="Online"
      aria-label="Online status indicator"
    />
  );
};
