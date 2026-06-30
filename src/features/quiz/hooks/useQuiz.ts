import { useCallback, useEffect, useState, useRef } from 'react';
import { useSyncStore } from '../stores/useSyncStore';
import { useAnalyticsStore } from '../stores/useAnalyticsStore';
import { logEvent } from '../services/analyticsService';
import { APP_CONFIG } from '../../../constants/config';
import { useQuizSessionStore, triggerCloudReconciliation } from '../stores/useQuizSessionStore';
import { Question, InitialFilters, QuizMode, Idiom, OneWord, SynonymWord, QuizRuntimeState, QuizHistoryRecord, SubjectStats } from '../types';
import { db } from '../../../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../../lib/supabase';

/**
 * Custom hook to manage the global quiz application state.
 *
 * This hook acts as the central controller for the application logic. It proxies to `useQuizSessionStore`
 * to maintain 100% backward compatibility for all consuming components, while migrating the internal state
 * from `useReducer` to `Zustand`.
 *
 * @returns {object} An object containing the current `state`, derived properties (like `currentQuestion`), and action methods.
 */
export const useQuiz = () => {
  const [isReviewMode, setIsReviewMode] = useState(false);

  // Directly bind state and actions from the Zustand store
  const state = useQuizSessionStore();

  const flushSync = useCallback(() => {
    // flushSync is now fully replaced by the single-writer architecture in useQuizSessionStore.
    // It's kept here as a no-op to prevent breaking existing components that call it,
    // though the store's persistentSet now handles immediate DB + queued Cloud pushes for every mutation.
  }, []);


  // Persistence Effect: Stable Ref-Driven Sync Loop (Layer 3)
  const latestStateRef = useRef(state);

  // Update refs on every render (no effect dependencies needed for this)
  useEffect(() => {
      latestStateRef.current = state;
  });

  useEffect(() => {
      let intervalId: NodeJS.Timeout;

      const reconcileWithCloud = (source: string, isKeepAlive = false) => {
          const currentState = latestStateRef.current;
          // Hook into the single writer queue directly
          triggerCloudReconciliation(currentState, useQuizSessionStore.setState, source, isKeepAlive);
      };

      // 1. Stable Heartbeat (Layer 3 Periodic Sweep)
      // Checks for desyncs every 15 seconds (reduced from 3 seconds since Layer 2 handles immediate writes)
      intervalId = setInterval(() => {
          reconcileWithCloud('periodic_reconciliation', false);
      }, 15000);

      // 2. Ironclad Safety Nets using refs (immune to stale closures)
      const handleBeforeUnload = (e: BeforeUnloadEvent) => { reconcileWithCloud(e ? e.type : 'visibilitychange', true); };

      const handleVisibilityChange = () => { if (document.visibilityState === 'hidden') { reconcileWithCloud('visibilitychange', true); } };

      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
          clearInterval(intervalId);
          window.removeEventListener('beforeunload', handleBeforeUnload);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
  }, []); // Empty dependency array: Mounts EXACTLY ONCE.


  // Wrap startQuiz to include analytics
  const startQuiz = useCallback((filteredQuestions: Question[], filters: InitialFilters, mode: QuizMode = 'learning', quizId?: string, quizName?: string) => {
    logEvent('quiz_started', {
      subject: filters.subject,
      difficulty: filters.difficulty,
      question_count: filteredQuestions.length,
      mode: mode
    });
    state.startQuiz(filteredQuestions, filters, mode, quizId, quizName);
  }, [state.startQuiz]);

  // Wrap submitSessionResults to include complex logic previously in useQuiz
  const submitSessionResults = useCallback(async (results: { answers: Record<string, string>, timeTaken: Record<string, number>, score: number, bookmarks: string[] }) => {
    state.setFinalizing();
    // We do not abort ongoing fetches explicitly here because fetch logic is decoupled, but the store status update will stop further autosaves.
    logEvent('quiz_completed', {
      score: results.score,
      total_questions: state.activeQuestions.length,
      mode: state.mode
    });

    const subjectStats: Record<string, SubjectStats> = {};
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalSkipped = 0;
    let totalTimeSpent = 0;

    state.activeQuestions.forEach(q => {
      const subject = q?.subject || q?.classification?.subject || 'Unknown';
      if (!subjectStats[subject]) {
        subjectStats[subject] = { attempted: 0, correct: 0, incorrect: 0, skipped: 0, accuracy: 0 };
      }

      const answer = results.answers[q.id];
      const timeMs = results.timeTaken[q.id] || useAnalyticsStore.getState().timeTaken[q.id] || 0;
      totalTimeSpent += timeMs;

      if (!answer) {
        totalSkipped++;
        subjectStats[subject].skipped++;
      } else {
        subjectStats[subject].attempted++;
        const isCorrect = answer === q.correct;
        if (isCorrect) {
          totalCorrect++;
          subjectStats[subject].correct++;
        } else {
          totalIncorrect++;
          subjectStats[subject].incorrect++;
        }
      }
    });

    Object.keys(subjectStats).forEach(subj => {
      const stats = subjectStats[subj];
      stats.accuracy = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;
    });

    const overallAccuracy = state.activeQuestions.length > 0 ? Math.round((totalCorrect / state.activeQuestions.length) * 100) : 0;

    const difficultyStr = Array.isArray(state.filters?.difficulty)
        ? state.filters.difficulty.join(', ')
        : (state.filters?.difficulty || 'Mixed');

    // Convert total ms to decimal seconds for history storage
    const totalTimeSpentSeconds = totalTimeSpent / 1000;

    const historyRecord: QuizHistoryRecord = {
      id: uuidv4(),
      quiz_id: state.quizId,
      date: Date.now(),
      totalQuestions: state.activeQuestions.length,
      totalCorrect,
      totalIncorrect,
      totalSkipped,
      totalTimeSpent: totalTimeSpentSeconds,
      overallAccuracy,
      difficulty: difficultyStr,
      subjectStats
    };

    // --- ATOMIC PUSH TO SUPABASE VIA RPC ---
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && state.quizId) {

            // Explicit whitelist serialization for Postgres JSONB payload
            const stateWithoutQuestions = {
                status: 'result',
                mode: state.mode,
                score: results.score,
                answers: results.answers,
                timeTaken: results.timeTaken,
                remainingTimes: state.remainingTimes,
                quizTimeRemaining: state.quizTimeRemaining,
                bookmarks: results.bookmarks,
                markedForReview: state.markedForReview,
                hiddenOptions: state.hiddenOptions,
                filters: state.filters,
                isPaused: state.isPaused,
                quizId: state.quizId,
                currentQuestionIndex: state.currentQuestionIndex
            };

            const { data: newHistoryId, error: rpcError } = await supabase.rpc('submit_quiz_session', {
                p_quiz_id: state.quizId,
                p_final_state: stateWithoutQuestions,
                p_total_questions: historyRecord.totalQuestions,
                p_total_correct: historyRecord.totalCorrect,
                p_total_incorrect: historyRecord.totalIncorrect,
                p_total_skipped: historyRecord.totalSkipped,
                p_time_taken: historyRecord.totalTimeSpent,
                p_overall_accuracy: historyRecord.overallAccuracy,
                p_difficulty: historyRecord.difficulty,
                p_subject_stats: historyRecord.subjectStats
            });

            if (rpcError) {
                console.error("Failed atomic quiz submission RPC:", rpcError);
                state.setFinalizeFailed();
                throw new Error(rpcError.message || 'Failed to submit quiz session');
            } else {
                console.log("Atomic submission successful. New history ID:", newHistoryId);
                // Only mark fully completed locally once the server confirms
                state.submitSessionResults(results);
            }
        }
    } catch (err) {
        console.error("[CRITICAL] Finalize Error:", err, "State:", state);
        state.setFinalizeFailed();
        throw err;
    }
  }, [state.activeQuestions, state.mode, state.filters?.difficulty, state.submitSessionResults, state.quizId, state]);

  const currentQuestion = state.activeQuestions[state.currentQuestionIndex];
  const totalQuestions = state.activeQuestions.length;
  const progress = totalQuestions > 0
    ? ((state.currentQuestionIndex + 1) / totalQuestions) * 100
    : 0;

  return {
    isReviewMode,
    setIsReviewMode,
    state,
    currentQuestion,
    totalQuestions,
    progress,
    enterHome: state.enterHome,
    enterConfig: state.enterConfig,
    enterEnglishHome: state.enterEnglishHome,
    enterIdiomsConfig: state.enterIdiomsConfig,
    enterOWSConfig: state.enterOWSConfig,
    enterSynonymsConfig: state.enterSynonymsConfig,
    enterProfile: state.enterProfile,
    enterLogin: state.enterLogin,
    goToIntro: state.goToIntro,
    startQuiz,
    submitSessionResults,
    answerQuestion: state.answerQuestion,
    logTimeSpent: state.logTimeSpent,
    saveTimer: state.saveTimer,
    syncGlobalTimer: state.syncGlobalTimer,
    nextQuestion: state.nextQuestion,
    prevQuestion: state.prevQuestion,
    jumpToQuestion: state.jumpToQuestion,
    toggleBookmark: state.toggleBookmark,
    toggleReview: state.toggleReview,
    useFiftyFifty: state.useFiftyFifty,
    pauseQuiz: state.pauseQuiz,
    resumeQuiz: state.resumeQuiz,
    finishQuiz: state.finishQuiz,
    restartQuiz: state.restartQuiz,
    goHome: state.goHome,
    loadSavedQuiz: state.loadSavedQuiz,
    reorderActiveQuestions: state.reorderActiveQuestions
  };
};
