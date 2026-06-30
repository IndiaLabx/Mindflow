import { useMemo } from 'react';
import { InitialFilters } from '../../../../types/models';

export type IdiomMetadata = {
    id: string;
    alphabet: string;
    examName: string;
    examYear: string;
    difficulty: string;
    knownStatus: string;
    status?: string;
    hasPhoto?: 'With Photo' | 'Without Photo';
    reviewModeStatus?: string;
};

type FilterKeys = 'alphabet' | 'examName' | 'examYear' | 'difficulty' | 'knownStatus' | 'reviewModeStatus' | 'hasPhoto';
const filterKeys: FilterKeys[] = ['alphabet', 'examName', 'examYear', 'difficulty', 'knownStatus', 'reviewModeStatus', 'hasPhoto'];

export function useIdiomQuestionIndex(metadata: IdiomMetadata[]) {
    return useMemo(() => {
        const index: Record<string, Record<string, Set<string>>> = {};

        filterKeys.forEach(key => {
            index[key] = {};
        });

        metadata.forEach(item => {
            filterKeys.forEach(key => {
                if (key === 'reviewModeStatus') return; // Handled below dynamically

                const value = item[key as keyof IdiomMetadata];
                if (!value) return;

                if (!index[key][value as string]) {
                    index[key][value as string] = new Set();
                }
                index[key][value as string].add(item.id);
            });

            // Assign dynamically computed reviewModeStatuss so the Set algorithm picks them up
            const itemModes = determineDeckModes(item.status);
            itemModes.forEach(mode => {
                if (!index['reviewModeStatus'][mode]) index['reviewModeStatus'][mode] = new Set();
                index['reviewModeStatus'][mode].add(item.id);
            });
        });

        return index;
    }, [metadata]);
}

function determineDeckModes(status?: string): string[] {
    const modes = [];
    if (!status) modes.push('Unseen');
    if (status === 'mastered') modes.push('Mastered');
    if (status === 'review') modes.push('Review');
    if (status === 'clueless') modes.push('Clueless');
    if (status === 'tricky') modes.push('Tricky');
    return modes;
}

export function useIdiomFilterCounts({
  metadata,
  selectedFilters,
  selectedAlphabets,
  index
}: {
  metadata: IdiomMetadata[];
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
