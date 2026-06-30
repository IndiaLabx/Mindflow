import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, CheckCircle, ArrowLeft, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SavedQuizzesList } from './SavedQuizzesList';
import { AttemptedQuizzesList } from './AttemptedQuizzesList';

export const QuizLibrary: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') === 'attempted' ? 'attempted' : 'created';

    // Shared state for toolbar controls
    const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list');
    const [sortMethod, setSortMethod] = React.useState<'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'score-desc' | 'score-asc'>('date-desc');

    // Prevent invalid sorting for 'created' tab
    useEffect(() => {
        if (activeTab === 'created' && (sortMethod === 'score-desc' || sortMethod === 'score-asc')) {
            setSortMethod('date-desc');
        }
    }, [activeTab, sortMethod]);

    const handleTabChange = (tab: 'created' | 'attempted') => {
        setSearchParams({ tab }, { replace: true });
    };

    return (
        <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-2 sm:p-6 lg:p-8 transition-colors duration-700 relative overflow-hidden">
            {/* --- "Aurora" Atmosphere (Background) --- */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50/50 to-white md:hidden animate-hue-slow" />
                <div className="hidden md:block">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-300/40 mix-blend-multiply filter blur-[120px] animate-blob" />
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-300/40 mix-blend-multiply filter blur-[120px] animate-blob animation-delay-2000" />
                    <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-pink-200/40 mix-blend-multiply filter blur-[120px] animate-blob animation-delay-4000" />
                </div>
            </div>

            <div className="w-full max-w-7xl mx-auto relative z-10 animate-fade-in py-2 sm:py-4 space-y-3 sm:space-y-6 flex flex-col flex-1">
                {/* Header Title & Back Button */}
                <div className="flex flex-col gap-3 sm:gap-6 mb-2 sm:mb-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button
                            onClick={() => navigate('/mcqs')}
                            className="z-20 flex items-center justify-center p-2 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-all shadow-sm backdrop-blur-sm border border-white/20 dark:border-gray-700/30"
                            title="Back to MCQs"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight drop-shadow-sm">
                            Quiz Library
                        </h1>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex p-1 bg-indigo-50/50 dark:bg-slate-800/50 rounded-xl border border-indigo-100/50 dark:border-slate-700/50 backdrop-blur-sm shadow-sm w-full sm:w-fit self-start">
                        <button
                            onClick={() => handleTabChange('created')}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg transition-all text-sm sm:text-base ${
                                activeTab === 'created'
                                ? 'bg-white dark:bg-slate-700 shadow-sm border border-indigo-100 dark:border-slate-600 font-bold text-indigo-700 dark:text-indigo-300'
                                : 'hover:bg-white/50 dark:hover:bg-slate-700/50 font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                            }`}
                        >
                            <BookOpen className="w-4 h-4" />
                            Created
                        </button>
                        <button
                            onClick={() => handleTabChange('attempted')}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg transition-all text-sm sm:text-base ${
                                activeTab === 'attempted'
                                ? 'bg-white dark:bg-slate-700 shadow-sm border border-indigo-100 dark:border-slate-600 font-bold text-emerald-700 dark:text-emerald-400'
                                : 'hover:bg-white/50 dark:hover:bg-slate-700/50 font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                            }`}
                        >
                            <CheckCircle className="w-4 h-4" />
                            Attempted
                        </button>
                    </div>
                </div>

                {/* Tab Content Container */}
                <div className="flex-1 relative">
                    <div style={{ display: activeTab === 'created' ? 'block' : 'none' }}>
                        <SavedQuizzesList viewMode={viewMode} setViewMode={setViewMode} sortMethod={sortMethod as any} setSortMethod={setSortMethod as any} />
                    </div>
                    <div style={{ display: activeTab === 'attempted' ? 'block' : 'none' }}>
                        <AttemptedQuizzesList viewMode={viewMode} setViewMode={setViewMode} sortMethod={sortMethod} setSortMethod={setSortMethod} />
                    </div>
                </div>
            </div>

            {/* --- CSS Keyframes & Accessibility --- */}
            <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 10s infinite;
                }
                @keyframes hue-slow {
                    0% { filter: hue-rotate(0deg); }
                    100% { filter: hue-rotate(360deg); }
                }
                .animate-hue-slow {
                    animation: hue-slow 20s linear infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                @media (prefers-reduced-motion: reduce) {
                    .animate-blob, .animate-hue-slow {
                        animation: none !important;
                        transform: none !important;
                    }
                }
            `}</style>
        </div>
    );
};
