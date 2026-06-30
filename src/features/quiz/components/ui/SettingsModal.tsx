import React, { useContext } from 'react';
import { createPortal } from 'react-dom';
import { X, Volume2, Moon, Smartphone, Sparkles } from 'lucide-react';
import { useSettingsStore } from '../../../../stores/useSettingsStore';
import { SettingsToggle } from './SettingsToggle';
import { ClaymorphismSwitch } from './ClaymorphismSwitch';
import { NotificationSettings } from '../../../notifications/components/NotificationSettings';

import { InstallPWA } from './InstallPWA';

/**
 * A modal dialog for application settings.
 *
 * Allows users to toggle:
 * - Sound effects
 * - Haptic feedback
 * - Background animations
 * - Dark mode (though usually system preferred)
 * - Also displays PWA install prompt if applicable.
 *
 * Uses React Portal to render at the top of the DOM tree.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Whether the modal is visible.
 * @param {function} props.onClose - Callback to close the modal.
 * @returns {JSX.Element | null} The rendered modal or null.
 */
export function SettingsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { 
    isSoundEnabled, toggleSound,
    isHapticEnabled, toggleHaptics,
    areBgAnimationsEnabled, toggleBgAnimations,
    isDarkMode, toggleDarkMode
  } = useSettingsStore();
  
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border dark:border-slate-800 w-full max-w-md overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Settings</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
            
            {/* Section: Experience */}
            <div>
                <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Experience</h3>
                <div className="space-y-1">
                    <SettingsToggle 
                        label="Sound Effects" 
                        checked={isSoundEnabled} 
                        onChange={toggleSound} 
                        icon={<Volume2 className="w-4 h-4" />}
                    />
                    <SettingsToggle 
                        label="Haptic Feedback" 
                        checked={isHapticEnabled} 
                        onChange={toggleHaptics} 
                        icon={<Smartphone className="w-4 h-4" />}
                    />
                </div>
            </div>

            {/* Section: Visuals */}
            <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Visuals</h3>
                <div className="space-y-1">
                    <SettingsToggle 
                        label="Background Fireballs" 
                        checked={areBgAnimationsEnabled} 
                        onChange={toggleBgAnimations} 
                        icon={<Sparkles className="w-4 h-4" />}
                    />
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                           <span className="text-gray-400"><Moon className="w-4 h-4" /></span>
                           <label className="cursor-pointer select-none">Dark Mode</label>
                        </div>
                        <div>
                           <ClaymorphismSwitch checked={isDarkMode} onChange={toggleDarkMode} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Section: PWA Install */}
            <InstallPWA />

        </div>
        
        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-xs text-gray-400">MindFlow Quiz App v{import.meta.env.VITE_APP_VERSION}</p>
        </div>
      </div>
    </div>,
    document.body
  );
}
