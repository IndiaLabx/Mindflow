import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useNotification } from '../../stores/useNotificationStore';

export const PWAUpdateManager: React.FC = () => {
  const { showPopup } = useNotification();
  const intervalMS = 60 * 60 * 1000; // 1 hour for background check

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (!r) return;

      // Periodically check for updates to bypass GitHub Pages cache issues
      setInterval(() => {
        if (!(!r.installing && navigator)) return;
        if (('connection' in navigator) && !navigator.onLine) return;
        r.update();
      }, intervalMS);

      // Force check when app becomes visible again
      document.addEventListener('visibilitychange', () => {
         if (document.visibilityState === 'visible') {
             r.update();
         }
      });
    },
    onNeedRefresh() {
       // Notify user that an update is pending and let them decide to reload
       showPopup({
           title: "Update Available",
           message: "A new version of MindFlow is ready. Would you like to update now?",
           variant: "info",
           actions: [
             {
               label: "Update Now",
               onClick: () => {
                 updateServiceWorker(true);
               },
               variant: "primary"
             },
             {
               label: "Later",
               onClick: () => {
                 // Explicitly do nothing, the user can dismiss
               },
               variant: "secondary"
             }
           ]
       });
    }
  });

  return null; // Silent Background Component
};
