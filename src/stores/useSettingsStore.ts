import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SettingsState {
  isDarkMode: boolean;
  toggleDarkMode: (event?: React.MouseEvent | React.TouchEvent | Event | any) => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  isHapticEnabled: boolean;
  toggleHaptics: () => void;
  areBgAnimationsEnabled: boolean;
  toggleBgAnimations: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Default values (aligning with previous useLocalStorageState defaults)
      isDarkMode: false,
      isSoundEnabled: true,
      isHapticEnabled: true,
      areBgAnimationsEnabled: false,

      toggleDarkMode: (event?: any) => {
        const { isDarkMode } = get();
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const willBeDark = !isDarkMode;

        // Fallback for browsers without View Transitions or users who prefer reduced motion
        if (!(document as any).startViewTransition || prefersReducedMotion || !event) {
          if (willBeDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          set({ isDarkMode: willBeDark });
          return;
        }

        // Get click coordinates
        let x = 0;
        let y = 0;
        if (event.clientX !== undefined && event.clientY !== undefined) {
          x = event.clientX;
          y = event.clientY;
        } else if (event.touches && event.touches.length > 0) {
          x = event.touches[0].clientX;
          y = event.touches[0].clientY;
        } else if (event.nativeEvent && event.nativeEvent.clientX !== undefined) {
           x = event.nativeEvent.clientX;
           y = event.nativeEvent.clientY;
        } else {
           x = window.innerWidth / 2;
           y = window.innerHeight / 2;
        }

        const endRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        );

        const transition = (document as any).startViewTransition(() => {
          if (willBeDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          set({ isDarkMode: willBeDark });
        });

        transition.ready.then(() => {
          const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ];
          document.documentElement.animate(
            {
              clipPath: clipPath,
            },
            {
              duration: 500,
              easing: 'ease-in-out',
              pseudoElement: '::view-transition-new(root)',
            }
          );
        });
      },

      toggleSound: () => set((state) => ({ isSoundEnabled: !state.isSoundEnabled })),

      toggleHaptics: () => {
        const { isHapticEnabled } = get();
        const willBeEnabled = !isHapticEnabled;
        set({ isHapticEnabled: willBeEnabled });
        if (navigator.vibrate && willBeEnabled) {
          navigator.vibrate(50);
        }
      },

      toggleBgAnimations: () => {
        const { areBgAnimationsEnabled } = get();
        const willBeEnabled = !areBgAnimationsEnabled;
        if (willBeEnabled) {
          document.body.classList.add('background-animated');
        } else {
          document.body.classList.remove('background-animated');
        }
        set({ areBgAnimationsEnabled: willBeEnabled });
      },
    }),
    {
      name: 'mindflow-settings', // Unique name for localStorage
      storage: createJSONStorage(() => localStorage),
      // We need to sync the initial state with DOM classes (dark mode, animations)
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.isDarkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          if (state.areBgAnimationsEnabled) {
            document.body.classList.add('background-animated');
          } else {
            document.body.classList.remove('background-animated');
          }
        }
      },
      // Migrate old localStorage keys to Zustand persist state if they exist
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // If no Zustand state exists, try to pull from old keys
          const oldDarkMode = localStorage.getItem('mindflow_settings_v1_darkMode');
          const oldSound = localStorage.getItem('soundEnabled');
          const oldHaptics = localStorage.getItem('hapticsEnabled');
          const oldAnimations = localStorage.getItem('bgAnimationsEnabled');

          return {
            isDarkMode: oldDarkMode ? JSON.parse(oldDarkMode) : false,
            isSoundEnabled: oldSound ? JSON.parse(oldSound) : true,
            isHapticEnabled: oldHaptics ? JSON.parse(oldHaptics) : true,
            areBgAnimationsEnabled: oldAnimations ? JSON.parse(oldAnimations) : true,
          } as SettingsState;
        }
        // Version 2 migration forces areBgAnimationsEnabled to false to save resources
        if (version === 1) {
          return {
            ...persistedState,
            areBgAnimationsEnabled: false
          };
        }
        return persistedState;
      }
    }
  )
);
