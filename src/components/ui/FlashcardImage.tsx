import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { ImageOff } from 'lucide-react';

interface FlashcardImageProps {
  src: string;
  alt?: string;
  className?: string;
}

export const FlashcardImage: React.FC<FlashcardImageProps> = ({ src, alt = "Flashcard visual", className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!src) return null;

  if (hasError) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl p-4 text-gray-400 border border-gray-200 dark:border-gray-700", className)}>
        <ImageOff className="w-6 h-6 mb-2 opacity-50" />
        <span className="text-xs font-medium uppercase tracking-widest opacity-50">Image unavailable</span>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm bg-gray-50 dark:bg-gray-800/50", className)}>
      {/* Shimmer Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 bg-[length:200%_100%] animate-shimmer" />
      )}

      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={cn(
          "w-full h-auto object-cover transition-opacity duration-500 z-10 relative",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
};
