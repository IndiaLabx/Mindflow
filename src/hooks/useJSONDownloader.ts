import { useState, useCallback } from 'react';

export interface DownloadResult {
  blob: Blob;
  fileName: string;
  url: string;
}

interface UseJSONDownloaderReturn<T> {
  downloadJSON: (data: T[], fileName: string) => Promise<DownloadResult | undefined>;
  isGenerating: boolean;
  error: Error | null;
}

/**
 * A hook for generating a JSON file blob/URL with a simulated delay.
 */
export function useJSONDownloader<T>(): UseJSONDownloaderReturn<T> {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const downloadJSON = useCallback(async (data: T[], fileName: string): Promise<DownloadResult | undefined> => {
    setIsGenerating(true);
    setError(null);

    try {

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      return { blob, fileName, url };
    } catch (err) {
      console.error('JSON Download failed:', err);
      setError(err instanceof Error ? err : new Error('Unknown error during JSON download'));
      return undefined;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { downloadJSON, isGenerating, error };
}
