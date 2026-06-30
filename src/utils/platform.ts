import { Capacitor } from '@capacitor/core';

/**
 * Utility to detect if the app is running natively via Capacitor (iOS/Android).
 */
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Utility to get the current platform name (e.g., 'web', 'ios', 'android').
 */
export const getPlatform = (): string => {
  return Capacitor.getPlatform();
};
