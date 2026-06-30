import { useNotificationStore } from './stores/useNotificationStore';
import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { AppProvider } from './providers/AppProvider';
import { AppRoutes } from './routes/AppRoutes';
import { supabase } from './lib/supabase';
import { SynapticLoader } from './components/ui/SynapticLoader';

/**
 * Root Application Component.
 *
 * Responsibilities:
 * 1. Initializes the Supabase authentication session.
 * 2. Sets up the Router (HashRouter for GitHub Pages compatibility).
 * 3. Wraps the app in the global `AppProvider`.
 * 4. Renders the main `AppRoutes`.
 *
 * @returns {JSX.Element} The mounted application.
 */
import { PWAUpdateManager } from './components/common/PWAUpdateManager';
import { PresenceProvider } from './providers/PresenceProvider';
import { useAppVisibilityReawakening } from './hooks/useAppVisibilityReawakening';

const AppVisibilityWrapper = () => {
  useAppVisibilityReawakening();
  return null;
};

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 1. Check for active session on app mount (Before Router mounts completely)
    const initAuth = async () => {
      // getSession() parses the URL hash for tokens if present (OAuth redirect)
      try {
        await supabase.auth.getSession();
      } catch (err) {
        console.error('[AuthStabilization] Initial getSession failed or timed out:', err);
      }
      
      // Check for Smart Restore after an Auto-Update
      if (localStorage.getItem('mindflow_auto_updated') === 'true') {
         localStorage.removeItem('mindflow_auto_updated');
         // We inject a small delay to ensure providers and stores are mounted
         setTimeout(() => {
             useNotificationStore.getState().showToast({
                 title: "App Updated",
                 message: "Successfully updated! Resuming your quiz... 😎",
                 variant: "success"
             });
         }, 1000);
      }

      // Set ready state to render the router
      setIsReady(true);
    };

    initAuth();
  }, []);

  if (!isReady) {
    // Show a loading spinner while Supabase initializes, UNLESS we are on the entry page
    // where the CinematicIntro will handle the initial visual experience.
    const isEntryPage = window.location.hash === '' || window.location.hash === '#/';
    if (isEntryPage) {
      return <div className="h-screen w-screen bg-white dark:bg-slate-900" />;
    }
    return <div className="h-screen flex items-center justify-center"><SynapticLoader size="xl" /></div>;
  }

  return (
    <HashRouter>
      <AppProvider>
        <AppVisibilityWrapper />
        <PresenceProvider>
          <PWAUpdateManager />
        <AppRoutes />
        </PresenceProvider>
      </AppProvider>
    </HashRouter>
  );
};

export default App;
