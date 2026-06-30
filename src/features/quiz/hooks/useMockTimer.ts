import { useState, useEffect, useRef } from 'react';

/**
 * Props for the useMockTimer hook.
 */
interface UseMockTimerProps {
  /** The total duration of the quiz in seconds. */
  totalTime: number;
  /** Callback fired when the timer reaches zero. */
  onTimeUp: () => void;
  /** Optional callback fired on every second tick. */
  onTick?: (timeLeft: number) => void;
}

/**
 * Custom hook for managing a global session countdown timer (Mock Mode).
 *
 * UPGRADED: Now uses a Web Worker to prevent browser throttling when the tab is inactive!
 *
 * @param {UseMockTimerProps} props - The hook configuration.
 * @returns {object} Timer state and helper functions.
 */
export function useMockTimer({
  totalTime,
  onTimeUp,
  onTick
}: UseMockTimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const timeLeftRef = useRef(totalTime);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // If we start with 0 or less, finish immediately
    if (totalTime <= 0) {
        onTimeUp();
        return;
    }
    setTimeLeft(totalTime);
    timeLeftRef.current = totalTime;
  }, [totalTime]);

  useEffect(() => {
    // Initialize Web Worker
    workerRef.current = new Worker(new URL('../engine/timerWorker.ts', import.meta.url), { type: 'module' });

    workerRef.current.onmessage = (e) => {
        if (e.data === 'TICK') {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    workerRef.current?.postMessage('STOP');
                    onTimeUp();
                    return 0;
                }
                const newTime = prev - 1;
                timeLeftRef.current = newTime;
                onTick?.(newTime);
                return newTime;
            });
        }
    };

    // Start Worker Timer
    workerRef.current.postMessage('START');

    return () => {
        workerRef.current?.postMessage('STOP');
        workerRef.current?.terminate();
    };
  }, [onTimeUp, onTick]);

  /**
   * Formats seconds into M:SS string.
   */
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return {
    timeLeft,
    formatTime
  };
}
