import { useState, useEffect, useRef } from 'react';
import { Question, InitialFilters } from '../types';

/**
 * Custom hook to calculate the count of available questions for each filter option.
 *
 * This hook computes the number of questions that match the current filter criteria,
 * allowing the UI to display counts next to filter options (e.g., "History (50)").
 * It intelligently calculates counts contextually, meaning selecting a Subject will update
 * the counts for Topics, but not for the Subject list itself (to show what else is available).
 *
 * It uses a Web Worker to offload heavy calculations and keep the UI thread unblocked.
 *
 * @param {object} props - The hook properties.
 * @param {Question[]} props.allQuestions - The complete list of available questions.
 * @param {InitialFilters} props.selectedFilters - The currently selected filters.
 * @returns {{ [key: string]: { [key: string]: number } }} An object where keys are filter categories (e.g., 'subject') and values are objects mapping option names to counts.
 */
export function useFilterCounts({ allQuestions, selectedFilters }: {
  allQuestions: Question[];
  selectedFilters: InitialFilters;
}) {
  const [counts, setCounts] = useState<{ [key: string]: { [key: string]: number } }>({});
  const workerRef = useRef<Worker | null>(null);

  // Initialize the worker on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      workerRef.current = new Worker(new URL('../workers/filterWorker.ts', import.meta.url), { type: 'module' });

      workerRef.current.onmessage = (e: MessageEvent<{ [key: string]: { [key: string]: number } }>) => {
        setCounts(e.data);
      };
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Send the large `allQuestions` array ONLY when it changes (initial load/fetch)
  // This avoids passing a massive array through structuredClone on every UI click.
  useEffect(() => {
    if (workerRef.current && allQuestions.length > 0) {
      workerRef.current.postMessage({ type: 'INIT', allQuestions });

      // Immediately calculate based on current filters after init
      workerRef.current.postMessage({ type: 'CALCULATE', selectedFilters });
    }
  }, [allQuestions]);

  // Send ONLY the tiny `selectedFilters` object when the user changes a filter
  useEffect(() => {
    if (workerRef.current && allQuestions.length > 0) {
      workerRef.current.postMessage({ type: 'CALCULATE', selectedFilters });
    }
  }, [selectedFilters, allQuestions.length]);

  return counts;
}
