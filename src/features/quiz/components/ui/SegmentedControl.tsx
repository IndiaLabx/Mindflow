import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '../../../../utils/cn';

/**
 * A segmented control component (toggle button group).
 *
 * Allows users to select one or more options from a linear group.
 * Displays counts for each option and handles disabled states.
 */
export const SegmentedControl = React.memo(function SegmentedControl({
  label,
  options, 
  selectedOptions, 
  onOptionToggle,
  counts,
  allowMultiple = true,
  tooltip,
  hideZeroCount = false
}: { 
  label?: string;
  options: string[]; 
  selectedOptions: string[]; 
  onOptionToggle: (option: string) => void;
  counts?: { [key: string]: number };
  allowMultiple?: boolean;
  tooltip?: string;
  hideZeroCount?: boolean;
}) {
  return (
    <div>
      {label && (
        <div className="flex items-center gap-1.5 mb-2">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</label>
          {tooltip && (
            <div className="group relative flex items-center">
              <Info className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-indigo-500 transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-50 pointer-events-none text-center font-normal leading-relaxed">
                {tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
              </div>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap p-1 bg-gray-100 dark:bg-gray-800 rounded-xl gap-1" role="group" aria-label={label || "Segmented Control"}>
        {options.filter(opt => {
            if (!hideZeroCount || !counts) return true;
            return selectedOptions.includes(opt) || (counts[opt] || 0) > 0;
        }).map(option => {
            const count = counts?.[option] || 0;
            const isSelected = selectedOptions.includes(option);
            const isDisabled = !isSelected && count === 0;

            return (
            <button 
                key={option} 
                onClick={() => !isDisabled && onOptionToggle(option)}
                disabled={isDisabled}
                aria-pressed={isSelected}
                className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5",
                    isSelected 
                        ? "bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 shadow-sm ring-1 ring-black/5"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:bg-gray-700/50",
                    isDisabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-gray-600 dark:text-gray-300"
                )}
            >
                {option} 
                <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full transition-colors font-bold",
                    isSelected
                      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                )}>
                    {count}
                </span>
            </button>
            )
        })}
      </div>
    </div>
  );
});
