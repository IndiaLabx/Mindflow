import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to implement a countdown timer.
 *
 * The timer counts down from a specified duration. It can be paused, reset,
 * and triggers a callback when the time expires. The timer resets automatically
 * when the `key` prop changes (useful for resetting on new questions).
 *
 * @param {object} props - The hook properties.
 * @param {number} props.duration - The duration of the timer in seconds.
 * @param {() => void} props.onTimeUp - Callback function executed when the timer reaches zero.
 * @param {any} props.key - A value that, when changed, causes the timer to reset (e.g., current question index).
 * @param {boolean} props.isPaused - If true, the timer is paused.
 * @returns {[number, () => void]} A tuple containing the remaining seconds and a manual reset function.
 */
export function useTimer({ duration, onTimeUp, key, isPaused }: { duration: number; onTimeUp: () => void; key: any; isPaused: boolean; }): [number, () => void] {
    const [secondsLeft, setSecondsLeft] = useState(duration);
    const intervalRef = useRef<number | null>(null);

    const resetTimer = () => {
        setSecondsLeft(duration);
    };

    useEffect(() => {
        if (isPaused) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        resetTimer();

        intervalRef.current = window.setInterval(() => {
            setSecondsLeft(prevSeconds => {
                if (prevSeconds <= 1) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    onTimeUp();
                    return 0;
                }
                return prevSeconds - 1;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [key, duration, isPaused, onTimeUp]);

    return [secondsLeft, resetTimer];
}
