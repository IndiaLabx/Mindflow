import React from 'react';
import { CheckCircle2, XCircle, CircleDashed } from 'lucide-react';

/**
 * A minimalist horizontal status bar showing live quiz stats.
 *
 * Displays: Correct count, Wrong count, and Remaining count.
 * Used during the active quiz session (Learning Mode) to provide immediate feedback.
 *
 * @param {object} props - The component props.
 * @param {number} props.correct - Number of questions answered correctly.
 * @param {number} props.wrong - Number of questions answered incorrectly.
 * @param {number} props.total - Total number of questions in the session.
 * @returns {JSX.Element} The rendered stats bar.
 */
export function QuizStats({ correct, wrong, total }: { correct: number, wrong: number, total: number }) {
  const remaining = total - (correct + wrong);
  
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-8 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 mb-4 text-sm font-medium">
      <div className="flex items-center gap-2 text-green-700">
          <CheckCircle2 className="w-4 h-4" />
          <span>Correct: {correct}</span>
      </div>
      <div className="h-4 w-px bg-gray-300"></div>
      <div className="flex items-center gap-2 text-red-700">
          <XCircle className="w-4 h-4" />
          <span>Wrong: {wrong}</span>
      </div>
      <div className="h-4 w-px bg-gray-300"></div>
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <CircleDashed className="w-4 h-4" />
          <span>Remaining: {remaining}</span>
      </div>
    </div>
  );
}
