import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SocialState {
  isSocialMode: boolean;
  toggleSocialMode: (value?: boolean) => void;
  resetStore: () => void;
}

export const useSocialStore = create<SocialState>()(
  persist(
    (set) => ({
      isSocialMode: false,
      toggleSocialMode: (value?: boolean) => set((state) => ({
        isSocialMode: value !== undefined ? value : !state.isSocialMode
      })),
      resetStore: () => set({ isSocialMode: false })
    }),
    {
      name: 'mindflow-social-mode',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
