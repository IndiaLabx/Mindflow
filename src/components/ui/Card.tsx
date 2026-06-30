import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Props for the Card component.
 */
interface CardProps {
  /** The content to be rendered inside the card. */
  children: React.ReactNode;
  /** Additional CSS classes to apply to the card container. */
  className?: string;
  /** If true, removes the default padding from the card body. */
  noPadding?: boolean;
  /** Optional click handler. If provided, the card becomes interactive. */
  onClick?: () => void;
}

/**
 * A general-purpose container component with a white background, border, and shadow.
 *
 * Used for grouping related content (e.g., stats, forms, quiz items).
 * Supports an interactive mode (hover effects) if an `onClick` handler is provided.
 *
 * @param {CardProps} props - The component props.
 * @returns {JSX.Element} The rendered Card component.
 */
export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  noPadding = false,
  onClick
}) => {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all",
        !noPadding && "p-4 md:p-6",
        onClick && "cursor-pointer hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500",
        className
      )}
    >
      {children}
    </div>
  );
};
