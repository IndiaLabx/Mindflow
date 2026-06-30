import React, { useEffect, useState } from 'react';
import { cn } from '../../../../utils/cn';

/**
 * Props for the DonutChart component.
 */
interface DonutChartProps {
  /** Count of correct answers. */
  correct: number;
  /** Count of incorrect answers. */
  incorrect: number;
  /** Count of unanswered questions. */
  unanswered: number;
  /** Diameter of the chart in pixels. Defaults to 160. */
  size?: number;
}

/**
 * A circular chart visualizing the breakdown of quiz results (Correct, Incorrect, Unanswered).
 *
 * Uses SVG circles with `stroke-dasharray` to create the segments.
 * Features a mount animation.
 *
 * @param {DonutChartProps} props - The component props.
 * @returns {JSX.Element | null} The rendered SVG chart or null if total is 0.
 */
export const DonutChart: React.FC<DonutChartProps> = ({ 
  correct, 
  incorrect, 
  unanswered, 
  size = 160 
}) => {
  const [animatedCorrect, setAnimatedCorrect] = useState(0);
  const [animatedIncorrect, setAnimatedIncorrect] = useState(0);

  const total = correct + incorrect + unanswered;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    // Trigger animation after mount for visual effect
    const timer = setTimeout(() => {
      setAnimatedCorrect(correct);
      setAnimatedIncorrect(incorrect);
    }, 300);
    return () => clearTimeout(timer);
  }, [correct, incorrect]);

  if (total === 0) return null;

  // Calculate Stroke Lengths based on proportion of circumference
  const correctStroke = (animatedCorrect / total) * circumference;
  const incorrectStroke = (animatedIncorrect / total) * circumference;
  
  // Calculate Rotation Offsets to stack segments
  // 1. Correct starts at -90deg (12 o'clock)
  // 2. Incorrect starts after Correct ends. 
  //    Rotation = -90 + (correct / total * 360)
  const incorrectRotation = -90 + (correct / total) * 360;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Background Circle (Track - Unanswered area essentially) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="#f3f4f6" // gray-100
          strokeWidth={strokeWidth}
        />
        
        {/* Correct Segment (Green) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="#22c55e" // green-500
          strokeWidth={strokeWidth}
          strokeDasharray={`${correctStroke} ${circumference}`}
          strokeLinecap="round"
          className="transition-all duration-[1500ms] ease-out origin-center transform -rotate-90"
        />

        {/* Incorrect Segment (Red) */}
        {/* Rotated so it starts exactly where the green segment ends */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="#ef4444" // red-500
          strokeWidth={strokeWidth}
          strokeDasharray={`${incorrectStroke} ${circumference}`}
          strokeLinecap="round"
          className="transition-all duration-[1500ms] ease-out origin-center"
          style={{ transform: `rotate(${incorrectRotation}deg)` }}
        />
      </svg>
    </div>
  );
};
