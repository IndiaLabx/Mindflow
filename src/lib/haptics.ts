import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const triggerHaptic = async (pattern: number | number[] | 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
  try {
    if (Capacitor.isNativePlatform()) {
      if (typeof pattern === 'string') {
        if (pattern === 'light') await Haptics.impact({ style: ImpactStyle.Light });
        else if (pattern === 'medium') await Haptics.impact({ style: ImpactStyle.Medium });
        else if (pattern === 'heavy') await Haptics.impact({ style: ImpactStyle.Heavy });
        else if (pattern === 'success') await Haptics.notification({ type: NotificationType.Success });
        else if (pattern === 'warning') await Haptics.notification({ type: NotificationType.Warning });
        else if (pattern === 'error') await Haptics.notification({ type: NotificationType.Error });
      } else {
         await Haptics.vibrate({ duration: Array.isArray(pattern) ? pattern[0] : pattern });
      }
    } else {
      if (typeof window !== 'undefined' && navigator.vibrate) {
        if (typeof pattern === 'number' || Array.isArray(pattern)) {
           navigator.vibrate(pattern);
        } else {
           navigator.vibrate(50);
        }
      }
    }
  } catch (error) {
    console.warn('Haptics failed:', error);
  }
};
