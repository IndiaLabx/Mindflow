import React from 'react';
import { cn } from '../../utils/cn';

/** Available color variants for the progress bar. */
type ProgressVariant = 'primary' | 'success' | 'warning' | 'danger';

/**
 * Props for the ProgressBar component.
 */
interface ProgressBarProps {
  /** The current value of the progress. */
  value: number;
  /** The maximum value (default 100). */
  max?: number;
  /** The color theme of the progress bar. */
  variant?: ProgressVariant;
  /** The height/thickness of the bar. */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes. */
  className?: string;
  /** Whether to display a text label showing the percentage above the bar. */
  showLabel?: boolean;
}

/** Mapping of variants to Tailwind CSS background colors. */
const variantColors: Record<ProgressVariant, string> = {
  primary: "bg-indigo-600",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
};

/** Mapping of size props to Tailwind CSS height classes. */
const sizes = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

/**
 * A linear progress bar component.
 *
 * Visualizes the completion status of a task or process.
 *
 * @param {ProgressBarProps} props - The component props.
 * @returns {JSX.Element} The rendered ProgressBar component.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  className,
  showLabel = false
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn("w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden", sizes[size])}>
        <div 
          className={cn("h-full rounded-full transition-all duration-500 ease-out", variantColors[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
