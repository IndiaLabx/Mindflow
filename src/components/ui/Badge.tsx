import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Available visual variants for the Badge component.
 */
type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline';

/**
 * Props for the Badge component.
 */
interface BadgeProps {
  /** The content to display inside the badge. */
  children: React.ReactNode;
  /** The visual style variant of the badge. Defaults to 'neutral'. */
  variant?: BadgeVariant;
  /** Additional CSS classes to apply. */
  className?: string;
  /** Optional icon to display before the text. */
  icon?: React.ReactNode;
}

/** Mapping of variant names to Tailwind CSS class strings. */
const variantStyles: Record<BadgeVariant, string> = {
  primary: "bg-indigo-100 text-indigo-700 border-transparent",
  success: "bg-emerald-100 text-emerald-700 border-transparent",
  warning: "bg-amber-100 text-amber-700 border-transparent",
  danger: "bg-rose-100 text-rose-700 border-transparent",
  neutral: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700",
  outline: "bg-transparent text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700",
};

/**
 * A small status label or tag component.
 *
 * Used to display metadata, status, or labels (e.g., "New", "Admin", "Completed").
 * Supports icons and multiple color variants.
 *
 * @param {BadgeProps} props - The component props.
 * @returns {JSX.Element} The rendered Badge component.
 */
export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'neutral', 
  className,
  icon
}) => {
  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border transition-colors",
        variantStyles[variant],
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
