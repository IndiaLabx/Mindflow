import React from 'react';
import { X, Filter } from 'lucide-react';
import { InitialFilters } from '../../types';

/**
 * Props for the ActiveFiltersBar component.
 */
interface ActiveFiltersBarProps {
  /** The current state of selected filters. */
  filters: InitialFilters;
  /** Callback to remove a specific filter value. */
  onRemoveFilter: (key: keyof InitialFilters, value?: string) => void;
  /** Callback to clear all filters. */
  onClearAll: () => void;
}

/**
 * A component that displays a list of currently active filters as removable "pills" or tags.
 *
 * Provides visual feedback to the user about what criteria are currently applied to the question set.
 *
 * @param {ActiveFiltersBarProps} props - The component props.
 * @returns {JSX.Element} The rendered ActiveFiltersBar.
 */
export const ActiveFiltersBar: React.FC<ActiveFiltersBarProps> = ({ filters, onRemoveFilter, onClearAll }) => {
  // Explicitly type arr as string[] because Object.values return unknown[]/any[] depending on config
  const hasFilters = Object.values(filters).some((arr: string[]) => arr.length > 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm transition-all">
      <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Filter className="w-4 h-4" /> Active Filters
          </h4>
          {hasFilters && (
              <button 
                onClick={onClearAll}
                className="text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors"
              >
                  Clear All
              </button>
          )}
      </div>
      
      <div className="min-h-[32px] flex flex-wrap gap-2 items-center">
        {!hasFilters && (
          <span className="text-sm text-gray-400 italic">No filters selected. Select criteria above to refine questions.</span>
        )}
        
        {Object.keys(filters).map(key => {
          return (filters[key as keyof InitialFilters] || []).map(val => (
            <div 
              key={`${key}-${val}`} 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 shadow-sm group"
            >
               <span className="capitalize opacity-70 font-medium mr-0.5">{key}:</span>
               {val} 
               <button 
                  onClick={() => onRemoveFilter(key as keyof InitialFilters, val)}
                  className="bg-indigo-200 rounded-full p-0.5 hover:bg-indigo-300 transition-colors"
               >
                  <X className="w-3 h-3" />
               </button>
            </div>
          ));
        })}
      </div>
    </div>
  );
};
