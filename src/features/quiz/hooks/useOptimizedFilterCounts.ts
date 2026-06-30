import { useMemo } from 'react';
import { Question, InitialFilters, filterKeys, getQuestionValue } from '../types';
import { QuestionIndex } from './useQuestionIndex';

/**
 * Custom hook to calculate the count of available questions for each filter option using Set operations.
 */
export function useOptimizedFilterCounts({
  allQuestions,
  selectedFilters,
  index
}: {
  allQuestions: Question[];
  selectedFilters: InitialFilters;
  index: QuestionIndex;
}) {
  return useMemo(() => {
    const allCounts: { [key: string]: { [key: string]: number } } = {};

    for (const keyToCount of filterKeys) {
        // Find which questions are valid based on ALL OTHER filters.
        let validIds: Set<string> | null = null;

        for (const otherKey of filterKeys) {
            if (otherKey === keyToCount) continue;

            const selected = selectedFilters[otherKey as keyof InitialFilters];
            if ((selected || []).length === 0) continue;

            const categoryIds = new Set<string>();
            (selected || []).forEach(val => {
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
            if (validIds.size === 0) break; // Optimization
        }

        // If no other filters were active, all questions are valid
        const validQuestionIds = validIds;

        // Count occurrences of each value for the current category in the valid set
        const counts: { [key: string]: number } = {};

        // Iterate through the index for the specific key to count
        for (const [optionValue, questionIds] of Object.entries(index[keyToCount] || {})) {
            let count = 0;
            if (validQuestionIds === null) {
                // No filters applied, count is just the size of the set
                count = questionIds.size;
            } else {
                // Intersect the option's IDs with the valid IDs
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
    return allCounts;
  }, [selectedFilters, index]);
}
