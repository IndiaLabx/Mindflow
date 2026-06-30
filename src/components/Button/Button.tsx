import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Props for the Button component.
 * Extends standard HTML button attributes.
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The visual style variant of the button. */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** The size of the button. */
  size?: 'sm' | 'md' | 'lg';
  /** If true, the button takes up the full width of its container. */
  fullWidth?: boolean;
}

/**
 * A flexible, highly reusable Button component.
 *
 * Supports various visual variants (primary, secondary, outline, etc.),
 * sizes, and full-width mode. It handles states like disabled and focus
 * automatically via utility classes.
 *
 * @param {ButtonProps} props - The component props.
 * @returns {JSX.Element} The rendered Button component.
 */
export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
    secondary: "bg-gray-800 text-white hover:bg-gray-900 focus:ring-gray-500",
    outline: "border border-gray-300 dark:border-gray-600 bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-gray-900 focus:ring-gray-500",
    ghost: "bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 hover:text-gray-900 dark:text-white focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth ? "w-full" : "",
        className
      )}
      {...props}
     aria-label="Perform action">
      {children}
    </button>
  );
};
