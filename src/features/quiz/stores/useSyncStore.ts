import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SyncEvent {
  id: string;
  type: 'flashcard_reviewed' | 'bookmark_toggled';
  payload: any;
  timestamp: number;
}

interface SyncState {
  queue: SyncEvent[];
  addEvent: (event: Omit<SyncEvent, 'id' | 'timestamp'>) => void;
  removeEvents: (eventIds: string[]) => void;
  clearQueue: () => void;
  resetStore: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      queue: [],

      addEvent: (event) => set((state) => ({
        queue: [
          ...state.queue,
          {
            ...event,
            id: crypto.randomUUID(),
            timestamp: Date.now()
          }
        ]
      })),

      removeEvents: (eventIds) => set((state) => ({
        queue: state.queue.filter(event => !eventIds.includes(event.id))
      })),

      clearQueue: () => set({ queue: [] }),
      resetStore: () => set({ queue: [] })
    }),
    {
      name: 'mindflow-sync-queue',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
