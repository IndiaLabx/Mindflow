import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useQueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export function useAppVisibilityReawakening() {
  const queryClient = useQueryClient();
  const isRefreshing = useRef(false);

  useEffect(() => {
    const handleReawaken = async () => {
      // 1. Tell React Query that the network is back online IMMEDIATELY.
      // This forces React Query to retry any stalled "pending" queries.
      queryClient.resumePausedMutations();
      focusManager.setFocused(true);
      onlineManager.setOnline(true);

      // 2. Prevent overlapping/concurrent getSession calls during rapid wake cycles.
      if (isRefreshing.current) {
          console.warn('[AuthStabilization] handleReawaken aborted: auth refresh already in progress.');
          return;
      }

      isRefreshing.current = true;
      try {
          // Await the strictly-timeout-wrapped getSession
          await supabase.auth.getSession();
      } catch (error: any) {
          console.error('[AuthStabilization] Background session refresh failed or timed out:', error);
      } finally {
          // Small debounce buffer to prevent spamming
          setTimeout(() => {
              isRefreshing.current = false;
          }, 2000);
      }
    };

    // Web / PWA listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleReawaken();
      } else {
        focusManager.setFocused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Native App (Capacitor) listener
    let capListener: any = null;
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          handleReawaken();
        } else {
          focusManager.setFocused(false);
        }
      }).then(listener => {
         capListener = listener;
      });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (capListener) {
        capListener.remove();
      }
    };
  }, [queryClient]);
}
