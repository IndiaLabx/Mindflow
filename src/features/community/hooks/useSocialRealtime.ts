import { useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../auth/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export function useSocialRealtime() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    // Postgres Changes for Feed (New Posts)
    const postSubscription = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload: any) => {
          // Optimistically update feed cache with new post
          queryClient.invalidateQueries({ queryKey: ['community-posts'] });
        }
      )
      .subscribe();

    // Broadcast for ephemeral Typing Indicators (Global or Room specific)
    const typingChannel = supabase.channel('chat_typing_status');
    typingChannel
      .on('broadcast', { event: 'typing' }, (payload: any) => {
         // Payload shape { room_id: string, user_id: string, isTyping: boolean }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postSubscription);
      supabase.removeChannel(typingChannel);
    };
  }, [user, queryClient]);

  const sendTypingStatus = useCallback(async (roomId: string, isTyping: boolean) => {
    if (!user) return;
    const channel = supabase.channel('chat_typing_status');
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { room_id: roomId, user_id: user.id, isTyping },
    });
  }, [user]);

  return { sendTypingStatus };
}
