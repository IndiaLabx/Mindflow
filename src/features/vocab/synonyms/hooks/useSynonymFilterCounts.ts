import { useMemo } from 'react';
import { InitialFilters } from '../../../../types/models';

export type SynonymMetadata = {
    id: string;
    alphabet: string;
    examName: string;
    examYear: string;
    difficulty: string;
    knownStatus: string;
    status?: string;
    next_review_at?: string;
    reviewModeStatus?: string;
};

type FilterKeys = 'alphabet' | 'examName' | 'examYear' | 'difficulty' | 'knownStatus' | 'reviewModeStatus';
const filterKeys: FilterKeys[] = ['alphabet', 'examName', 'examYear', 'difficulty', 'knownStatus', 'reviewModeStatus'];


export function useSynonymQuestionIndex(metadata: SynonymMetadata[]) {
    return useMemo(() => {
        const index: Record<string, Record<string, Set<string>>> = {};
        const now = new Date().getTime();

        filterKeys.forEach(key => {
            index[key] = {};
        });

        metadata.forEach(item => {
            // Calculate Deck Mode dynamically
            let itemDeckModes: string[] = [];
            if (!item.status) {
                itemDeckModes = ['Unseen'];
            } else if (item.status === 'mastered') {
                itemDeckModes = ['Mastered'];
            } else if (item.status === 'review') {
                itemDeckModes = ['Review'];
            } else if (item.status === 'clueless') {
                itemDeckModes = ['Clueless'];
            } else if (item.status === 'tricky') {
                itemDeckModes = ['Tricky'];
            }

            // Assign dynamically computed reviewModeStatuss so the Set algorithm picks them up
            itemDeckModes.forEach(mode => {
                if (!index['reviewModeStatus'][mode]) index['reviewModeStatus'][mode] = new Set();
                index['reviewModeStatus'][mode].add(item.id);
            });

            filterKeys.forEach(key => {
                if (key === 'reviewModeStatus') return; // Handled above
                const value = item[key as keyof SynonymMetadata] as string;
                if (!value) return;

                if (!index[key][value]) {
                    index[key][value] = new Set();
                }
                index[key][value].add(item.id);
            });
        });

        return index;
    }, [metadata]);
}


export function useSynonymFilterCounts({
  metadata,
  selectedFilters,
  selectedAlphabets,
  index
}: {
  metadata: SynonymMetadata[];
  selectedFilters: InitialFilters;
  selectedAlphabets: string[];
  index: Record<string, Record<string, Set<string>>>;
}) {
  return useMemo(() => {
    const allCounts: Record<string, Record<string, number>> = {};

    for (const keyToCount of filterKeys) {
        let validIds: Set<string> | null = null;

        for (const otherKey of filterKeys) {
            if (otherKey === keyToCount) continue;

            const selected = otherKey === 'alphabet'
                ? selectedAlphabets
                : (selectedFilters[otherKey as keyof InitialFilters] as string[]);

            if (!selected || selected.length === 0) continue;

            const categoryIds = new Set<string>();
            selected.forEach(val => {
                const ids = index[otherKey]?.[val];
                if (ids) {
                    ids.forEach(id => categoryIds.add(id));
                }
            });

            if (validIds === null) {
                validIds = new Set(categoryIds);
            } else {
                const intersected = new Set<string>();
                validIds.forEach(id => {
                    if (categoryIds.has(id)) {
                        intersected.add(id);
                    }
                });
                validIds = intersected;
            }
            if (validIds && validIds.size === 0) break; // Optimization
        }

        const validQuestionIds = validIds;
        const counts: Record<string, number> = {};

        for (const [optionValue, questionIds] of Object.entries(index[keyToCount] || {})) {
            let count = 0;
            if (validQuestionIds === null) {
                count = questionIds.size;
            } else {
                questionIds.forEach(id => {
                    if (validQuestionIds.has(id)) {
                        count++;
                    }
                });
            }
            if (count > 0) {
               counts[optionValue] = count;
            }
        }
        allCounts[keyToCount] = counts;
    }

    // Also calculate the total overall matched valid subset
    let finalValidIds: Set<string> | null = null;
    for (const otherKey of filterKeys) {
        const selected = otherKey === 'alphabet'
            ? selectedAlphabets
            : (selectedFilters[otherKey as keyof InitialFilters] as string[]);

        if (!selected || selected.length === 0) continue;

        const categoryIds = new Set<string>();
        selected.forEach(val => {
            const ids = index[otherKey]?.[val];
            if (ids) {
                ids.forEach(id => categoryIds.add(id));
            }
        });

        if (finalValidIds === null) {
            finalValidIds = new Set(categoryIds);
        } else {
            const intersected = new Set<string>();
            finalValidIds.forEach(id => {
                if (categoryIds.has(id)) {
                    intersected.add(id);
                }
            });
            finalValidIds = intersected;
        }
        if (finalValidIds && finalValidIds.size === 0) break;
    }

    const totalMatchingCount = finalValidIds === null ? metadata.length : finalValidIds.size;
    const finalMatchingIds = finalValidIds === null ? metadata.map(m => m.id) : Array.from(finalValidIds);

    return { counts: allCounts, totalMatchingCount, finalMatchingIds };
  }, [metadata, selectedFilters, selectedAlphabets, index]);
}
