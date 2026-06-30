import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../../utils/cn';

export function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn(
      "border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm mt-6 mb-24",
      !isOpen && "overflow-hidden"
    )}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="font-bold px-3 py-1 rounded-md bg-amber-100/80 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-200/50 dark:border-amber-700/30 shadow-sm">{title}</span>
        <ChevronDown className={cn("w-5 h-5 text-gray-500 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>
      <div
        className={cn(
          "transition-all duration-300 ease-in-out relative",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        )}
      >
        <div className="p-6 pt-2">
          {children}
        </div>
      </div>
    </div>
  );
}
