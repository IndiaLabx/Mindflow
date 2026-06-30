import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useDebugStore } from '../../../stores/useDebugStore';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { syncService } from '../../../lib/syncService';
import { db } from '../../../lib/db';
import { AlertTriangle, LogOut, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '../../../stores/useNotificationStore';
import { useQuizSessionStore } from '../../quiz/stores/useQuizSessionStore';


/**
 * Interface for the Auth Context value.
 */
interface AuthContextType {
  profileStatus: string | null;
  deleteRequestedAt: string | null;
  /** The current canonical public.profiles row. */
  profile: any | null;
  /** The current Supabase session, or null if not authenticated. */
  session: Session | null;
  /** The current authenticated user object, or null. */
  user: User | null;
  /** True if the initial session check is still in progress. */
  loading: boolean;
  isAuthTransitioning: boolean;
  /** Function to sign out the current user. */
  signOut: () => Promise<void>;
  /** Function to manually refresh user data from the server. */
  refreshUser: () => Promise<void>;
  /** Function to manually refresh canonical profile from the server. */
  refreshProfile: () => Promise<void>;
}

const SESSION_ID_KEY = 'mindflow_device_session_id';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider component for Supabase Authentication.
 *
 * Manages the authentication lifecycle, including:
 * - Initial session recovery.
 * - Listening for auth state changes (sign in, sign out).
 * - Handling PWA-specific authentication flow where auth might happen in a popup or separate window.
 * - Ensuring the user has a default avatar if one is missing (e.g., for Google auth).
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - Child components.
 * @returns {JSX.Element} The AuthContext Provider.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [deleteRequestedAt, setDeleteRequestedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthTransitioning, setIsAuthTransitioning] = useState(false);
  const [sessionConflict, setSessionConflict] = useState(false);
  const lastSyncedUserId = useRef<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    let sessionSub: any = null;

    if (user) {
      const initSessionTracker = async () => {
        let localSessionId = localStorage.getItem(SESSION_ID_KEY);

        if (localSessionId) {
          // Reopening the app on an existing device
          const { data, error } = await supabase
            .from('user_active_sessions')
            .select('session_token')
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) {
            console.error('Error fetching active session:', error);
            return;
          }

          if (data && data.session_token !== localSessionId) {
            // Kicked out while offline
            console.warn("Session hijacked while offline! Another device logged in.");
            await forceEvict();

            return;
          } else if (!data) {
             // Ghost token scenario, reclaim it
             await upsertSession(localSessionId);
          }
          setupWatcher(); // Safe to watch
        } else {
          // Fresh login (No local session ID). Check if DB already has a session
          const { data } = await supabase
            .from('user_active_sessions')
            .select('session_token')
            .eq('user_id', user.id)
            .maybeSingle();

          if (data && data.session_token) {
             // Conflict! Another device is currently active
             setSessionConflict(true);
             // Do NOT setup watcher or upsert yet. Wait for user decision.
             return;
          }

          // No conflict, safe to claim
          localSessionId = crypto.randomUUID();
          localStorage.setItem(SESSION_ID_KEY, localSessionId);
          await upsertSession(localSessionId);
          setupWatcher();
        }
      };

      const upsertSession = async (token: string) => {
        const { error } = await supabase
          .from('user_active_sessions')
          .upsert({ user_id: user.id, session_token: token, updated_at: new Date().toISOString() }, { onConflict: 'user_id', ignoreDuplicates: false });

        if (error) {
          console.error("Failed to update active session token:", error);
        }
      };

      const setupWatcher = () => {
        sessionSub = supabase
          .channel('active_session_watcher')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_active_sessions',
              filter: `user_id=eq.${user.id}`
            },
            async (payload) => {
              // Ignore DELETE events to prevent empty payload crashes
              if (payload.eventType === 'DELETE') return;

              const remoteSessionToken = (payload.new as any).session_token;
              const currentLocalToken = localStorage.getItem(SESSION_ID_KEY);

              // If the tokens do NOT match, it means another device logged in!
              if (currentLocalToken && remoteSessionToken !== currentLocalToken) {
                console.warn("Session hijacked! Another device logged in.");

                // Evict the user
                await forceEvict();


              }
            }
          )
          .subscribe();
      };

      initSessionTracker();
    }

    return () => {
      if (sessionSub) {
        supabase.removeChannel(sessionSub);
      }
    };
  }, [user]);


  useEffect(() => {
    // --- ROBUST PWA AUTH FIX: STORAGE EVENT LISTENER ---
    // This listener runs in the main PWA window to detect successful login in a secondary window/popup.
    const handleStorageChange = (event: StorageEvent) => {
      // The Supabase client library writes the session to localStorage. We listen for that.
      // The key contains 'auth-token'.
      if (event.key?.includes('auth-token') && event.newValue) {
        // When the auth token appears in storage, it means the auth popup was successful.
        // We force a reload of this main PWA window to apply the new session.
        console.log('Auth token changed in storage, reloading PWA...');
        window.location.reload();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    // --- END PWA AUTH FIX ---

    const getInitialSession = async () => {
      useDebugStore.getState().logEvent('AuthContext mounted & getInitialSession started');
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      useDebugStore.getState().logEvent('Initial session loaded', { hasSession: !!session, metadataAvatar: session?.user?.user_metadata?.avatar_url });
      if (session?.user && lastSyncedUserId.current !== session.user.id) {
         lastSyncedUserId.current = session.user.id;
         // Run sync on load if user is logged in
         syncService.syncOnLogin(session.user.id, false);
      }
      if (session?.user) {
        try {
            const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
            if (data) {
                useDebugStore.getState().logEvent('Canonical profile fetched (initial)', { avatar_url: data.avatar_url, updated_at: data.updated_at });
                setProfile(data);
                setProfileStatus(data.status);
                setDeleteRequestedAt(data.delete_requested_at);
            }
        } catch (e) { console.error('Error fetching profile:', e); }
      }
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // This logic runs in both the main app and the auth popup.

      // If we are in the auth popup (opened by Google OAuth), close it after successful sign-in.
      if (event === 'SIGNED_IN' && window.opener) {
        window.close();
        return;
      }

      // Normal state update for the main application window
      setSession(session);
      if (session?.user) {
        let finalUser = session.user;

        setUser(finalUser);
        useDebugStore.getState().logEvent('Auth state change triggered', { event, metadataAvatar: finalUser?.user_metadata?.avatar_url });
        try {
            const { data } = await supabase.from('profiles').select('*').eq('id', finalUser.id).maybeSingle();
            if (data) {
                useDebugStore.getState().logEvent('Canonical profile fetched (initial)', { avatar_url: data.avatar_url, updated_at: data.updated_at });
                setProfile(data);
                setProfileStatus(data.status);
                setDeleteRequestedAt(data.delete_requested_at);
            }
        } catch (e) { console.error('Error fetching profile on auth change:', e); }

        // Check if this is a sign up event (either from explicit event or local flag)
        const isSignup = (event as string) === 'SIGNED_UP' || localStorage.getItem('mindflow_is_signup') === 'true';

        // Run sync only on explicit sign-in or sign-up, not on token refreshes or user updates
        // We also check lastSyncedUserId to avoid redundant syncs on INITIAL_SESSION if already handled
        if (((event as string) === 'SIGNED_IN' || (event as string) === 'SIGNED_UP' || (event as string) === 'INITIAL_SESSION') && lastSyncedUserId.current !== finalUser.id) {
            lastSyncedUserId.current = finalUser.id;
            syncService.syncOnLogin(finalUser.id, isSignup).then(() => {
                if (isSignup) {
                    localStorage.removeItem('mindflow_is_signup');
                }
            });
        }
      } else {
        setUser(null);
        setProfileStatus(null);
        setDeleteRequestedAt(null);
        lastSyncedUserId.current = null;

        // If explicitly signed out by Supabase event (e.g. session expired, logged out elsewhere)
        if (event === 'SIGNED_OUT') {
           useQuizSessionStore.getState().resetStore();
    import('../../quiz/stores/useAnalyticsStore').then(m => m.useAnalyticsStore.getState().resetAnalytics());
    import('../../quiz/stores/useFlashcardStore').then(m => m.useFlashcardStore.getState().resetSession());
    import('../../quiz/stores/useSyncStore').then(m => m.useSyncStore.getState().resetStore());
    import('../../quiz/stores/useBookmarkStore').then(m => m.useBookmarkStore.getState().resetStore());
    import('../../community/stores/useSocialStore').then(m => m.useSocialStore.getState().resetStore());
    import('../../vocab/stores/useDeckSessionStore').then(m => m.useDeckSessionStore.getState().resetStore());
    queryClient.clear();
           db.clearAllUserData().catch(console.error);
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  /** Signs out the current user (Intentional Logout). */
  const signOut = async () => {
    console.log("[Diagnostic] signOut START");
    setIsAuthTransitioning(true);

    try {
      // 1. Immediately purge React Query Cache
      queryClient.clear();

      // 2. Immediately purge all user-scoped Zustand stores
      const { useQuizSessionStore } = await import('../../quiz/stores/useQuizSessionStore');
      const { useAnalyticsStore } = await import('../../quiz/stores/useAnalyticsStore');
      const { useFlashcardStore } = await import('../../quiz/stores/useFlashcardStore');
      const { useSyncStore } = await import('../../quiz/stores/useSyncStore');
      const { useBookmarkStore } = await import('../../quiz/stores/useBookmarkStore');
      const { useSocialStore } = await import('../../community/stores/useSocialStore');
      const { useDeckSessionStore } = await import('../../vocab/stores/useDeckSessionStore');

      useQuizSessionStore.getState().resetStore();
      useAnalyticsStore.getState().resetAnalytics();
      useFlashcardStore.getState().resetSession();
      useSyncStore.getState().resetStore();
      useBookmarkStore.getState().resetStore();
      useSocialStore.getState().resetStore();
      useDeckSessionStore.getState().resetStore();

      const localSessionId = localStorage.getItem(SESSION_ID_KEY);
      localStorage.removeItem(SESSION_ID_KEY);

      // Only delete from DB if we actually have a user, to clean up on explicit logout
      if (user && localSessionId) {
        // Best effort deletion.
        supabase.from('user_active_sessions').delete().eq('user_id', user.id).eq('session_token', localSessionId).then(({ error }) => { if (error) console.error('Error deleting active session:', error); });
      }

      // Also remove Zustand persist cache from localStorage
      const keysToRemove = [
        'mindflow-social-mode',
        'mindflow_analytics',
        'mindflow_idiom_session',
        'mindflow_ows_session',
        'mindflow_synonym_session',
        'mindflow_sync_queue',
        'mindflow_bookmarks',
        'mindflow_flashcard_filters',
        'mindflow_is_signup'
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));

      window.dispatchEvent(new Event('mindflow-sync-complete'));

      console.log("[Diagnostic] calling supabase.auth.signOut({ scope: 'global' })");
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.error("[AuthStabilization] supabase.auth.signOut threw, but continuing cleanup:", err);
      }
      console.log("[Diagnostic] supabase.auth.signOut RESOLVED");

    } finally {
      setIsAuthTransitioning(false);
      // Run IndexedDB clear asynchronously as background cleanup
      db.clearAllUserData().catch(err => console.error("Error clearing DB during signout:", err));
    }
    console.log("[Diagnostic] signOut END completely");
  };


  /**
   * Helper to deeply scrub all client-side data (Zustand persists, IndexedDB, etc.)
   * without destroying essential UI preferences (like theme).
   */
  const clearClientCaches = async () => {
    // 1. Wipe IndexedDB (Offline storage, Saved Quizzes, History, Interactions)
    await db.clearAllUserData();

    // Reset Zustand store to empty initial state
    useQuizSessionStore.getState().resetStore();
    import('../../quiz/stores/useAnalyticsStore').then(m => m.useAnalyticsStore.getState().resetAnalytics());
    import('../../quiz/stores/useFlashcardStore').then(m => m.useFlashcardStore.getState().resetSession());
    import('../../quiz/stores/useSyncStore').then(m => m.useSyncStore.getState().resetStore());
    import('../../quiz/stores/useBookmarkStore').then(m => m.useBookmarkStore.getState().resetStore());
    import('../../community/stores/useSocialStore').then(m => m.useSocialStore.getState().resetStore());
    import('../../vocab/stores/useDeckSessionStore').then(m => m.useDeckSessionStore.getState().resetStore());
    queryClient.clear();
    import('../../quiz/stores/useAnalyticsStore').then(m => m.useAnalyticsStore.getState().resetAnalytics());
    import('../../quiz/stores/useFlashcardStore').then(m => m.useFlashcardStore.getState().resetSession());
    import('../../quiz/stores/useSyncStore').then(m => m.useSyncStore.getState().resetStore());
    import('../../quiz/stores/useBookmarkStore').then(m => m.useBookmarkStore.getState().resetStore());
    import('../../community/stores/useSocialStore').then(m => m.useSocialStore.getState().resetStore());
    import('../../vocab/stores/useDeckSessionStore').then(m => m.useDeckSessionStore.getState().resetStore());
    queryClient.clear();

    // 2. Wipe specific localStorage items used by Zustand and manual flags
    const keysToRemove = [
      'mindflow-social-mode',
      'mindflow_analytics',
      'mindflow_idiom_session',
      'mindflow_ows_session',
      'mindflow_synonym_session',
      'mindflow_sync_queue',
      'mindflow_bookmarks',
      'mindflow_flashcard_filters',
      'mindflow_is_signup'
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // 3. Keep safe keys like 'theme' or 'mindflow_intro_seen'

    // 4. Force a hard reload to completely flush React memory, Query cache, and Zustand in-memory states.
    // To ensure the "kicked out" toast survives the reload, we use sessionStorage
    sessionStorage.setItem('mindflow_eviction_notice', 'true');
    window.location.href = import.meta.env.BASE_URL + '#/dashboard';
  };

  /** Forces an eviction without touching global DB state or other devices (Hijack scenario). */
  const forceEvict = async () => {
    localStorage.removeItem(SESSION_ID_KEY);
    await supabase.auth.signOut({ scope: 'local' });
    await clearClientCaches();
  };


  const handleTakeoverSession = async () => {
    if (!user) return;
    setSessionConflict(false);

    // Generate new ID and aggressively claim the session
    const localSessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_ID_KEY, localSessionId);

    const { error } = await supabase
      .from('user_active_sessions')
      .update({ session_token: localSessionId, updated_at: new Date().toISOString() }).eq('user_id', user.id).select().maybeSingle();

    if (!error) {
       // Check if local tracking listener is initialized by forcing a reload to cleanly restart the session flow
       window.location.reload();
    }

  };

  const handleCancelTakeover = async () => {
    setSessionConflict(false);
    await forceEvict();
  };


  /** Refreshes the user object from Supabase. */
  const refreshUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  /** Refreshes the canonical profile from Supabase and invalidates caches. */
  const refreshProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (data) {
        setProfile(data);
        setProfileStatus(data.status);
        setDeleteRequestedAt(data.delete_requested_at);

        // Globally invalidate React Query caches related to avatars/profiles
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['user-profile'] });
        queryClient.invalidateQueries({ queryKey: ['current-user-profile'] });
        queryClient.invalidateQueries({ queryKey: ['community-posts'] });
        queryClient.invalidateQueries({ queryKey: ['community-reels'] });
        queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
        queryClient.invalidateQueries({ queryKey: ['my-username'] });
      }
    } catch (e) {
      console.error('Error refreshing profile:', e);
    }
  };


  const value = {
    profileStatus,
    deleteRequestedAt,
    profile,
    refreshProfile,
    session,
    user,
    loading,
    isAuthTransitioning,
    signOut,
    refreshUser,
  };


  return (
    <AuthContext.Provider value={value}>
      {children}

      <AnimatePresence>
        {sessionConflict && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-700"
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4 mx-auto">
                  <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                </div>

                <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                  Session Already Active
                </h3>

                <p className="text-gray-600 dark:text-gray-300 text-center mb-6 text-sm">
                  You are already logged in on another device. Would you like to sign out from the other device and continue here?
                </p>

                <div className="space-y-3">
                  <button
                    onClick={handleTakeoverSession}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Yes, Continue Here</span>
                  </button>

                  <button
                    onClick={handleCancelTakeover}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Cancel & Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access the authentication context.
 *
 * @returns {AuthContextType} The authentication context value.
 * @throws {Error} If used outside of an AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
