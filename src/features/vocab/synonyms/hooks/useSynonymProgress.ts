import { useState, useCallback, useEffect } from 'react';
import { SynonymWord } from '../../../../features/quiz/types';
import { db, SynonymInteraction } from '../../../../lib/db';

const STORAGE_KEY = 'mindflow_synonym_progress_v2'; // Legacy local storage key

export const useSynonymProgress = () => {
  const [interactions, setInteractions] = useState<Record<string, SynonymInteraction>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from IndexedDB
  useEffect(() => {
    const init = async () => {
      try {
        const storedInteractions = await db.getAllSynonymInteractions();

        // Migrate legacy data if DB is empty
        if (storedInteractions.length === 0) {
            const legacyData = localStorage.getItem(STORAGE_KEY);
            if (legacyData) {
                const parsed = JSON.parse(legacyData);
                for (const wordId of Object.keys(parsed.mastered || {})) {
                    await db.saveSynonymInteraction({
                        wordId,
                        wordString: '',
                        masteryLevel: 'mastered',
                        lastInteractedAt: new Date().toISOString()
                    });
                }
                for (const wordStr of Object.keys(parsed.familiar || {})) {
                    await db.saveSynonymInteraction({
                        wordId: `legacy-familiar-${wordStr}`,
                        wordString: wordStr,
                        masteryLevel: 'familiar',
                        lastInteractedAt: new Date().toISOString()
                    });
                }
                // Refresh after migration
                const refreshed = await db.getAllSynonymInteractions();
                const interactionsMap: Record<string, SynonymInteraction> = {};
                refreshed.forEach(int => interactionsMap[int.wordId] = int);
                setInteractions(interactionsMap);
            }
        } else {
            const interactionsMap: Record<string, SynonymInteraction> = {};
            storedInteractions.forEach(int => interactionsMap[int.wordId] = int);
            setInteractions(interactionsMap);
        }
      } catch (e) {
        console.error('Failed to load synonym interactions from DB', e);
      } finally {
        setIsLoaded(true);
      }
    };
    init();
  }, []);

  const updateInteraction = async (wordId: string, wordString: string, updates: Partial<SynonymInteraction>) => {
      const existing = interactions[wordId] || {
          wordId,
          wordString,
          masteryLevel: 'new',
          lastInteractedAt: new Date().toISOString()
      };
      const updated = { ...existing, ...updates, lastInteractedAt: new Date().toISOString() };

      setInteractions(prev => ({ ...prev, [wordId]: updated }));

      try {
          await db.saveSynonymInteraction(updated);
      } catch (e) {
          console.error('Failed to save synonym interaction', e);
      }
  };

  /**
   * Marks a specific word as mastered and ALL OTHER words in its cluster as familiar.
   */
  const markMastered = useCallback(async (wordObj: SynonymWord, clusterWords: string[] = []) => {
      await updateInteraction(wordObj.id, wordObj.word, { masteryLevel: 'mastered' });

      for (const syn of wordObj.synonyms || []) {
          // Fallback ID for missing IDs from text-only synonyms
          await updateInteraction(`syn-${syn.text}`, syn.text, { masteryLevel: 'familiar' });
      }

      for (const wordStr of clusterWords) {
          await updateInteraction(`cluster-${wordStr}`, wordStr, { masteryLevel: 'familiar' });
      }
  }, [interactions]);

  const markExplanationViewed = useCallback(async (wordObj: SynonymWord) => {
      await updateInteraction(wordObj.id, wordObj.word, { viewedExplanation: true });
  }, [interactions]);

  const markWordFamilyViewed = useCallback(async (wordObj: SynonymWord) => {
      await updateInteraction(wordObj.id, wordObj.word, { viewedWordFamily: true });
  }, [interactions]);

  const updateScores = useCallback(async (wordObj: SynonymWord, scores: { daily?: number, gamification?: number }) => {
      const updates: Partial<SynonymInteraction> = {};
      if (scores.daily !== undefined) updates.dailyChallengeScore = scores.daily;
      if (scores.gamification !== undefined) updates.gamificationScore = scores.gamification;

      await updateInteraction(wordObj.id, wordObj.word, updates);
  }, [interactions]);


  /**
   * Determines the status of a word object or string.
   */
  const getStatus = useCallback((wordObjOrStr: SynonymWord | string, wordId?: string): 'mastered' | 'familiar' | 'new' => {
    let normalizedStr = '';
    let idToCheck = wordId;

    if (typeof wordObjOrStr === 'string') {
       normalizedStr = wordObjOrStr.toLowerCase().trim();
    } else {
       normalizedStr = wordObjOrStr.word.toLowerCase().trim();
       idToCheck = wordObjOrStr.id;
    }

    if (idToCheck && interactions[idToCheck]) {
        return interactions[idToCheck].masteryLevel;
    }

    // Fallback check for string-based familiar/legacy records
    for (const key in interactions) {
        if (interactions[key].wordString.toLowerCase().trim() === normalizedStr) {
            return interactions[key].masteryLevel;
        }
    }

    return 'new';
  }, [interactions]);

  const clearProgress = useCallback(async (mode: 'basic' | 'review') => {
    try {
        await db.clearSynonymInteractionsMode(mode);
        // Refresh local state completely
        const refreshed = await db.getAllSynonymInteractions();
        const interactionsMap: Record<string, SynonymInteraction> = {};
        refreshed.forEach((int) => {
            interactionsMap[int.wordId] = int;
        });
        setInteractions(interactionsMap);
    } catch (e) {
        console.error('Failed to clear synonym interactions mode', e);
    }
  }, []);

  return {
    isLoaded,
    interactions,
    markMastered,
    markExplanationViewed,
    markWordFamilyViewed,
    updateScores,
    getStatus,
    clearProgress
  };
};
