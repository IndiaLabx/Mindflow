import { create } from 'zustand';

export interface DebugEvent {
  id: string;
  timestamp: number;
  message: string;
  metadata?: any;
}

interface DebugStore {
  isOpen: boolean;
  events: DebugEvent[];
  toggleOpen: () => void;
  logEvent: (message: string, metadata?: any) => void;
  clearEvents: () => void;
}

export const useDebugStore = create<DebugStore>((set) => ({
  isOpen: false,
  events: [],
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  logEvent: (message, metadata) => set((state) => {
      const newEvent = {
          id: Math.random().toString(36).substring(7),
          timestamp: Date.now(),
          message,
          metadata
      };
      // Keep last 100 events
      return { events: [...state.events, newEvent].slice(-100) };
  }),
  clearEvents: () => set({ events: [] })
}));
