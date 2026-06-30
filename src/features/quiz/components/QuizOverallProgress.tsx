import React from 'react';

/**
 * A minimalist progress bar for tracking overall quiz completion.
 *
 * Displays a thin, gradient bar indicating the percentage of questions completed.
 * Used at the top of the quiz interface.
 *
 * @param {object} props - The component props.
 * @param {number} props.current - The current question index (0-based) or count.
 * @param {number} props.total - The total number of questions.
 * @returns {JSX.Element} The rendered progress bar.
 */
export function QuizOverallProgress({ current, total }: { current: number, total: number }) {
  const progress = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-6">
      <div 
        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out rounded-full"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
