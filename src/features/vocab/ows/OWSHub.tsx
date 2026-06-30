import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavSpinner } from '../../../hooks/useNavSpinner';
import { Loader2, ArrowLeft, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

// Using the same Smart Flashcards SVG component as synonyms
import { SmartFlashcardsSVG } from '../synonyms/components/SynonymsSVGs';
import { SavedQuizzesSVG } from '../../../features/quiz/components/DashboardSVGs';
import { ChevronRight } from 'lucide-react';

interface OWSHubProps {
    onBack: () => void;
}

export const OWSHub: React.FC<OWSHubProps> = ({ onBack }) => {
    const navigate = useNavigate();
    const { loadingId, handleNavigation } = useNavSpinner();

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden relative -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
            {/* Background elements (similar to SynonymsHub) */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 flex flex-col min-h-screen w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <header className="flex flex-col gap-6 mb-8 pt-4">
                    <button onClick={onBack} className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center transition-colors font-semibold uppercase tracking-widest text-xs w-fit">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </button>

                    <div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight drop-shadow-sm">
                            One Word <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">Substitution</span>
                        </h1>
                        <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl font-medium leading-relaxed">
                            Master frequently asked one word substitutions through smart flashcards and adaptive learning.
                        </p>
                    </div>
                </header>

                <div className="flex-1 flex flex-col space-y-12 pb-12">
                    {/* Core Learning Section */}
                    <div>
                        <div className="mb-6 flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Core Learning</h2>
                            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                        </div>

                        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full max-w-7xl mx-auto z-20">


                            {/* Saved Decks */}
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleNavigation('saved-decks', () => navigate('/vocab/ows/library'))}
                                className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>
                                <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-teal-200/50 dark:border-b-teal-700/50 group-hover:border-teal-300 dark:group-hover:border-teal-500"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-teal-500"></div>

                                {loadingId === 'saved-decks' && (
                                    <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                                        <Loader2 className="w-8 h-8 text-teal-500 animate-spin drop-shadow-md" />
                                    </div>
                                )}

                                <div className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === 'saved-decks' ? 'opacity-0' : 'opacity-100'}`}>


                                    <motion.div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl" initial={{ scale: 0.9, opacity: 0.8 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
                                        <SavedQuizzesSVG />
                                    </motion.div>

                                    <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                                        <div className="flex items-center justify-center mb-1 sm:mb-2 gap-1">
                                            <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-teal-900 dark:from-teal-300 dark:to-teal-100">
                                                Saved Decks
                                            </h3>
                                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">Resume and review your custom saved decks.</p>
                                    </div>
                                </div>
                            </motion.div>


                            {/* Smart Flashcards */}
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleNavigation('smart-flashcards', () => navigate('/vocab/ows/config'))}
                                className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>
                                <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-blue-200/50 dark:border-b-blue-700/50 group-hover:border-blue-300 dark:group-hover:border-blue-500"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-blue-500"></div>

                                {loadingId === 'smart-flashcards' && (
                                    <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin drop-shadow-md" />
                                    </div>
                                )}

                                <div className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === 'smart-flashcards' ? 'opacity-0' : 'opacity-100'}`}>
                                    <div className="absolute top-4 right-4 z-30">
                                        <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-sm">
                                            Spaced Repetition
                                        </span>
                                    </div>

                                    <motion.div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl" initial={{ scale: 0.9, opacity: 0.8 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
                                        <SmartFlashcardsSVG />
                                    </motion.div>
                                    <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                                        <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-900 dark:from-blue-300 dark:to-blue-100 mb-1 sm:mb-2">Smart Flashcards</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">Swipe through personalized OWS sets based on mastery.</p>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};
