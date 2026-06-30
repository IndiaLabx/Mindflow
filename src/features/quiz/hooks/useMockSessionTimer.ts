import { useState, useEffect, useRef, useCallback } from 'react';

interface UseMockSessionTimerProps {
  totalTime: number;
  onTimeUp: () => void;
}

export function useMockSessionTimer({ totalTime, onTimeUp }: UseMockSessionTimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const timeLeftRef = useRef(totalTime);
  const currentQuestionTimeRef = useRef(Date.now());
  const workerRef = useRef<Worker | null>(null);

  // Use a stable reference to onTimeUp so it doesn't trigger effect re-runs
  const onTimeUpRef = useRef(onTimeUp);
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (totalTime <= 0) {
        onTimeUpRef.current();
        return;
    }
    setTimeLeft(totalTime);
    timeLeftRef.current = totalTime;
  }, [totalTime]);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../engine/timerWorker.ts', import.meta.url), { type: 'module' });

    workerRef.current.onmessage = (e) => {
        if (e.data === 'TICK') {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    workerRef.current?.postMessage('STOP');
                    onTimeUpRef.current();
                    return 0;
                }
                const newTime = prev - 1;
                timeLeftRef.current = newTime;
                // Individual question time is now tracked via exact ms
                return newTime;
            });
        }
    };

    workerRef.current.postMessage('START');

    return () => {
        workerRef.current?.postMessage('STOP');
        workerRef.current?.terminate();
    };
  }, []); // Empty dependency array ensures worker is only created once

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getAndResetCurrentQuestionTime = useCallback(() => {
    const now = Date.now();
    const timeSpentMs = now - currentQuestionTimeRef.current;
    currentQuestionTimeRef.current = now;
    return timeSpentMs;
  }, []);

  return {
    timeLeft,
    formatTime,
    getAndResetCurrentQuestionTime,
    getCurrentQuestionTimeRef: () => (Date.now() - currentQuestionTimeRef.current)
  };
}
