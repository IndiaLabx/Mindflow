import { useState, useEffect } from 'react';

/**
 * Custom hook to programmatically check CSS media queries.
 *
 * This hook listens for changes to a media query (e.g., viewport width changes)
 * and updates a boolean state indicating whether the query currently matches.
 * Useful for responsive logic in JavaScript.
 *
 * @param {string} query - The CSS media query string (e.g., '(min-width: 768px)').
 * @returns {boolean} True if the document currently matches the media query, false otherwise.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}
