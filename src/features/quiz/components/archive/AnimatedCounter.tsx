import React, { useEffect, useState } from 'react';

/**
 * A component that displays a number which increments from 0 to the target value.
 *
 * Provides a visual "counting up" animation.
 *
 * @param {object} props - The component props.
 * @param {number} props.value - The final target number to display.
 * @param {number} [props.duration=1500] - The total duration of the animation in milliseconds.
 * @returns {JSX.Element} The rendered counter span.
 */
export const AnimatedCounter = ({ value, duration = 1500 }: { value: number, duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    const totalMilSec = duration;
    // Calculate timer interval based on value size and duration
    // Ensures animation finishes roughly within 'duration'
    const incrementTime = (totalMilSec / end) * 1;

    let timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === end) clearInterval(timer);
    }, Math.max(incrementTime, 10)); // Cap speed at 10ms for smoothness/performance

    // Fallback for very large numbers or lag to ensure it finishes exactly on target
    const cleanup = setTimeout(() => {
        setCount(end);
        clearInterval(timer);
    }, duration);

    return () => {
        clearInterval(timer);
        clearTimeout(cleanup);
    };
  }, [value, duration]);

  return <span>{count}</span>;
};
