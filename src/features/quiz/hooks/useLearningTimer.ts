import { useState, useEffect, useRef } from 'react';

/**
 * Props for the useLearningTimer hook.
 */
interface UseLearningTimerProps {
  /** The initial time in seconds for the countdown. */
  initialTime: number;
  /** Unique identifier for the current question. Changing this resets the timer. */
  questionId: string;
  /** Whether the timer is currently paused. */
  isPaused: boolean;
  /** Callback fired when the timer reaches zero. */
  onTimeUp: () => void;
  /** Optional callback fired on every second tick. */
  onTick?: (timeLeft: number) => void;
}

/**
 * Custom hook for managing a per-question countdown timer (Learning Mode).
 *
 * It resets automatically when the `questionId` changes.
 * It respects the `isPaused` state.
 *
 * @param {UseLearningTimerProps} props - The hook configuration.
 * @returns {object} Timer state and helper functions.
 */
export function useLearningTimer({
  initialTime,
  questionId,
  isPaused,
  onTimeUp,
  onTick
}: UseLearningTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const timeLeftRef = useRef(initialTime);

  // Reset timer when switching to a new question or if initialTime updates
  useEffect(() => {
    setTimeLeft(initialTime);
    timeLeftRef.current = initialTime;
  }, [initialTime, questionId]);

  // Timer interval logic
  useEffect(() => {
    if (isPaused) {
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(intervalId);
          onTimeUp();
          return 0;
        }
        const newTime = prev - 1;
        timeLeftRef.current = newTime;
        onTick?.(newTime);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isPaused, onTimeUp, onTick]);

  /**
   * Formats seconds into MM:SS string.
   * @param {number} seconds
   * @returns {string} formatted string (e.g. "01:30")
   */
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return {
    timeLeft,
    timeLeftRef,
    formatTime
  };
}
