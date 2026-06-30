import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { Capacitor } from '@capacitor/core';
import { motion, HTMLMotionProps } from 'framer-motion';

interface KeyboardAwareSurfaceProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hasGlobalFooter?: boolean;
  isModal?: boolean;
}

/**
 * A generalized Viewport-Aware Surface System for any bottom-anchored or modal surface.
 * Handles safe-area insets, global footer offsets, and Android WebView keyboard resizing.
 */
export const KeyboardAwareSurface: React.FC<KeyboardAwareSurfaceProps> = ({
  children,
  className,
  hasGlobalFooter = false,
  isModal = false,
  ...motionProps
}) => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleResize = () => {
      // In Android WebViews, when the keyboard opens, the visualViewport height shrinks.
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  // For modals, we center them on sm+ screens. On mobile, they snap to bottom.
  const baseClasses = isModal
    ? "fixed inset-x-0 sm:bottom-auto z-[9999] flex flex-col sm:max-w-xl sm:mx-auto sm:inset-y-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
    : "fixed left-0 right-0 w-full max-w-3xl mx-auto z-[60]";

  const mobileBottomOffset = hasGlobalFooter
    ? "bottom-[calc(56px_+_env(safe-area-inset-bottom))] md:bottom-0"
    : "bottom-[env(safe-area-inset-bottom)]";

  return (
    <motion.div
      className={cn(
        baseClasses,
        !isModal && mobileBottomOffset,
        isModal && !hasGlobalFooter ? "bottom-0" : "",
        isModal && hasGlobalFooter ? mobileBottomOffset : "",
        className
      )}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};
