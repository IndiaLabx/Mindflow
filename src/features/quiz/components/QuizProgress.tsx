import React from 'react';

/**
 * Props for the QuizProgress component.
 */
interface QuizProgressProps {
  /** Current question number (1-based). */
  current: number;
  /** Total number of questions. */
  total: number;
  /** Percentage of completion (0-100). */
  progress: number;
}

/**
 * A standard progress bar with text labels.
 *
 * Shows "Question X of Y" and percentage completed.
 * Used in older/alternate layouts or mobile views where explicit text is helpful.
 *
 * @param {QuizProgressProps} props - The component props.
 * @returns {JSX.Element} The rendered progress component.
 */
export const QuizProgress: React.FC<QuizProgressProps> = ({ current, total, progress }) => {
  return (
    <div className="w-full mb-6">
      <div className="flex justify-between text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
        <span>Question {current} of {total}</span>
        <span>{Math.round(progress)}% Completed</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
        <div 
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};
