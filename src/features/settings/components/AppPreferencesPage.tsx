import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, Moon, Smartphone, Sparkles, Settings2 } from 'lucide-react';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { SettingsToggle } from '../../quiz/components/ui/SettingsToggle';
import { ClaymorphismSwitch } from '../../quiz/components/ui/ClaymorphismSwitch';
import { InstallPWA } from '../../quiz/components/ui/InstallPWA';

export const AppPreferencesPage: React.FC = () => {
    const navigate = useNavigate();
    const {
        isSoundEnabled, toggleSound,
        isHapticEnabled, toggleHaptics,
        areBgAnimationsEnabled, toggleBgAnimations,
        isDarkMode, toggleDarkMode
    } = useSettingsStore();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900 pb-20 pt-4 px-4 animate-in fade-in duration-300">
            {/* Header */}
            <header className="flex items-center gap-4 mb-8 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <button
                    onClick={() => navigate('/profile')}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:-translate-x-1 transition-transform" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                        <Settings2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 dark:text-white">App Preferences</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Customize your experience</p>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Section: Experience */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Experience</h3>
                    </div>
                    <div className="p-5 space-y-2">
                        <SettingsToggle
                            label="Sound Effects"
                            checked={isSoundEnabled}
                            onChange={toggleSound}
                            icon={<Volume2 className="w-5 h-5" />}
                        />
                        <div className="w-full h-px bg-slate-50 dark:bg-slate-800/50 my-2"></div>
                        <SettingsToggle
                            label="Haptic Feedback"
                            checked={isHapticEnabled}
                            onChange={toggleHaptics}
                            icon={<Smartphone className="w-5 h-5" />}
                        />
                    </div>
                </div>

                {/* Section: Visuals */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Visuals</h3>
                    </div>
                    <div className="p-5 space-y-2">
                        <SettingsToggle
                            label="Background Fireballs"
                            checked={areBgAnimationsEnabled}
                            onChange={toggleBgAnimations}
                            icon={<Sparkles className="w-5 h-5" />}
                        />
                        <div className="w-full h-px bg-slate-50 dark:bg-slate-800/50 my-2"></div>
                        <div className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-3 text-base font-semibold text-slate-700 dark:text-slate-200">
                               <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 rounded-lg">
                                  <Moon className="w-5 h-5" />
                               </div>
                               <label className="cursor-pointer select-none">Dark Mode</label>
                            </div>
                            <div>
                               <ClaymorphismSwitch checked={isDarkMode} onChange={toggleDarkMode} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section: App System */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">App System</h3>
                    </div>
                    <div className="p-5">
                        <InstallPWA />
                        <div className="mt-4 text-center">
                            <p className="text-xs font-medium text-slate-400">MindFlow Quiz App v{import.meta.env.VITE_APP_VERSION}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
