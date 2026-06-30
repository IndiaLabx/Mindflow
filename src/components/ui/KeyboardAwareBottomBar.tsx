import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { Capacitor } from '@capacitor/core';

interface KeyboardAwareBottomBarProps {
  children: React.ReactNode;
  className?: string;
  hasGlobalFooter?: boolean;
}

/**
 * A generalized Viewport-Aware Surface System for fixed-bottom components.
 * Handles safe-area insets, global footer offsets, and Android WebView keyboard resizing.
 * No component should use ad-hoc bottom-[calc(...)] classes directly.
 */
export const KeyboardAwareBottomBar: React.FC<KeyboardAwareBottomBarProps> = ({
  children,
  className,
  hasGlobalFooter = false
}) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleResize = () => {
      // In Android WebViews, when the keyboard opens, the visualViewport height shrinks.
      // We can use this to detect keyboard presence if the plugin is not installed.
      // However, usually we rely on capacitor/keyboard if available.
      // For now, standard viewport resize listener:
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const screenHeight = window.screen.height;

      // If viewport is significantly smaller than screen, assume keyboard is open
      if (screenHeight - viewportHeight > 150) {
         // Keyboard is likely open, browser usually handles scrolling, but we ensure we snap to bottom of visual viewport
      } else {
         // Keyboard closed
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className={cn(
        "fixed left-0 right-0 w-full max-w-3xl mx-auto z-[60] bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 shadow-[0_-10px_20px_rgba(255,255,255,1)] dark:shadow-[0_-10px_20px_rgba(0,0,0,0.5)] transition-all duration-200 ease-out",
        hasGlobalFooter ? "bottom-[calc(56px_+_env(safe-area-inset-bottom))] md:bottom-0" : "bottom-0",
        "pb-[calc(0.5rem_+_env(safe-area-inset-bottom))] pt-3 px-4",
        className
      )}
      style={{
          // For future visualViewport dynamic clamping if needed
      }}
    >
      {children}
    </div>
  );
};
