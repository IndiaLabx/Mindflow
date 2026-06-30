import { useState, useCallback } from 'react';

export interface PDFGenerationConfig {
  fileName: string;
  [key: string]: any;
}

export interface DownloadResult {
  blob: Blob;
  fileName: string;
  url: string;
}

export interface UsePDFGeneratorReturn<T> {
  generatePDF: (data: T[], config: PDFGenerationConfig) => Promise<DownloadResult | undefined>;
  isGenerating: boolean;
  error: Error | null;
}

/**
 * A reusable hook for generating PDFs from data.
 * @param generatorFn The function that performs the actual PDF generation and returns a Blob.
 */
export function usePDFGenerator<T>(
  generatorFnFactory: () => Promise<(data: T[], config: PDFGenerationConfig) => Promise<Blob>>
): UsePDFGeneratorReturn<T> {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generatePDF = useCallback(async (data: T[], config: PDFGenerationConfig): Promise<DownloadResult | undefined> => {
    setIsGenerating(true);
    setError(null);
    try {
      const generatorFn = await generatorFnFactory();
      const blob = await generatorFn(data, config);
      const url = URL.createObjectURL(blob);
      return { blob, fileName: config.fileName, url };
    } catch (err) {
      console.error('PDF Generation failed:', err);
      setError(err instanceof Error ? err : new Error('Unknown error during PDF generation'));
      return undefined;
    } finally {
      setIsGenerating(false);
    }
  }, [generatorFnFactory]);

  return { generatePDF, isGenerating, error };
}
