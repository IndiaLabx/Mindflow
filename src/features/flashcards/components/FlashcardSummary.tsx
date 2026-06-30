import React from 'react';
import { Trophy, RotateCcw, Home, BookOpen, CheckCircle2, Target, HelpCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Button } from '../../../components/Button/Button';
import { InitialFilters } from '../../quiz/types';
import { SwipeStats, FlashcardType } from '../../quiz/stores/useFlashcardStore';
import { motion } from 'framer-motion';

/**
 * Props for the FlashcardSummary component.
 */
interface FlashcardSummaryProps {
  /** The total number of flashcards reviewed in the session. */
  totalCards: number;
  /** The filters applied to the session (used for display context). */
  filters: InitialFilters;
  /** Callback to restart the session with the same settings. */
  onRestart: () => void;
  /** Callback to return to the dashboard. */
  onHome: () => void;
  /** Custom text for the back button. */
  backText?: string;
  /** The session swipe statistics */
  swipeStats?: SwipeStats;
  /** The session mode */
  mode?: 'basic' | 'review';
  /** The type of flashcards */
  flashcardType?: FlashcardType;
}

/**
 * The completion screen for a Flashcard session.
 *
 * Displays a summary of the session, including total cards reviewed
 * and metadata about the set (Source, Difficulty).
 * Provides options to restart the session or exit to home.
 *
 * @param {FlashcardSummaryProps} props - The component props.
 * @returns {JSX.Element} The rendered Summary screen.
 */
export const FlashcardSummary: React.FC<FlashcardSummaryProps> = ({
  totalCards,
  filters,
  onRestart,
  onHome,
  backText = "Dashboard",
  swipeStats,
  mode,
  flashcardType
}) => {

  // derived display values
  const sourceName = filters.examName.length > 0 ? filters.examName.join(", ") : "Various Sources";
  const difficulty = filters.difficulty.length > 0 ? filters.difficulty.join(", ") : "Mixed Difficulty";

  const showStats = swipeStats && (flashcardType === 'idioms' || flashcardType === 'ows');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-amber-50 dark:bg-amber-900/20/50 overflow-y-auto">
      <motion.div
        {...({
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 }
        } as any)}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-amber-100 p-8 max-w-md w-full text-center relative overflow-hidden my-auto"
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500" />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-100 rounded-full opacity-50 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-100 rounded-full opacity-50 blur-2xl" />

        <motion.div
          {...({
            initial: { y: 20, opacity: 0 },
            animate: { y: 0, opacity: 1 },
            transition: { delay: 0.2 }
          } as any)}
          className="relative z-10"
        >
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Trophy className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>

          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Session Complete!</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">You've just reviewed an entire deck.</p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex flex-col items-center gap-1">
                <BookOpen className="w-5 h-5 text-amber-500 mb-1" />
                <span className="text-2xl font-black text-gray-800 dark:text-gray-100">{totalCards}</span>
                <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Cards</span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col justify-center items-center gap-1">
              <CheckCircle2 className="w-5 h-5 text-green-500 mb-1" />
              <span className="text-sm font-bold text-gray-800 dark:text-gray-100 mt-1 truncate max-w-full px-2">{difficulty}</span>
              <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Level</span>
            </div>
          </div>

          {showStats && mode === 'basic' && (
            <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                 <div className="flex flex-col items-center gap-1">
                   <CheckCircle2 className="w-5 h-5 text-green-500 mb-1" />
                   <span className="text-2xl font-black text-gray-800 dark:text-gray-100">{swipeStats.known || 0}</span>
                   <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Known</span>
                 </div>
               </div>
               <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                 <div className="flex flex-col items-center gap-1">
                   <Target className="w-5 h-5 text-red-500 mb-1" />
                   <span className="text-2xl font-black text-gray-800 dark:text-gray-100">{swipeStats.unknown || 0}</span>
                   <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Unknown</span>
                 </div>
               </div>
            </div>
          )}

          {showStats && mode === 'review' && (
             <div className="grid grid-cols-4 gap-2 mb-8">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-xl border border-blue-100 dark:border-blue-800/50 flex flex-col items-center justify-center">
                   <span className="text-lg font-black text-blue-700 dark:text-blue-400">{swipeStats.mastered || 0}</span>
                   <span className="text-[10px] font-bold text-blue-600 dark:text-blue-500 uppercase">Perfect</span>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-xl border border-green-100 dark:border-green-800/50 flex flex-col items-center justify-center">
                   <span className="text-lg font-black text-green-700 dark:text-green-400">{swipeStats.tricky || 0}</span>
                   <span className="text-[10px] font-bold text-green-600 dark:text-green-500 uppercase">Good</span>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-xl border border-amber-100 dark:border-amber-800/50 flex flex-col items-center justify-center">
                   <span className="text-lg font-black text-amber-700 dark:text-amber-400">{swipeStats.review || 0}</span>
                   <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase">Hard</span>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-xl border border-red-100 dark:border-red-800/50 flex flex-col items-center justify-center">
                   <span className="text-lg font-black text-red-700 dark:text-red-400">{swipeStats.clueless || 0}</span>
                   <span className="text-[10px] font-bold text-red-600 dark:text-red-500 uppercase">Again</span>
                </div>
             </div>
          )}


          <div className="text-sm text-gray-400 dark:text-slate-500 mb-8 italic mt-4">
            "{sourceName}" set completed.
          </div>

          <div className="space-y-3">
            <Button
              fullWidth
              size="lg"
              onClick={onRestart}
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-lg shadow-indigo-200"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Review Again
            </Button>
            <Button
              fullWidth
              variant="ghost"
              onClick={onHome}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-slate-800"
            >
              <Home className="w-4 h-4 mr-2" /> {backText}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
