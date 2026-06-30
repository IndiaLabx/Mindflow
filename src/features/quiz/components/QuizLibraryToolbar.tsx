import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

interface QuizLibraryToolbarProps {
    count: number;
    label: string;
    viewMode: 'list' | 'grid';
    setViewMode: (mode: 'list' | 'grid') => void;
    sortMethod: string;
    setSortMethod: (method: any) => void;
    showScoreSort?: boolean;
}

export const QuizLibraryToolbar: React.FC<QuizLibraryToolbarProps> = ({
    count,
    label,
    viewMode,
    setViewMode,
    sortMethod,
    setSortMethod,
    showScoreSort = false
}) => {
    return (
        <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 p-2 sm:p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/50 border border-indigo-100/50 dark:border-slate-700/50 backdrop-blur-sm z-20 shadow-sm mb-4">
            <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-slate-600 dark:text-slate-300 font-medium text-xs sm:text-base">{label}:</span>
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs sm:text-sm">
                    {count}
                </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
                <select
                    value={sortMethod}
                    onChange={(e) => setSortMethod(e.target.value as any)}
                    className="px-2 py-1 sm:px-3 sm:py-1.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                >
                    <option value="date-desc">Date (Newest)</option>
                    <option value="date-asc">Date (Oldest)</option>
                    {showScoreSort && (
                        <>
                            <option value="score-desc">Score (High-Low)</option>
                            <option value="score-asc">Score (Low-High)</option>
                        </>
                    )}
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                </select>
                <div className="hidden sm:flex items-center p-1 bg-white/50 dark:bg-slate-900/50 rounded-lg border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`} title="List View">
                        <List className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`} title="Grid View">
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
