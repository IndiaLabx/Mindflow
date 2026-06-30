import React from 'react';
import { cn } from '../../../../utils/cn';

/**
 * A toggle switch component for settings items.
 *
 * Renders a label (optional icon) and an iOS-style toggle switch.
 *
 * @param {object} props - The component props.
 * @param {string} props.label - The text label for the setting.
 * @param {boolean} props.checked - The current state (on/off).
 * @param {function} props.onChange - Callback to toggle the state.
 * @param {React.ReactNode} [props.icon] - Optional icon to display next to the label.
 * @returns {JSX.Element} The rendered toggle component.
 */
export function SettingsToggle({ label, checked, onChange, icon }: { label: string, checked: boolean, onChange: () => void, icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
       <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          {icon && <span className="text-gray-400">{icon}</span>}
          <label htmlFor={`setting-${label}`} className="cursor-pointer select-none">{label}</label>
       </div>
       
       <button 
          id={`setting-${label}`}
          onClick={onChange}
          className={cn(
              "w-11 h-6 rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
              checked ? "bg-indigo-600 dark:bg-indigo-500" : "bg-gray-200 dark:bg-gray-700"
          )}
       >
          <span className={cn(
              "absolute top-1 left-1 bg-white dark:bg-gray-800 w-4 h-4 rounded-full shadow transition-transform transform",
              checked ? "translate-x-5" : "translate-x-0"
          )} />
       </button>
    </div>
  );
}
