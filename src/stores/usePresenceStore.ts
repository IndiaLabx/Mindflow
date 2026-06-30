import { create } from 'zustand';

interface PresenceState {
  onlineUsers: Set<string>;
  setOnlineUsers: (userIds: string[]) => void;
  isUserOnline: (userId: string) => boolean;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUsers: new Set(),
  setOnlineUsers: (userIds) => set({ onlineUsers: new Set(userIds) }),
  isUserOnline: (userId) => get().onlineUsers.has(userId),
}));
