import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SynonymWord, Synonym } from '../../../../features/quiz/types';
import { useSynonymProgress } from '../hooks/useSynonymProgress';
import { FiSearch } from 'react-icons/fi';
import { FiChevronLeft } from 'react-icons/fi';
import { WordDetailModal } from './WordDetailModal';

interface SynonymClusterListProps {
  data: SynonymWord[];
  onExit: () => void;
  onSelectWord?: (word: SynonymWord) => void;
}

// Helper interface for unified word representation in family list
interface UnifiedWord {
  id: string; // Original ID or generated ID for synonym-only
  word: string;
  isPivot: boolean;
  importance_score: number;
  freq: number;
  trend: number;
  status: 'mastered' | 'familiar' | 'new';
  confusable_with?: string[];
  originalObject?: SynonymWord; // Only exists for top-level words
  isSynonymOnly: boolean;
}

export const SynonymClusterList: React.FC<SynonymClusterListProps> = ({
  data,
  onExit,
}) => {
  const { getStatus, markMastered } = useSynonymProgress();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState<SynonymWord | null>(null);

  // Expanded state to handle "Show More" functionality per cluster
  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({});

  // Refs for auto-scrolling
  const listContainerRef = useRef<HTMLDivElement>(null);
  const firstMatchRef = useRef<HTMLButtonElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  // 1. First, build the clusters exactly ONCE when data loads
  const baseClusters = useMemo(() => {
    const grouped = data.reduce((acc, word) => {
      const key = word.cluster_id || word.theme || 'Uncategorized';
      if (!acc[key]) acc[key] = [];
      acc[key].push(word);
      return acc;
    }, {} as Record<string, SynonymWord[]>);

    return grouped;
  }, [data]);

  // 2. Process clusters, apply search, deduplicate, and sort
  const processedClusters = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const result: { id: string; pivotCoreMeaning: string; words: UnifiedWord[]; isMatch: boolean }[] = [];

    // Reset scroll flag when search changes
    setHasScrolled(false);

    Object.entries(baseClusters).forEach(([clusterId, words]) => {
      // Find pivot word: highest importance_score, fallback to alphabetical
      let pivotWord = words[0];
      for (const w of words) {
        if (w.importance_score > pivotWord.importance_score) {
          pivotWord = w;
        } else if (w.importance_score === pivotWord.importance_score) {
          if (w.word.localeCompare(pivotWord.word) < 0) {
            pivotWord = w;
          }
        }
      }

      const pivotCoreMeaning = pivotWord?.hindiMeaning || '';

      // Collect all words (top-level + synonyms)
      const uniqueWordsMap = new Map<string, UnifiedWord>();
      let clusterMatchesSearch = false;

      // Add top-level words first
      words.forEach(w => {
        const normalized = w.word.toLowerCase().trim();
        const isMatch = query === '' ||
                        normalized.includes(query) ||
                        (w.hindiMeaning && w.hindiMeaning.toLowerCase().includes(query)) ||
                        (w.meaning && w.meaning.toLowerCase().includes(query));

        if (isMatch) clusterMatchesSearch = true;

        uniqueWordsMap.set(normalized, {
          id: w.id,
          word: w.word,
          isPivot: w.id === pivotWord.id,
          importance_score: w.importance_score,
          freq: w.lifetime_frequency ?? 0,
          trend: w.recent_trend ?? 0,
          status: getStatus(w),
          confusable_with: w.confusable_with,
          originalObject: w,
          isSynonymOnly: false,
        });
      });

      // Add synonyms if not already added
      words.forEach(w => {
        w.synonyms?.forEach(syn => {
          const normalizedSyn = syn.text.toLowerCase().trim();

          if (!uniqueWordsMap.has(normalizedSyn)) {
             const isMatch = query === '' ||
                             normalizedSyn.includes(query) ||
                             (syn.hindiMeaning && syn.hindiMeaning.toLowerCase().includes(query)) ||
                             (syn.meaning && syn.meaning.toLowerCase().includes(query));

             if (isMatch) clusterMatchesSearch = true;

             uniqueWordsMap.set(normalizedSyn, {
               id: `syn-${normalizedSyn}-${clusterId}`,
               word: syn.text,
               isPivot: false,
               importance_score: 0, // Default for synonym-only
               freq: 0,
               trend: 0,
               status: getStatus(syn.text),
               isSynonymOnly: true,
             });
          }
        });
      });

      // Only include this cluster if at least one word matches the search (or if no search)
      if (clusterMatchesSearch || query === '') {
        const unifiedWordsList = Array.from(uniqueWordsMap.values());

        // Sort: Pivot first -> Top level (by score) -> Synonyms
        unifiedWordsList.sort((a, b) => {
          if (a.isPivot) return -1;
          if (b.isPivot) return 1;

          if (!a.isSynonymOnly && b.isSynonymOnly) return -1;
          if (a.isSynonymOnly && !b.isSynonymOnly) return 1;

          if (!a.isSynonymOnly && !b.isSynonymOnly) {
             return b.importance_score - a.importance_score;
          }

          return a.word.localeCompare(b.word);
        });

        result.push({
          id: clusterId,
          pivotCoreMeaning,
          words: unifiedWordsList,
          isMatch: clusterMatchesSearch && query !== ''
        });
      }
    });

    // Sort families: If searching, match families first. Otherwise, maybe by pivot importance?
    // We'll keep them in their original general order or sort by pivot's importance if needed.
    // Let's sort by highest importance score in the cluster to keep the most important families at top.
    result.sort((a, b) => {
       const scoreA = a.words[0]?.importance_score || 0;
       const scoreB = b.words[0]?.importance_score || 0;
       return scoreB - scoreA;
    });

    return result;
  }, [baseClusters, searchQuery, getStatus]);

  // Handle auto-scroll to first match when search changes
  useEffect(() => {
    if (searchQuery !== '' && !hasScrolled && firstMatchRef.current) {
      firstMatchRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHasScrolled(true);
    }
  }, [processedClusters, searchQuery, hasScrolled]);


  const getHeatmapStyle = (score: number) => {
    if (score > 10) return {
      border: 'border-red-200 dark:border-red-900/50',
      bg: 'bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20',
      text: 'text-red-700 dark:text-red-400',
      icon: '🔥',
      freqColor: 'text-red-500/80 dark:text-red-400/80',
    };
    if (score >= 5) return {
      border: 'border-amber-200 dark:border-amber-900/50',
      bg: 'bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20',
      text: 'text-amber-700 dark:text-amber-500',
      icon: '⭐',
      freqColor: 'text-amber-600/80 dark:text-amber-500/80',
    };
    return {
      border: 'border-slate-200 dark:border-slate-700',
      bg: 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50',
      text: 'text-slate-800 dark:text-slate-200',
      icon: null,
      freqColor: 'text-slate-400 dark:text-slate-500',
    };
  };

  const getStatusIcon = (status: 'new' | 'familiar' | 'mastered') => {
    switch (status) {
      case 'mastered': return '🟢';
      case 'familiar': return '🟡';
      case 'new': return '🔴';
    }
  };

  const handleWordClick = (uWord: UnifiedWord) => {
    if (uWord.originalObject) {
      setSelectedWord(uWord.originalObject);
    } else {
      // Construct a pseudo-word object for synonyms that aren't top-level
      const pseudoWord: SynonymWord = {
         id: uWord.id,
         word: uWord.word,
         pos: '',
         repetition_raw: '',
         importance_score: 0,
         lifetime_frequency: 0,
         recent_trend: 0,
         theme: '',
         cluster_id: '',
         confusable_with: [],
         synonyms: [],
         antonyms: []
      };
      setSelectedWord(pseudoWord);
    }
  };

  const handleMarkMastered = (word: SynonymWord) => {
     // Find all words in this cluster to mark as familiar
     const cluster = processedClusters.find(c => c.words.some(w => w.word.toLowerCase() === word.word.toLowerCase()));
     const clusterWordsStr = cluster ? cluster.words.map(w => w.word) : [];
     markMastered(word, clusterWordsStr);
  };


  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <div className="flex flex-col bg-white dark:bg-slate-800 shadow-sm z-10 sticky top-0">
        <div className="flex items-center p-4">
          <button
            onClick={onExit}
            className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors mr-2"
            aria-label="Exit list view"
          >
             <FiChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold font-serif leading-tight">Master Word Families</h1>
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {Object.keys(baseClusters).length} Unique Semantic Clusters
            </p>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search for a word or meaning..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-700/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-slate-200 dark:placeholder-slate-400 transition-shadow"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24" ref={listContainerRef}>
        {processedClusters.map((cluster, index) => {
          const familyNumber = index + 1;
          const isExpanded = expandedClusters[cluster.id];
          const displayWords = isExpanded ? cluster.words : cluster.words.slice(0, 12);
          const hasMore = cluster.words.length > 12;

          return (
            <div key={cluster.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex items-start gap-3 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                  {familyNumber}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    FAMILY {familyNumber}
                  </h3>
                  {cluster.pivotCoreMeaning && (
                    <p className="text-slate-700 dark:text-slate-300 font-medium text-base mt-0.5">
                      Core Meaning: {cluster.pivotCoreMeaning}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 flex flex-wrap gap-3">
                {displayWords.map(uWord => {
                  const style = getHeatmapStyle(uWord.importance_score);
                  const trendSign = uWord.trend > 0 ? '+' : '';
                  const isMatch = searchQuery !== '' && uWord.word.toLowerCase().includes(searchQuery.toLowerCase().trim());

                  // Assign ref to the first match we encounter
                  const isFirstMatch = isMatch && !hasScrolled;

                  return (
                    <button
                      key={uWord.id}
                      ref={isFirstMatch ? firstMatchRef : null}
                      onClick={() => handleWordClick(uWord)}
                      className={`flex flex-col items-start px-4 py-3 rounded-xl border ${style.border} ${isMatch ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400' : style.bg} transition-all active:scale-95 text-left min-w-[120px] max-w-full relative ${uWord.status === 'mastered' ? 'opacity-60 grayscale' : ''}`}
                    >
                      {/* Status Icon */}
                      <div className="absolute top-2 right-2 text-xs">
                        {getStatusIcon(uWord.status)}
                      </div>

                      <div className="flex items-center gap-2 mb-1 pr-6">
                        {uWord.isPivot && <span title="Pivot Word" className="text-lg">🏅</span>}
                        <span className={`font-bold text-base ${isMatch ? 'text-blue-900 dark:text-blue-100' : style.text}`}>
                          {uWord.word}
                        </span>
                        {style.icon && !uWord.isPivot && (
                          <span className="text-sm" aria-hidden="true">{style.icon}</span>
                        )}
                        {uWord.confusable_with && uWord.confusable_with.length > 0 && (
                          <span title={`Confusable with ${uWord.confusable_with.join(', ')}`} className="text-orange-500 cursor-help ml-1 border border-orange-200 rounded-full px-1.5 text-[10px] font-bold bg-orange-100 dark:bg-orange-900/30 dark:border-orange-800">!</span>
                        )}
                      </div>

                      {!uWord.isSynonymOnly && (
                        <div className={`flex items-center gap-2 text-[10px] font-bold tracking-wider ${isMatch ? 'text-blue-700 dark:text-blue-300' : style.freqColor}`}>
                          {uWord.freq > 0 && <span>FREQ: {uWord.freq}</span>}
                          {uWord.trend !== 0 && <span>TREND: {trendSign}{uWord.trend}</span>}
                          {uWord.freq === 0 && uWord.trend === 0 && <span>SCORE: {uWord.importance_score}</span>}
                        </div>
                      )}
                    </button>
                  );
                })}

                {hasMore && (
                  <button
                    onClick={() => setExpandedClusters(prev => ({ ...prev, [cluster.id]: !isExpanded }))}
                    className="flex flex-col items-center justify-center px-4 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="text-sm font-medium">
                      {isExpanded ? 'Show Less' : `+${cluster.words.length - 12} More`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {processedClusters.length === 0 && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <p className="text-lg font-medium mb-2">No families found</p>
            <p className="text-sm">Try searching for a different word or meaning.</p>
          </div>
        )}
      </div>

      {selectedWord && (
        <WordDetailModal
          word={selectedWord}
          isMastered={getStatus(selectedWord) === 'mastered'}
          onMarkMastered={handleMarkMastered}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
};
