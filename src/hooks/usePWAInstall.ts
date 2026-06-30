import { useState, useEffect } from 'react';
import { logEvent } from '../features/quiz/services/analyticsService';

/**
 * Represents the status of the PWA installation process.
 */
export type InstallStatus = 'idle' | 'installing' | 'success' | 'failed';

/**
 * Custom hook to manage Progressive Web App (PWA) installation.
 *
 * This hook listens for the `beforeinstallprompt` event to capture the install prompt,
 * checks if the app is already running in standalone mode, and provides a function
 * to trigger the installation flow.
 *
 * @returns {object} An object containing:
 * - `isInstalled` {boolean}: True if the app is running in standalone mode.
 * - `canInstall` {boolean}: True if the browser has fired the install prompt event.
 * - `triggerInstall` {() => Promise<boolean>}: Function to show the install prompt. Returns true if accepted.
 * - `installStatus` {InstallStatus}: Current status of the installation process.
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installStatus, setInstallStatus] = useState<InstallStatus>('idle');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if the app is already installed (running in standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      setIsInstalled(true);
    }

    // Capture the install prompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  /**
   * Triggers the browser's install prompt.
   *
   * @returns {Promise<boolean>} Resolves to true if the user accepted the install, false otherwise.
   */
  const triggerInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    setInstallStatus('installing');
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      logEvent('app_installed', { platform: navigator.userAgent });
      setDeferredPrompt(null);
      setIsInstalled(true);
      setInstallStatus('success');
      return true;
    } else {
      setInstallStatus('failed');
      return false;
    }
  };

  return { isInstalled, canInstall: !!deferredPrompt, triggerInstall, installStatus };
}
