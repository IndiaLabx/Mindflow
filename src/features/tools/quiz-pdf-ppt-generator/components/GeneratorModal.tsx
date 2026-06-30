import React from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';

interface GeneratorModalProps {
  isOpen: boolean;
  type: 'PDF' | 'PPT' | 'JSON' | null;
  progress: number;
  details: string;
}

export const GeneratorModal: React.FC<GeneratorModalProps> = ({
  isOpen,
  type,
  progress,
  details,
}) => {
  if (!isOpen || !type) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] animate-in fade-in duration-200" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-[90] p-6 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800 flex flex-col items-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white mb-2">Generating Your {type}...</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">{details}</p>

        <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
                className="h-full bg-indigo-600 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progress}%` }}
            />
        </div>
        <p className="text-xs text-gray-400 font-medium text-right w-full mt-2">{progress}%</p>
      </div>
    </>,
    document.body
  );
};
