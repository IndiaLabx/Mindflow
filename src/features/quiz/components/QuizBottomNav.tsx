import React from 'react';
import { ArrowLeft, ArrowRight, Flag, CheckCircle, Save } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Button } from '../../../components/Button/Button';
import { QuizMode } from '../types';

/**
 * Bottom navigation bar for the active quiz session.
 *
 * Provides:
 * - Previous Button.
 * - Mark for Review toggle.
 * - Next / Finish Button.
 *
 * @param {object} props - The component props.
 * @returns {JSX.Element} The rendered navigation bar.
 */
export function QuizBottomNav({ 
    onPrevious, 
    onNext, 
    onToggleMarkForReview, 
    isMarked, 
    isFirst, 
    isLast, 
    isAnswered,
    mode
}: {
    onPrevious: () => void;
    onNext: () => void;
    onToggleMarkForReview: () => void;
    isMarked: boolean;
    isFirst: boolean;
    isLast: boolean;
    isAnswered: boolean;
    mode: QuizMode;
}) {
    const isMock = mode === 'mock';

    return (
        <div className="flex items-center justify-between pt-4 pb-4 md:pb-6 px-6 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
            <Button 
                variant="ghost" 
                onClick={onPrevious} 
                disabled={isFirst}
                className="text-gray-500 dark:text-gray-400 hover:text-indigo-600"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Prev
            </Button>

            <button 
                onClick={onToggleMarkForReview}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                    isMarked 
                        ? "bg-purple-100 text-purple-700 border border-purple-200" 
                        : "bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 border border-transparent"
                )}
            >
                <Flag className={cn("w-4 h-4", isMarked ? "fill-current" : "")} />
                <span className="hidden sm:inline">{isMarked ? 'Marked for Review' : 'Mark for Review'}</span>
                <span className="sm:hidden">Review</span>
            </button>

            <Button 
                onClick={onNext} 
                // In Mock mode, this acts as "Save & Next"
                className={cn(
                    "transition-all",
                    isLast 
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 shadow-md hover:shadow-lg border-0" 
                        : "pl-6 pr-4"
                )}
            >
                {isLast ? (
                    <>Finish <CheckCircle className="w-4 h-4 ml-2" /></>
                ) : (
                    isMock ? (
                        <>Save & Next <Save className="w-4 h-4 ml-2" /></>
                    ) : (
                        <>Next <ArrowRight className="w-4 h-4 ml-2" /></>
                    )
                )}
            </Button>
        </div>
    );
}
