import { useState, useCallback } from 'react';

/**
 * Custom hook to manage local loading state for navigation buttons and cards.
 * Provides a slight artificial delay to ensure the user sees the spinner
 * before the instantaneous route change occurs, improving perceived feedback.
 */
export function useNavSpinner() {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  /**
   * Wraps a navigation callback with a spinner state.
   *
   * @param id A unique string identifying which button/card is loading
   * @param callback The function to execute (e.g. `() => navigate('/path')` or `onStartQuiz`)
   * @param delayMs Optional delay in milliseconds (default 200ms)
   */
  const handleNavigation = useCallback((id: string, callback: () => void | Promise<void>, delayMs = 150) => {
    setLoadingId(id);

    // Use a short timeout to show the spinner before executing navigation
    setTimeout(async () => {
      try {
        await callback();
      } finally {
        // Only clear if we haven't navigated away or if it's an in-place action
        // For actual route changes, the component unmounts so it doesn't matter much,
        // but resetting it is good practice.
        setTimeout(() => setLoadingId(null), 100);
      }
    }, delayMs);
  }, []);

  return { loadingId, handleNavigation };
}
