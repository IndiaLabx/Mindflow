import { useState, useEffect, Dispatch, SetStateAction } from 'react';

/**
 * Custom hook to synchronize React state with Local Storage.
 *
 * This hook acts like `useState`, but it initializes state from localStorage (if available)
 * and automatically updates localStorage whenever the state changes.
 *
 * @template T - The type of the state value.
 * @param {string} key - The key under which the value is stored in localStorage.
 * @param {T} defaultValue - The initial value to use if no value is found in localStorage.
 * @returns {[T, Dispatch<SetStateAction<T>>]} A tuple containing the current state and a state setter function.
 */
export function useLocalStorageState<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(() => {
    try {
      const savedValue = localStorage.getItem(key);
      return savedValue ? JSON.parse(savedValue) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error("Could not save state to localStorage:", error);
    }
  }, [key, state]);

  return [state, setState];
}
