import { useState, useCallback, useEffect } from 'react';
import { db, OWSInteraction } from '../../../../lib/db';
import { OneWord } from '../../../../types/models';

export const useOWSProgress = () => {
  const [interactions, setInteractions] = useState<Record<string, OWSInteraction>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from IndexedDB
  useEffect(() => {
    const init = async () => {
      try {
        const storedInteractions = await db.getAllOWSInteractions();
        const interactionsMap: Record<string, OWSInteraction> = {};
        storedInteractions.forEach(int => interactionsMap[int.wordId] = int);
        setInteractions(interactionsMap);
      } catch (e) {
        console.error('Failed to load OWS interactions from DB', e);
      } finally {
        setIsLoaded(true);
      }
    };
    init();
  }, []);

  const updateInteraction = async (wordId: string, known_ows: boolean) => {
      const updated: OWSInteraction = {
          wordId,
          known_ows,
          lastInteractedAt: new Date().toISOString()
      };

      setInteractions(prev => ({ ...prev, [wordId]: updated }));

      try {
          await db.saveOWSInteraction(updated);
      } catch (e) {
          console.error('Failed to save OWS interaction', e);
      }
  };

  /**
   * Toggles the read status of a specific OWS word.
   */
  const toggleKnownStatus = useCallback(async (wordObj: OneWord) => {
      const currentInteraction = interactions[wordObj.id];
      const isCurrentlyKnown = currentInteraction ? currentInteraction.known_ows : false;
      await updateInteraction(wordObj.id, !isCurrentlyKnown);
  }, [interactions]);

  /**
   * Determines the read status of a word object.
   */
  const getKnownStatus = useCallback((wordObj: OneWord): boolean => {
    const idToCheck = wordObj.id;
    if (idToCheck && interactions[idToCheck]) {
        return interactions[idToCheck].known_ows;
    }
    return false;
  }, [interactions]);

  const clearProgress = useCallback(async (mode: 'basic' | 'review') => {
    try {
        await db.clearOWSInteractionsMode(mode);
        // Also update local React state based on mode
        setInteractions(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(key => {
                if (mode === 'basic') {
                    next[key] = { ...next[key], known_ows: false };
                } else {
                    // Review mode uses Deck mode fields, but OWSInteraction type doesn't have status yet, we will update it in db.ts
                    const item: any = next[key];
                    if (item) {
                       delete item.status;
                       delete item.next_review_at;
                       delete item.swipe_velocity;
                       next[key] = item;
                    }
                }
            });
            return next;
        });
    } catch (e) {
        console.error('Failed to clear OWS interactions', e);
    }
  }, []);

  return {
    isLoaded,
    interactions,
    toggleKnownStatus,
    getKnownStatus,
    clearProgress
  };
};
