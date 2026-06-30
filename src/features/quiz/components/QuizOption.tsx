import React from 'react';
import { Check, X, EyeOff } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { MarkdownRenderer } from '../../../components/ui/MarkdownRenderer';

/**
 * Props for the QuizOption component.
 */
interface QuizOptionProps {
    /** The option text (English). */
    option: string;
    /** The option text (Hindi), optional. */
    option_hi?: string;
    /** Whether this option is currently selected by the user. */
    isSelected: boolean;
    /** Whether this option is the correct answer. */
    isCorrect: boolean;
    /** Whether the question has been answered (reveals state in Learning Mode). */
    isAnswered: boolean;
    /** Whether the option is hidden (e.g., via 50:50 Lifeline). */
    isHidden: boolean;
    /** Whether the quiz is in Mock Mode (affects visual feedback). */
    isMockMode: boolean;
    /** Click handler. */
    onClick: () => void;
}

/**
 * A selectable answer button for the quiz.
 *
 * Supports two visual modes:
 * - **Learning Mode**: Immediate feedback. Shows Correct (Green) or Incorrect (Red) states immediately after selection. Removes unselected options visually.
 * - **Mock Mode**: Selection state only. No immediate feedback on correctness. Standard radio-button style.
 *
 * Handles bilingual text display and "hidden" states for lifelines.
 *
 * @param {QuizOptionProps} props - The component props.
 * @returns {JSX.Element} The rendered option button.
 */
export const QuizOption: React.FC<QuizOptionProps> = ({
    option,
    option_hi,
    isSelected,
    isCorrect,
    isAnswered,
    isHidden,
    isMockMode,
    onClick
}) => {
    // Default base styles
    let containerClass = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-slate-800 dark:bg-slate-800/50 cursor-pointer relative";
    let icon: React.ReactNode = <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 transition-colors group-hover:border-indigo-400 flex-shrink-0" />;
    let textClass = "text-gray-700 dark:text-gray-200";
    let animationClass = "";

    // --- MOCK MODE LOGIC ---
    // Simple selection state, no answer reveal
    if (isMockMode) {
        if (isSelected) {
            containerClass = "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-600 ring-1 ring-indigo-600 relative";
            icon = <div className="w-5 h-5 rounded-full border-[5px] border-indigo-600 flex-shrink-0" />;
            textClass = "text-indigo-800 dark:text-indigo-300 font-medium";
        }
    } 
    // --- LEARNING MODE LOGIC ---
    // Immediate feedback and rich visual states
    else {
        // In Learning Mode, we remove the left radio circle to reduce clutter during reading.
        // Icons appear on the right or as status indicators.
        icon = null;

        if (isHidden) {
             containerClass = "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-60 cursor-not-allowed shadow-none relative";
             textClass = "text-gray-400 dark:text-slate-500 line-through decoration-gray-300 decoration-2 select-none";
             // EyeOff icon indicates this option was removed by a lifeline
             icon = <div className="absolute right-4"><EyeOff className="w-5 h-5 text-gray-300" /></div>;
        }
        else if (isAnswered) {
            containerClass = "cursor-default relative"; 
            
            if (isCorrect && isSelected) {
                // Scenario: User picked the Correct Answer
                containerClass = "bg-green-50 border-green-500 ring-1 ring-green-500 relative";
                textClass = "text-green-900 font-medium"; 
                icon = (
                    <div className="flex-shrink-0 bg-green-500 rounded-full p-1 shadow-sm">
                        <Check className="w-4 h-4 text-white" />
                    </div>
                );
                animationClass = "scale-[1.02] shadow-md";

            } else if (isSelected) {
                // Scenario: User picked the Wrong Answer
                containerClass = "bg-red-50 dark:bg-red-900/20 border-red-500 ring-1 ring-red-500 relative";
                textClass = "text-red-900 font-medium";
                icon = (
                    <div className="flex-shrink-0 bg-red-50 dark:bg-red-900/200 rounded-full p-1 shadow-sm">
                        <X className="w-4 h-4 text-white" />
                    </div>
                );
                animationClass = "animate-shake";

            } else if (isCorrect) {
                 // Scenario: Show the Correct Answer (Ghost View) when user missed it
                 containerClass = "bg-green-50/50 border-green-400 border-dashed relative";
                 textClass = "text-green-800";
                 icon = (
                    <div className="flex-shrink-0 border-2 border-green-500 rounded-full p-0.5">
                         <Check className="w-3 h-3 text-green-500" />
                    </div>
                 );
            } else {
                 // Scenario: Irrelevant options fade out to focus attention
                 containerClass = "opacity-50 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 relative";
            }
        } else if (isSelected) {
            // Fallback for immediate selection before processing (rare in sync mode)
            containerClass = "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-600 relative";
            textClass = "text-indigo-900 font-medium";
        }
    }

    return (
        <button
            onClick={!isHidden ? onClick : undefined}
            disabled={isHidden}
            className={cn(
                "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 group",
                containerClass,
                animationClass
            )}
        >
            {/* Left Icon (Only shown in Mock Mode for radio-button feel) */}
            {isMockMode && (
                <div className="flex-shrink-0">
                    {icon}
                </div>
            )}

            {/* Option Content (English + Hindi) */}
            <div className="flex-1 min-w-0">
                <div className={cn("leading-snug transition-colors text-[1em] font-poppins selectable-text", textClass)}>
                    <MarkdownRenderer content={option} className="!text-current" />
                </div>
                {option_hi && (
                    <div className={cn("mt-1 font-hindi opacity-80 group-hover:opacity-100 transition-opacity text-[0.95em] selectable-text", isHidden && "line-through")}>
                        <MarkdownRenderer content={option_hi} className="!text-current" />
                    </div>
                )}
            </div>

            {/* Right Icon (Only shown in Learning Mode for feedback) */}
            {!isMockMode && icon}
        </button>
    );
};
