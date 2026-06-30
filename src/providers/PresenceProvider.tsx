import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../features/auth/context/AuthContext';
import { fetchWithTimeout } from '../lib/fetchWithTimeout';
import { usePresenceStore } from '../stores/usePresenceStore';

export const PresenceProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const setOnlineUsers = usePresenceStore((state) => state.setOnlineUsers);

  useEffect(() => {
    if (!user) return;

    const room = supabase.channel('global_presence');

    room
      .on('presence', { event: 'sync' }, () => {
        const newState = room.presenceState();
        const onlineIds = Object.values(newState)
          .flat()
          .map((presence: any) => presence.user_id)
          .filter(Boolean);

        setOnlineUsers(onlineIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await room.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    const updateLastSeen = () => {
      // Use standard fetch with keepalive to ensure it fires during unload
      const updateData = { last_seen: new Date().toISOString() };

      // Get the current session for auth token
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          fetchWithTimeout(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(updateData),
            keepalive: true
          }).catch(console.error);
        }
      });
    };

    window.addEventListener('beforeunload', updateLastSeen);

    return () => {
      window.removeEventListener('beforeunload', updateLastSeen);

      // Update last seen in DB when component unmounts (e.g. sign out)
      supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id);

      room.unsubscribe();
    };
  }, [user, setOnlineUsers]);

  return <>{children}</>;
};
