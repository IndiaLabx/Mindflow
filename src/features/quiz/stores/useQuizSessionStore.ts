import { useNotificationStore } from '../../../stores/useNotificationStore';
import { db } from '../../../lib/db';
import { syncService } from '../../../lib/syncService';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../lib/supabase';
import { create } from 'zustand';
import { APP_CONFIG } from '../../../constants/config';
import { QuizRuntimeState, QuizPersistentState, QuizStatus, QuizMode, Question, InitialFilters } from '../types';
import { fetchWithTimeout } from '../../../lib/fetchWithTimeout';

interface QuizSessionState extends QuizRuntimeState {
  toggleToolbar: () => void;
  // Actions
  enterHome: () => Promise<void>;
  enterConfig: () => void;
  enterBlueprints: () => void;
  enterEnglishHome: () => void;
  enterIdiomsConfig: () => void;
  enterSynonymsConfig: () => void;
  enterOWSConfig: () => void;
  enterProfile: () => void;
  enterLogin: () => void;
  goToIntro: () => void;
  startQuiz: (questions: Question[], filters: InitialFilters, mode: QuizMode, quizId?: string, quizName?: string) => void;
  answerQuestion: (questionId: string, answer: string, timeTaken: number) => void;
  logTimeSpent: (questionId: string, timeTaken: number) => void;
  saveTimer: (questionId: string, time: number) => void;
  syncGlobalTimer: (time: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  jumpToQuestion: (index: number) => void;
  toggleBookmark: (questionId: string) => void;
  toggleReview: (questionId: string) => void;
  useFiftyFifty: (questionId: string, hiddenOptions: string[]) => void;
  pauseQuiz: (questionId?: string, remainingTime?: number) => void;
  resumeQuiz: () => void;
  finishQuiz: () => void;
  setFinalizing: () => void;
  setFinalizeFailed: () => void;
  submitSessionResults: (results: { answers: Record<string, string>; timeTaken: Record<string, number>; score: number; bookmarks: string[] }) => void;
  restartQuiz: () => void;
  goHome: () => Promise<void>;
  loadSavedQuiz: (savedState: QuizRuntimeState) => void;
  reorderActiveQuestions: (newOrder: Question[]) => void;
  resetStore: () => void;
  hydrateQuestions: (hydratedQuestions: Question[]) => void;
}

export const initialState: QuizRuntimeState = {
  status: 'intro',
  mode: 'learning',
  currentQuestionIndex: 0,
  score: 0,
  answers: {},
  timeTaken: {},
  remainingTimes: {},
  quizTimeRemaining: 0,
  bookmarks: [],
  markedForReview: [],
  hiddenOptions: {},
  activeQuestions: [],
  filters: undefined,
  isPaused: false,
  isToolbarExpanded: true,
  syncStatus: 'idle',
};


// SINGLE CLOUD WRITER ARCHITECTURE (Layer 2)
let isWriterRunning = false;
let pendingDirty = false;
let lastFlushErrorTime = 0;
const isDev = import.meta.env.DEV;

// Centralized sync orchestrator that guarantees:
// 1. Only ONE upload in flight at any time.
// 2. If mutations occur during upload, it loops and pushes the freshest state immediately after.
const enqueueCloudSync = async (state: QuizRuntimeState, set: any, source: string = 'mutation', isKeepAlive = false) => {
    if (typeof window === 'undefined' || !state.quizId || state.status !== 'quiz') return;
    if (!navigator.onLine) {
        set({ syncStatus: 'offline_pending' });
        return; // Layer 1 (IndexedDB) already saved it, we'll reconcile later.
    }

    if (isWriterRunning) {
        pendingDirty = true;
        if (isDev) console.log(`[SYNC_QUEUED] [${source}] Mutation while sync active. Marking dirty.`);
        return;
    }

    isWriterRunning = true;

    try {
        do {
            pendingDirty = false; // Reset before we capture state
            const syncId = Math.random().toString(36).substring(7);
            if (isDev) console.log(`[SYNC_START] [${source}] ID: ${syncId} time: ${performance.now()}`);
            set({ syncStatus: 'syncing' });

            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) break;

            const token = session.access_token;
            const headers = new Headers();
            headers.append("apikey", SUPABASE_ANON_KEY);
            headers.append("Authorization", `Bearer ${token}`);
            headers.append("Content-Type", "application/json");

            // Strip functions and heavy activeQuestions array
            const stateToSave = { ...state };
            Object.keys(stateToSave).forEach(key => {
                if (typeof (stateToSave as any)[key] === 'function') {
                    delete (stateToSave as any)[key];
                }
            });
            const { activeQuestions, ...stateWithoutQuestions } = stateToSave;

            const endpoint = `${SUPABASE_URL}/rest/v1/saved_quizzes?id=eq.${state.quizId}`;

            try {
                if (isKeepAlive) {
                    fetchWithTimeout(endpoint, {
                        method: 'PATCH',
                        headers: headers,
                        body: JSON.stringify({ state: stateWithoutQuestions }),
                        keepalive: true
                    }).catch(() => {});
                } else {
                    await fetchWithTimeout(endpoint, {
                        method: 'PATCH',
                        headers: headers,
                        body: JSON.stringify({ state: stateWithoutQuestions })
                    });
                }
                set({ syncStatus: 'synced' });
                if (isDev) console.log(`[SYNC_SUCCESS] [${source}] ID: ${syncId}`);
            } catch (networkErr: any) {
                // If it fails, mark it dirty so it retries, and break the loop to avoid infinite failure spins
                pendingDirty = true;
                throw networkErr;
            }

        } while (pendingDirty);

    } catch (err: any) {
        console.error(`[QUIZ_SYNC_ERROR] [${source}]`, err);
        set({ syncStatus: 'sync_failed' });

        const now = Date.now();
        if (now - lastFlushErrorTime > 30000) {
            lastFlushErrorTime = now;
            useNotificationStore.getState().showToast({
                variant: 'error',
                message: 'Background sync failed. Retrying automatically...'
            });
        }
    } finally {
        isWriterRunning = false;
    }
};

// Exported trigger for useQuiz.ts (Layer 3 reconciler) to hook into the single writer
export const triggerCloudReconciliation = (state: QuizRuntimeState, set: any, source: string, isKeepAlive = false) => {
    // Only queue if not already running (or if it is running, let it run, it will pick up latest state).
    // Reconciliation is just another mutation conceptually.
    pendingDirty = true;
    enqueueCloudSync(state, set, source, isKeepAlive);
}


const persistentSet = (zustandSet: any, get: any, partial: any, replace?: boolean | undefined) => {
    const newStateOrFn = partial;

    const interceptedSetPayload = typeof newStateOrFn === 'function' ? (state: any) => {
        const result = newStateOrFn(state);
        return result ? { ...result, last_updated: Date.now() } : result;
    } : { ...newStateOrFn, last_updated: Date.now() };

    zustandSet(interceptedSetPayload, replace);

    const currentState = get();
    if (currentState.quizId && currentState.status === 'quiz') {

        // LAYER 1: Immediate Local Persistence (IndexedDB)
        const stateToSave = { ...currentState };
        delete (stateToSave as any).activeQuestions; // Protect virtual pagination
        Object.keys(stateToSave).forEach(key => {
            if (typeof (stateToSave as any)[key] === 'function') {
                delete (stateToSave as any)[key];
            }
        });

        // Fire and forget IndexedDB write (fast, local)
        db.updateQuizProgress(currentState.quizId, stateToSave).catch((err: any) => {
            console.error("Failed Layer 1 IndexedDB commit:", err);
        });

        // LAYER 2: Near-Immediate Cloud Durability (Single Writer Coalescer)
        // This queues the write. If idle, it starts immediately. If running, it marks dirty and loops.
        enqueueCloudSync(currentState, zustandSet, 'mutation');
    }
};

export const useQuizSessionStore = create<QuizSessionState>((zustandSet, get) => {
  const set: typeof zustandSet = (partial: any, replace?: boolean | undefined) => persistentSet(zustandSet, get, partial, replace);
  return {
  ...initialState,

  hydrateQuestions: (hydratedQuestions) => set((state) => {
    // Merge new hydrated questions into existing activeQuestions
    // We update by id so we don't lose ordering or replace already hydrated ones
    const newActive = [...state.activeQuestions];

    hydratedQuestions.forEach(hq => {
        const index = newActive.findIndex(q => q.id === hq.id);
        if (index !== -1) {
            newActive[index] = hq;
        }
    });

    return { activeQuestions: newActive };
  }),

  resetStore: () => set(initialState),

  enterHome: async () => {
    set({ ...initialState, status: 'idle' });
  },
  enterConfig: () => set({ status: 'config' }),
  enterBlueprints: () => set({ status: 'blueprints' as any }),
  enterEnglishHome: () => set({ status: 'english-home' }),
  enterIdiomsConfig: () => set({ status: 'idioms-config' }),
  enterSynonymsConfig: () => set({ ...initialState, status: 'synonyms-config' }),
  enterOWSConfig: () => set({ status: 'ows-config' }),
  enterProfile: () => set({ status: 'profile' }),
  enterLogin: () => set({ status: 'login' }),
  toggleToolbar: () => set((state) => ({ isToolbarExpanded: !state.isToolbarExpanded })),
  setQuizName: (name: string) => set({ quizName: name }),
  goToIntro: () => set({ ...initialState, status: 'intro' }),

  startQuiz: (questions, filters, mode, quizId, quizName) => {
    const globalTime = (mode === 'mock' || mode === 'god')
      ? Math.max(APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION, questions.length * APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION)
      : 0;

    const resolvedQuizId = quizId || crypto.randomUUID();

    set({
  ...initialState,
  status: 'quiz',
  mode: mode,
  activeQuestions: questions,
  filters: filters,
  quizId: resolvedQuizId,
  quizName: quizName,
  quizTimeRemaining: globalTime,
  remainingTimes: mode === 'learning'
    ? questions.reduce((acc, q) => ({ ...acc, [q.id]: APP_CONFIG.TIMERS.LEARNING_MODE_DEFAULT }), {})
    : {}
});
  },

  answerQuestion: (questionId, answer, timeTaken) => set((state) => {
    const question = state.activeQuestions.find(q => q.id === questionId);
    const isCorrect = question?.correct === answer;
    const prevAnswer = state.answers[questionId];
    let newScore = state.score;

    if (!prevAnswer) {
      if (isCorrect) newScore++;
    } else {
      const wasCorrect = question?.correct === prevAnswer;
      if (wasCorrect && !isCorrect) newScore--;
      if (!wasCorrect && isCorrect) newScore++;
    }

    const prevTime = state.timeTaken[questionId] || 0;

    return {
      answers: { ...state.answers, [questionId]: answer },
      timeTaken: { ...state.timeTaken, [questionId]: prevTime + timeTaken },
      score: newScore,
    };
  }),

  logTimeSpent: (questionId, timeTaken) => set((state) => {
    const prevTime = state.timeTaken[questionId] || 0;
    return {
      timeTaken: { ...state.timeTaken, [questionId]: prevTime + timeTaken }
    };
  }),

  saveTimer: (questionId, time) => set((state) => ({
    remainingTimes: { ...state.remainingTimes, [questionId]: time }
  })),

  syncGlobalTimer: (time) => set({ quizTimeRemaining: time }),

  nextQuestion: () => set((state) => {
    const maxIndex = state.activeQuestions.length;
    const nextIndex = state.currentQuestionIndex + 1;

    if (nextIndex >= maxIndex) {
      return { status: 'result' };
    }
    return { currentQuestionIndex: nextIndex };
  }),

  prevQuestion: () => set((state) => ({
    currentQuestionIndex: Math.max(0, state.currentQuestionIndex - 1)
  })),

  jumpToQuestion: (index) => set({ currentQuestionIndex: index }),

  toggleBookmark: (questionId) => set((state) => {
    const isBookmarked = state.bookmarks.includes(questionId);
    const question = state.activeQuestions.find(q => q.id === questionId);

    if (question) {
      if (isBookmarked) {
        db.removeBookmark(questionId);
      } else {
        db.saveBookmark(question);
      }
    }

    return {
      bookmarks: isBookmarked
        ? state.bookmarks.filter(id => id !== questionId)
        : [...state.bookmarks, questionId]
    };
  }),

  toggleReview: (questionId) => set((state) => {
    const isMarked = state.markedForReview.includes(questionId);
    return {
      markedForReview: isMarked
        ? state.markedForReview.filter(id => id !== questionId)
        : [...state.markedForReview, questionId]
    };
  }),

  useFiftyFifty: (questionId, hiddenOptions) => set((state) => ({
    hiddenOptions: { ...state.hiddenOptions, [questionId]: hiddenOptions }
  })),

  pauseQuiz: (questionId, remainingTime) => set((state) => {
    let newRemainingTimes = state.remainingTimes;
    if (questionId && remainingTime !== undefined) {
      newRemainingTimes = { ...state.remainingTimes, [questionId]: remainingTime };
    }
    return {
      isPaused: true,
      remainingTimes: newRemainingTimes
    };
  }),

  resumeQuiz: () => set({ isPaused: false }),

  finishQuiz: () => { set({ status: 'result' }); },
  setFinalizing: () => set({ status: 'finalizing' }),
  setFinalizeFailed: () => set({ status: 'finalize_failed' }),

  submitSessionResults: (results) => { set((state) => ({ answers: results.answers, timeTaken: Object.keys(results.timeTaken).length > 0 ? results.timeTaken : state.timeTaken, score: results.score, bookmarks: results.bookmarks, status: 'result' })); },


  restartQuiz: () => set((state) => {
    const globalTime = (state.mode === 'mock' || state.mode === 'god')
      ? Math.max(APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION, state.activeQuestions.length * APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION)
      : 0;
    const resolvedQuizId = crypto.randomUUID();
    return {
      ...initialState,
      status: 'quiz',
      mode: state.mode,
      activeQuestions: state.activeQuestions,
      filters: state.filters,
      quizId: resolvedQuizId,
      quizTimeRemaining: globalTime,
      remainingTimes: state.mode === 'learning'
        ? state.activeQuestions.reduce((acc, q) => ({ ...acc, [q.id]: APP_CONFIG.TIMERS.LEARNING_MODE_DEFAULT }), {})
        : {}
    };
  }),

  goHome: async () => {
    set({ ...initialState, status: 'idle' });
  },

  reorderActiveQuestions: (newOrder) => set((state) => {
    const currentQuestion = state.activeQuestions[state.currentQuestionIndex];
    let newIndex = state.currentQuestionIndex;

    if (currentQuestion) {
      const foundIndex = newOrder.findIndex(q => q.id === currentQuestion.id);
      if (foundIndex !== -1) {
        newIndex = foundIndex;
      }
    }

    return {
      activeQuestions: newOrder,
      currentQuestionIndex: newIndex
    };
  }),

  loadSavedQuiz: (savedState) => set((state) => {
    if (savedState.activeQuestions) {
      const uniqueQuestions = Array.from(new Map(savedState.activeQuestions.map(q => [q.id, q])).values());
      return {
          ...savedState,
          activeQuestions: uniqueQuestions,
          quizId: savedState.quizId,
          // Make absolutely sure 'status' maps into active view
          status: savedState.status
      };
    }
    return savedState;
  }),
} });
