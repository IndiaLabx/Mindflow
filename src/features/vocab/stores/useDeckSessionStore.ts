import { create } from 'zustand';
import { VocabType, DeckState } from '../types';

interface DeckSessionState {
  isActive: boolean;
  deckId: string | null;
  vocabType: VocabType | null;
  words: any[];
  state: DeckState;

  startSession: (vocabType: VocabType, deckId: string, words: any[], initialState?: Partial<DeckState>) => void;
  recordAnswer: (wordId: string, status: 'mastered' | 'tricky' | 'review' | 'clueless' | 'unseen', timeSpentMs: number) => void;
  nextCard: () => void;
  previousCard: () => void;
  toggleMarkForReview: (wordId: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => void;
  resetStore: () => void;
}

const initialDeckState: DeckState = {
  currentQuestionIndex: 0,
  answers: {},
  timeSpent: 0,
  isPaused: false,
  markedForReview: []
};

export const useDeckSessionStore = create<DeckSessionState>((set, get) => ({
  isActive: false,
  deckId: null,
  vocabType: null,
  words: [],
  state: initialDeckState,

  startSession: (vocabType, deckId, words, initialState) => {
    set({
      isActive: true,
      deckId,
      vocabType,
      words,
      state: { ...initialDeckState, ...initialState, isPaused: false }
    });
  },

  recordAnswer: (wordId, status, timeSpentMs) => {
    set((store) => {
      const answers = { ...store.state.answers, [wordId]: status };
      return {
        state: {
          ...store.state,
          answers,
          timeSpent: store.state.timeSpent + timeSpentMs
        }
      };
    });
  },

  nextCard: () => {
    set((store) => ({
      state: {
        ...store.state,
        currentQuestionIndex: Math.min(store.state.currentQuestionIndex + 1, store.words.length - 1)
      }
    }));
  },

  previousCard: () => {
    set((store) => ({
      state: {
        ...store.state,
        currentQuestionIndex: Math.max(store.state.currentQuestionIndex - 1, 0)
      }
    }));
  },

  toggleMarkForReview: (wordId) => {
    set((store) => {
      const isMarked = store.state.markedForReview.includes(wordId);
      const markedForReview = isMarked
        ? store.state.markedForReview.filter(id => id !== wordId)
        : [...store.state.markedForReview, wordId];

      return {
        state: {
          ...store.state,
          markedForReview
        }
      };
    });
  },

  pauseSession: () => {
    set((store) => ({
      state: { ...store.state, isPaused: true }
    }));
  },

  resumeSession: () => {
    set((store) => ({
      state: { ...store.state, isPaused: false }
    }));
  },

  resetStore: () => {
    set({
      isActive: false,
      deckId: null,
      vocabType: null,
      words: [],
      state: initialDeckState
    });
  },

  endSession: () => {
    set({
      isActive: false,
      deckId: null,
      vocabType: null,
      words: [],
      state: initialDeckState
    });
  }
}));
