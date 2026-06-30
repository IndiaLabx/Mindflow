import { useState, useEffect, useCallback, useRef } from 'react';
import { useTimer } from '../../../hooks/useTimer';
import { QuizMode } from '../types';
import { APP_CONFIG } from '../../../constants/config';

/**
 * Props for the useQuizSessionTimer hook.
 */
interface UseQuizSessionTimerProps {
  /** The current quiz mode. */
  mode: QuizMode;
  /** ID of the current question. */
  questionId: string;
  /** Whether the current question has been answered. */
  isAnswered: boolean;
  /** Remaining time for the current question (Learning Mode). */
  remainingTime: number;
  /** Total remaining time for the entire quiz (Mock Mode). */
  globalTimeRemaining: number;
  /** Total number of questions (for calculating default mock duration). */
  totalQuestions: number;
  /** Callback fired when the timer expires (finish quiz or question). */
  onFinish: () => void;
  /** Callback to save the per-question timer state (Learning Mode). */
  onSaveTime: (questionId: string, time: number) => void;
  /** Callback to sync the global timer state (Mock Mode). */
  onSyncGlobalTimer: (time: number) => void;
  /** Callback to log time spent on a question (Mock Mode analytics). */
  onLogTime: (questionId: string, time: number) => void;
  /** Optional callback for tick sound effects (e.g. last 5 seconds). */
  onTick?: () => void;
}

/**
 * A complex hook that orchestrates timing logic for both Learning and Mock modes.
 *
 * - Learning Mode: Manages a countdown timer that resets for each question. Pauses when answered.
 * - Mock Mode: Manages a global countdown timer for the whole session. Also runs a stopwatch per question for analytics.
 *
 * Handles synchronization with the global Redux-like store to preserve state across navigation.
 *
 * @param {UseQuizSessionTimerProps} props - The hook configuration.
 * @returns {object} Timer values and format helpers.
 */
export function useQuizSessionTimer({
  mode,
  questionId,
  isAnswered,
  remainingTime,
  globalTimeRemaining,
  totalQuestions,
  onFinish,
  onSaveTime,
  onSyncGlobalTimer,
  onLogTime,
  onTick
}: UseQuizSessionTimerProps) {
  const isMockMode = mode === 'mock';
  
  // Mock Mode: Question Stopwatch (Count up from 0) to track time spent per question for stats
  const [questionTimeElapsed, setQuestionTimeElapsed] = useState(0);
  const questionTimeRef = useRef(0); 

  // 1. Learning Mode Timer (Per Question Countdown)
  const handleLearningTimerComplete = useCallback(() => {
     if (!isMockMode) {
         onFinish(); // Auto-submit or move next? Usually treated as timeout -> wrong/unanswered
     }
  }, [isMockMode, onFinish]);

  const [secondsLeftLearning] = useTimer({
    duration: remainingTime ?? APP_CONFIG.TIMERS.LEARNING_MODE_DEFAULT,
    onTimeUp: handleLearningTimerComplete,
    key: questionId, // Resets when question changes
    isPaused: isAnswered || isMockMode
  });

  // Sound Effect Logic for Learning Mode (Last 5 seconds)
  useEffect(() => {
      if (!isMockMode && !isAnswered && secondsLeftLearning <= 5 && secondsLeftLearning > 0) {
          onTick?.();
      }
  }, [secondsLeftLearning, isMockMode, isAnswered, onTick]);

  // Ref to hold the current seconds left to avoid dependency loops in cleanup
  const secondsLeftRef = useRef(secondsLeftLearning);
  
  // Keep ref in sync
  useEffect(() => {
    secondsLeftRef.current = secondsLeftLearning;
  }, [secondsLeftLearning]);

  // Exact time tracking for Learning Mode
  const learningStartTimeRef = useRef(Date.now());
  useEffect(() => {
    if (!isMockMode) {
      learningStartTimeRef.current = Date.now();
    }
  }, [questionId, isMockMode]);

  // 2. Mock Mode Timer (Global Countdown)
  const [secondsLeftMock] = useTimer({
    duration: globalTimeRemaining > 0 ? globalTimeRemaining : totalQuestions * APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION,
    onTimeUp: onFinish,
    key: 'global-mock-timer', 
    isPaused: !isMockMode || (globalTimeRemaining <= 0)
  });

  // Ref for Mock Timer to prevent re-render loops when syncing to store
  const secondsLeftMockRef = useRef(secondsLeftMock);
  useEffect(() => {
    secondsLeftMockRef.current = secondsLeftMock;
  }, [secondsLeftMock]);

  // 3. Mock Mode Question Stopwatch (Exact ms Tracking)
  useEffect(() => {
    setQuestionTimeElapsed(0);
    questionTimeRef.current = 0;
    const startTime = Date.now();

    // Visual timer update only
    const interval = setInterval(() => {
      const elapsedMs = Date.now() - startTime;
      setQuestionTimeElapsed(elapsedMs);
      questionTimeRef.current = elapsedMs;
    }, 1000);

    return () => {
      clearInterval(interval);
      // Calculate exact ms on unmount
      const finalElapsedMs = Date.now() - startTime;
      // When leaving a question in mock mode (unmount or id change), log the precise time spent
      if (isMockMode && finalElapsedMs > 0) {
        onLogTime(questionId, finalElapsedMs);
      }
    };
  }, [questionId, isMockMode, onLogTime]);

  // Sync timers back to state (Learning Mode)
  useEffect(() => {
      return () => {
          if (!isMockMode && !isAnswered) {
              // Use ref to get latest value without triggering re-render loop
              onSaveTime(questionId, secondsLeftRef.current);

              // Also log exact time spent if needed here, but usually learning mode
              // saves exact time at the moment of answering via the UI calling answerQuestion
          }
      };
  }, [questionId, isMockMode, isAnswered, onSaveTime]);

  // Sync Global Timer (Mock Mode) occasionally
  useEffect(() => {
      if (isMockMode) {
          const interval = setInterval(() => {
              // Use Ref to get current time without adding it to dependencies
              // This prevents the effect from re-running every second
              onSyncGlobalTimer(secondsLeftMockRef.current);
          }, 5000);
          
          return () => {
              clearInterval(interval);
              if (secondsLeftMockRef.current > 0) {
                  onSyncGlobalTimer(secondsLeftMockRef.current);
              }
          }
      }
  }, [isMockMode, onSyncGlobalTimer]);

  /**
   * Helper to format seconds.
   */
  const formatTime = (s: number) => {
      const mins = Math.floor(s / 60);
      const secs = s % 60;
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return {
    secondsLeftLearning,
    secondsLeftMock,
    questionTimeElapsed,
    formatTime
  };
}
