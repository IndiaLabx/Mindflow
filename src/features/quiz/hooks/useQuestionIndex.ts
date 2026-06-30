import { useMemo } from 'react';
import { Question, InitialFilters, filterKeys, getQuestionValue } from '../types';

export type QuestionIndex = Record<string, Record<string, Set<string>>>;

/**
 * Hook to build an inverted index mapping for rapid filtering.
 * Format: { subject: { "History": Set("id1", "id2"), ... }, ... }
 */
export function useQuestionIndex(questions: Question[]) {
  return useMemo(() => {
    const index: QuestionIndex = {};

    // Initialize the structure for all filter keys
    filterKeys.forEach(key => {
      index[key] = {};
    });

    questions.forEach(question => {
      filterKeys.forEach(key => {
        const value = getQuestionValue(question, key as keyof InitialFilters);

        if (Array.isArray(value)) {
          value.forEach(v => {
            if (!index[key][v]) {
              index[key][v] = new Set();
            }
            index[key][v].add(question.id);
          });
        } else if (value !== undefined && value !== null) {
          const strValue = String(value); // Ensure it's a string (e.g. year)
          if (!index[key][strValue]) {
            index[key][strValue] = new Set();
          }
          index[key][strValue].add(question.id);
        }
      });
    });

    return index;
  }, [questions]);
}

/**
 * Utility to filter a list of questions using the pre-built index and Sets.
 */
export function filterQuestionsByIndex(
  questions: Question[],
  index: QuestionIndex,
  filters: InitialFilters
): Question[] {
  let activeIds: Set<string> | null = null;

  // Iterate through active filters and compute intersections
  for (const key of filterKeys) {
    const selectedValues = filters[key as keyof InitialFilters];

    if ((selectedValues || []).length === 0) continue;

    // Union of IDs for the current filter category (OR logic within the same category)
    const categoryIds = new Set<string>();
    (selectedValues || []).forEach(val => {
      const idsForValue = index[key]?.[val];
      if (idsForValue) {
        idsForValue.forEach(id => categoryIds.add(id));
      }
    });

    // Intersect with the running list of active IDs (AND logic between categories)
    if (activeIds === null) {
      activeIds = new Set(categoryIds);
    } else {
      const intersected = new Set<string>();
      activeIds.forEach(id => {
        if (categoryIds.has(id)) {
          intersected.add(id);
        }
      });
      activeIds = intersected;
    }

    // Early exit if intersection is empty
    if (activeIds.size === 0) break;
  }

  // If no filters were active, return all
  if (activeIds === null) {
    return questions;
  }

  // Return the actual question objects that match the intersected IDs
  return questions.filter(q => activeIds!.has(q.id));
}
