import { supabase } from '../../../lib/supabase';

export type ChatRoom = {
  id: string;
  type: 'direct' | 'group';
  created_at: string;
  updated_at: string;
  // Synthetic fields joined on client or view
  participants?: { user_id: string; username?: string | null; full_name: string | null; avatar_url: string | null; last_seen?: string | null }[];
  last_message?: string;
};

export type ChatMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  text_content: string;
  media_url?: string | null;
  media_type?: string | null;
  created_at: string;
  updated_at: string;
  read_at?: string | null;
  likes?: { user_id: string }[];
  // Local optimistic state
  status?: 'sending' | 'sent' | 'error';
};

export const fetchUserRooms = async (userId: string): Promise<ChatRoom[]> => {
  try {
  // First find rooms the user is in
  const { data: myParticipants, error: pError } = await supabase
    .from('chat_participants')
    .select('room_id')
    .eq('user_id', userId);

  if (pError) throw pError;
  if (!myParticipants || myParticipants.length === 0) return [];

  const roomIds = myParticipants.map(p => p.room_id);

  // Fetch rooms and all participants for those rooms to display names/avatars
  const { data: rooms, error: rError } = await supabase
    .from('chat_rooms')
    .select(`
      id, type, created_at, updated_at,
      chat_participants!inner(
        user_id
      )
    `)
    .in('id', roomIds);

  if (rError) throw rError;

  // Since we can't join to profiles easily in one deep query with Supabase's standard setup without a view,
  // we'll fetch profiles for participants.
  const participantUserIds = new Set<string>();
  rooms.forEach((r: any) => r.chat_participants.forEach((p: any) => participantUserIds.add(p.user_id)));

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, last_seen')
    .in('id', Array.from(participantUserIds));

  const profileMap = new Map(profiles?.map(p => [p.id, p]));

  return rooms.map((r: any) => ({
    id: r.id,
    type: r.type,
    created_at: r.created_at,
    updated_at: r.updated_at,
    participants: r.chat_participants.map((p: any) => ({
      user_id: p.user_id,
      ...profileMap.get(p.user_id)
    }))
  }));
  } catch (err) {
    console.error('Fetch user rooms error:', err);
    return [];
  }
};

export const uploadChatMedia = async (file: File, userId: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('chat_media')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('chat_media')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

export const fetchMessages = async (roomId: string, limit = 50): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('chat_room_messages')
    .select('*, likes:chat_message_likes(user_id)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false }) // fetch newest first
    .limit(limit);

  if (error) throw error;
  
  // We reverse it to display oldest at top, newest at bottom
  return (data as ChatMessage[]).reverse().map(m => ({ ...m, status: 'sent' }));
};

export const sendMessage = async (message: Partial<ChatMessage>): Promise<ChatMessage> => {
  const { data, error } = await supabase
    .from('chat_room_messages')
    .insert([{
      room_id: message.room_id,
      sender_id: message.sender_id,
      text_content: message.text_content || '',
      media_url: message.media_url,
      media_type: message.media_type
    }])
    .select()
    .single();

  if (error) throw error;
  return data as ChatMessage;
};


export const toggleMessageLike = async (messageId: string, userId: string, isLiked: boolean): Promise<void> => {
  if (isLiked) {
    const { error } = await supabase
      .from('chat_message_likes')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('chat_message_likes')
      .insert({ message_id: messageId, user_id: userId });
    if (error) throw error;
  }
};
