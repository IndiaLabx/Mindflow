import React, { useEffect, useRef } from 'react';
import { SynonymWord } from '../../../../features/quiz/types';

interface WordDetailModalProps {
  word: SynonymWord;
  isMastered: boolean;
  onMarkMastered: (word: SynonymWord) => void;
  onClose: () => void;
}

export const WordDetailModal: React.FC<WordDetailModalProps> = ({
  word,
  isMastered,
  onMarkMastered,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle click outside modal content
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start p-5 border-b border-slate-100 dark:border-slate-700/50">
          <div>
            <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-1">
              {word.word}
            </h2>
            {word.pos && (
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 italic">
                {word.pos}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-5 flex-1">
          {/* Meaning Section */}
          {(word.meaning || word.hindiMeaning) && (
            <div className="space-y-2">
              {word.hindiMeaning && (
                <p className="text-xl font-medium text-blue-600 dark:text-blue-400">
                  {word.hindiMeaning}
                </p>
              )}
              {word.meaning && (
                <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                  {word.meaning}
                </p>
              )}
            </div>
          )}

          {/* Confusable Warning */}
          {word.confusable_with && word.confusable_with.length > 0 && (
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800/50 flex gap-2 items-start">
              <span className="text-orange-500 text-lg">⚠️</span>
              <div>
                <p className="text-sm font-bold text-orange-800 dark:text-orange-300 mb-0.5">
                  Don't confuse with:
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">
                  {word.confusable_with.join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Synonyms */}
          {word.synonyms && word.synonyms.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Synonyms
              </h4>
              <div className="flex flex-wrap gap-2">
                {word.synonyms.map((syn, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-600"
                  >
                    {syn.text}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Antonyms */}
          {word.antonyms && word.antonyms.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Antonyms
              </h4>
              <div className="flex flex-wrap gap-2">
                {word.antonyms.map((ant, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium border border-red-100 dark:border-red-900/30"
                  >
                    {ant.text}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/80">
          {!isMastered ? (
            <button
              onClick={() => {
                onMarkMastered(word);
                onClose();
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 px-6 rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>✓</span> Mark as Mastered
            </button>
          ) : (
            <div className="w-full text-green-600 dark:text-green-400 font-bold flex items-center justify-center gap-2 py-3.5 border-2 border-green-200 dark:border-green-800 rounded-xl bg-green-50 dark:bg-green-900/20">
              <span>🟢</span> Mastered
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
