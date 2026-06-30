import React, { useState, useRef, useEffect } from 'react';
import { Zap, ChevronDown } from 'lucide-react';

interface QuickStartButtonsProps {
  onQuickStart: (type: 'Easy' | 'Medium' | 'Hard' | 'Mix') => void;
}

export const QuickStartButtons: React.FC<QuickStartButtonsProps> = React.memo(({ onQuickStart }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionClick = (type: 'Easy' | 'Medium' | 'Hard' | 'Mix') => {
    onQuickStart(type);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center shrink-0 gap-1.5 sm:gap-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm sm:text-base font-semibold transition-colors border border-indigo-200 dark:border-indigo-800/50"
      >
        <Zap className="w-4 h-4 fill-current" />
        <span className="hidden sm:inline">Quick Quiz</span>
        <span className="sm:hidden">Quick</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-in fade-in slide-in-from-top-2">
          <button
            onClick={() => handleOptionClick('Easy')}
            className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Quick 25 Easy
          </button>
          <button
            onClick={() => handleOptionClick('Medium')}
            className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Quick 25 Moderate
          </button>
          <button
            onClick={() => handleOptionClick('Hard')}
            className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Quick 25 Hard
          </button>
          <div className="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-2" />
          <button
            onClick={() => handleOptionClick('Mix')}
            className="w-full text-left px-4 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            Quick 25 Mix Level
          </button>
        </div>
      )}
    </div>
  );
});
