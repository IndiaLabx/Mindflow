import { useState, useCallback, useEffect } from 'react';
import { db, IdiomInteraction } from '../../../../lib/db';
import { Idiom } from '../../../../features/quiz/types';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export const useIdiomProgress = () => {
  const [interactions, setInteractions] = useState<Record<string, IdiomInteraction>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from IndexedDB
  useEffect(() => {
    const init = async () => {
      try {
        const storedInteractions = await db.getAllIdiomInteractions();
        const interactionsMap: Record<string, IdiomInteraction> = {};
        storedInteractions.forEach(int => interactionsMap[int.idiomId] = int);
        setInteractions(interactionsMap);
      } catch (e) {
        console.error('Failed to load Idiom interactions from DB', e);
      } finally {
        setIsLoaded(true);
      }
    };
    init();
  }, []);

  const updateInteraction = async (idiomId: string, updates: Partial<IdiomInteraction>) => {
      const existing = interactions[idiomId] || { idiomId, known_ows: false };
      const updated: IdiomInteraction = {
          ...existing,
          ...updates,
          lastInteractedAt: new Date().toISOString()
      };

      setInteractions(prev => ({ ...prev, [idiomId]: updated }));

      try {
          await db.saveIdiomInteraction(updated);
      } catch (e) {
          console.error('Failed to save Idiom interaction', e);
      }
  };

  /**
   * Toggles the read status of a specific Idiom.
   */
  const toggleKnownStatus = useCallback(async (wordObj: Idiom) => {
      const currentInteraction = interactions[wordObj.id];
      const isCurrentlyKnown = currentInteraction ? currentInteraction.known_ows : false;
      await updateInteraction(wordObj.id, { known_ows: !isCurrentlyKnown });
  }, [interactions]);

  /**
   * Updates progress via Spatially-Hashed Swipe Algorithm
   */
  const handleSwipe = useCallback(async (wordObj: Idiom, direction: SwipeDirection, velocity: number) => {
    let status: IdiomInteraction['status'] = 'review';
    let reviewDays = 1;

    switch (direction) {
        case 'right': // Mastered
            status = 'mastered';
            reviewDays = 30; // Review in 1 month
            break;
        case 'up': // Tricky
            status = 'tricky';
            reviewDays = 3; // Review soon
            break;
        case 'left': // Review (Default)
            status = 'review';
            reviewDays = 1; // Review tomorrow
            break;
        case 'down': // Clueless
            status = 'clueless';
            reviewDays = 0; // Immediate review
            break;
    }

    const next_review_at = new Date();
    next_review_at.setDate(next_review_at.getDate() + reviewDays);

    await updateInteraction(wordObj.id, {
        status,
        next_review_at: next_review_at.toISOString(),
        swipe_velocity: velocity,
        known_ows: true // Swiping marks it as read implicitly
    });
  }, [interactions]);


  /**
   * Determines the read status of a Idiom object.
   */
  const getKnownStatus = useCallback((wordObj: Idiom): boolean => {
    const idToCheck = wordObj.id;
    if (idToCheck && interactions[idToCheck]) {
        return interactions[idToCheck].known_ows;
    }
    return false;
  }, [interactions]);

  const getInteractionStatus = useCallback((wordObj: Idiom) => {
      const idToCheck = wordObj.id;
      if (idToCheck && interactions[idToCheck]) {
          return interactions[idToCheck].status;
      }
      return undefined;
  }, [interactions]);

  const clearProgress = useCallback(async (mode: 'basic' | 'review') => {
    try {
        await db.clearIdiomInteractionsMode(mode);
        setInteractions(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(key => {
                if (mode === 'basic') {
                    next[key] = { ...next[key], known_ows: false };
                } else {
                    delete next[key].status;
                    delete next[key].next_review_at;
                    delete next[key].swipe_velocity;
                }
            });
            return next;
        });
    } catch (e) {
        console.error('Failed to clear Idiom interactions', e);
    }
  }, []);

  return {
    isLoaded,
    interactions,
    toggleKnownStatus,
    handleSwipe,
    getKnownStatus,
    getInteractionStatus,
    clearProgress
  };
};
