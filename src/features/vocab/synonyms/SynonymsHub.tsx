import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavSpinner } from '../../../hooks/useNavSpinner';
import {  Loader2, ArrowLeft , BookOpen } from 'lucide-react';
import { SynonymWord } from '../../../features/quiz/types';
import { quizEngine } from '../../../features/quiz/engine';
import { SynapticLoader } from './SynapticLoader';
import { motion } from 'framer-motion';
import {
    DailyChallengeSVG,
    GuidedExplorationSVG,
    SmartFlashcardsSVG,
    WordFamiliesSVG,
    ImposterTrapSVG,
    TapConnectSVG,
    LightningReviewSVG
} from './components/SynonymsSVGs';

interface SynonymsHubProps {
    onBack: () => void;
    onStart: (data: SynonymWord[], filters: any, mode?: 'basic' | 'review') => void;
}

export const SynonymsHub: React.FC<SynonymsHubProps> = ({ onBack, onStart }) => {
    const navigate = useNavigate();
    const { loadingId, handleNavigation } = useNavSpinner();
    const [sortedData, setSortedData] = useState<SynonymWord[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Load and sort data
        const load = async () => {
            try {
                // In a real scenario, this might be a fetch or complex parse
                const parsed = await quizEngine.getPlugin<SynonymWord, string>('synonym').loadQuestions();
                parsed.sort((a, b) => (a.word || '').localeCompare(b.word || ''));
                setSortedData(parsed);
            } catch(e) {
                console.error("Failed to load synonyms data", e);
                setError(e as Error);
            } finally {
                setIsDataLoading(false);
            }
        };
        load();
    }, []);


    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
        }
    };


    if (isDataLoading) {
        return <SynapticLoader />;
    }

    if (error) {
        return (
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 md:p-8 items-center justify-center">
                 <div className="text-6xl mb-4" role="img" aria-hidden="true">⚠️</div>
                 <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">Failed to load vocabulary</h2>
                 <p className="text-slate-600 dark:text-slate-400 mb-6 text-center max-w-md">There was a problem loading the synonym data. Please check your connection and try again.</p>
                 <button
                    onClick={onBack}
                    className="px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl transition-colors font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                >
                    Go Back
                </button>
            </div>
        )
    }

    if (!isDataLoading && sortedData.length === 0) {
        return (
             <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 md:p-8 items-center justify-center">
                 <div className="text-6xl mb-4" role="img" aria-hidden="true">📭</div>
                 <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">No Vocabulary Available</h2>
                 <p className="text-slate-600 dark:text-slate-400 mb-6 text-center max-w-md">We couldn't find any words for you to learn at the moment. Please try again later.</p>
                 <button
                    onClick={onBack}
                    className="px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl transition-colors font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                >
                    Go Back
                </button>
            </div>
        )
    }


    return (
        <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-700 relative overflow-hidden bg-slate-50 dark:bg-slate-900">
            <div className="flex-1 flex flex-col space-y-6 py-4 relative z-10 animate-fade-in w-full">

                <button
                    onClick={onBack}
                    className="self-start mb-4 z-20 flex items-center justify-center p-2 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-all shadow-sm backdrop-blur-sm border border-white/20 dark:border-gray-700/30"
                    title="Go Back"
                 aria-label="Go back">
                    <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Header / Hero Section */}
                <div className="relative text-left w-full mt-2">
                    <div>
                        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-1 drop-shadow-sm">
                            Synonyms Master
                        </h1>
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-2 leading-relaxed font-medium">
                            Expand your vocabulary with guided learning, flashcards, and games.
                        </p>
                    </div>
                </div>

                {/* Sections Grid Wrapper */}
                <div className="w-full max-w-7xl mx-auto z-20 overflow-y-auto pb-24">

                    {/* --- Daily Challenge --- */}
                    <div className="mb-10">
                         <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 gap-4 sm:gap-6">

                            <motion.div
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleNavigation('daily-challenge', () => navigate('/vocab/synonyms/quiz?mode=speed'))}
                                className="relative group cursor-pointer w-full min-h-[120px] rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>
                                <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-sky-200/50 dark:border-b-sky-700/50 group-hover:border-sky-300 dark:group-hover:border-sky-500"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-sky-500"></div>

                                {loadingId === 'daily-challenge' && (
                                    <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                                        <Loader2 className="w-8 h-8 text-sky-500 animate-spin drop-shadow-md" />
                                    </div>
                                )}

                                <div className={`relative z-20 flex flex-row items-center justify-start gap-4 sm:gap-6 h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === 'daily-challenge' ? 'opacity-0' : 'opacity-100'}`}>
                                    <motion.div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 relative drop-shadow-xl" initial={{ scale: 0.9, opacity: 0.8 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
                                        <DailyChallengeSVG />
                                    </motion.div>
                                    <div className="flex flex-col items-start justify-center flex-1 text-left">
                                        <h3 className="text-lg sm:text-xl font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-sky-900 dark:from-sky-300 dark:to-sky-100 mb-1">Daily Challenge</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-semibold leading-snug">Master 20 important words every day.</p>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* --- Phase 1: Foundation --- */}
                    <div className="mb-10">
                        <h3 className="text-xl sm:text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200 pl-2">Phase 1: Foundation</h3>
                        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">

                            <motion.div
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleNavigation('guided-learning', () => navigate('/vocab/synonyms/phase1'))}
                                className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>
                                <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-amber-200/50 dark:border-b-amber-700/50 group-hover:border-amber-300 dark:group-hover:border-amber-500"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-amber-500"></div>

                                {loadingId === 'guided-learning' && (
                                    <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin drop-shadow-md" />
                                    </div>
                                )}

                                <div className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === 'guided-learning' ? 'opacity-0' : 'opacity-100'}`}>
                                    <motion.div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl" initial={{ scale: 0.9, opacity: 0.8 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
                                        <GuidedExplorationSVG />
                                    </motion.div>
                                    <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                                        <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-amber-900 dark:from-amber-300 dark:to-amber-100 mb-1 sm:mb-2">Guided Exploration</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">Discover meanings, translations, & audio.</p>
                                    </div>
                                </div>
                            </motion.div>

                        </motion.div>
                    </div>

                    {/* --- Phase 2: Learn & Master --- */}
                    <div className="mb-10">
                        <h3 className="text-xl sm:text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200 pl-2">Phase 2: Learn & Master</h3>
                        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">

                            {/* Smart Flashcards */}

                            {/* Saved Decks */}
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleNavigation('saved-decks', () => navigate('/vocab/synonyms/library'))}
                                className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>
                                <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-purple-200/50 dark:border-b-purple-700/50 group-hover:border-purple-300 dark:group-hover:border-purple-500"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-purple-500"></div>

                                <div className="relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300">
                                    <motion.div
                                        className="w-16 h-16 sm:w-24 sm:h-24 mb-4 sm:mb-6 relative flex items-center justify-center"
                                        animate={{ y: [0, -5, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-20 dark:opacity-40"></div>
                                        <BookOpen className="w-10 h-10 sm:w-14 sm:h-14 text-purple-600 dark:text-purple-400 drop-shadow-md" />
                                    </motion.div>
                                    <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                                        <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-900 dark:from-purple-300 dark:to-purple-100 mb-1 sm:mb-2">Saved Decks</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">Resume and review custom decks.</p>
                                    </div>
                                </div>
                            </motion.div>

<motion.div
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleNavigation('smart-flashcards', () => navigate('/vocab/synonyms/config'))}
                                className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>
                                <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-blue-200/50 dark:border-b-blue-700/50 group-hover:border-blue-300 dark:group-hover:border-blue-500"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-blue-500"></div>

                                {/* No loading ID check here originally since it directly starts, but we could add one if it takes time. Using a dummy for consistency if needed, but omitted to keep immediate feedback if possible, or we wrap it in a small timeout if we want the spinner. */}

                                <div className="relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 opacity-100">
                                    <motion.div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl" initial={{ scale: 0.9, opacity: 0.8 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
                                        <SmartFlashcardsSVG />
                                    </motion.div>
                                    <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                                        <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-900 dark:from-blue-300 dark:to-blue-100 mb-1 sm:mb-2">Smart Flashcards</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">Swipe through words and Master them.</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Word Families */}
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleNavigation('master-list', () => {
                                    onStart(sortedData, { mode: 'list' });
                                    navigate('/vocab/synonyms/list');
                                })}
                                className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>
                                <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-emerald-200/50 dark:border-b-emerald-700/50 group-hover:border-emerald-300 dark:group-hover:border-emerald-500"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-emerald-500"></div>

                                {loadingId === 'master-list' && (
                                    <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin drop-shadow-md" />
                                    </div>
                                )}

                                <div className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === 'master-list' ? 'opacity-0' : 'opacity-100'}`}>
                                    <motion.div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl" initial={{ scale: 0.9, opacity: 0.8 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
                                        <WordFamiliesSVG />
                                    </motion.div>
                                    <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                                        <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-900 dark:from-emerald-300 dark:to-emerald-100 mb-1 sm:mb-2">Word Families</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">Words grouped by meaning spectrum.</p>
                                    </div>
                                </div>
                            </motion.div>

                        </motion.div>
                    </div>

                    {/* --- Phase 3: Gamified Practice --- */}
                    <div className="mb-10">
                        <h3 className="text-xl sm:text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200 pl-2">Phase 3: Gamified Practice</h3>
                        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">

                            {/* Imposter Trap */}
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleNavigation('game-1', () => navigate('/vocab/synonyms/quiz?mode=imposter'))}
                                className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>
                                <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-violet-200/50 dark:border-b-violet-700/50 group-hover:border-violet-300 dark:group-hover:border-violet-500"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-violet-500"></div>

                                {loadingId === 'game-1' && (
                                    <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                                        <Loader2 className="w-8 h-8 text-violet-500 animate-spin drop-shadow-md" />
                                    </div>
                                )}

                                <div className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === 'game-1' ? 'opacity-0' : 'opacity-100'}`}>
                                    <motion.div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl" initial={{ scale: 0.9, opacity: 0.8 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
                                        <ImposterTrapSVG />
                                    </motion.div>
                                    <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                                        <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-violet-900 dark:from-violet-300 dark:to-violet-100 mb-1 sm:mb-2">The Imposter Trap</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">Spot the Antonym hiding among Synonyms.</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Tap & Connect */}
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleNavigation('game-2', () => navigate('/vocab/synonyms/quiz?mode=connect'))}
                                className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>
                                <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-rose-200/50 dark:border-b-rose-700/50 group-hover:border-rose-300 dark:group-hover:border-rose-500"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-rose-500"></div>

                                {loadingId === 'game-2' && (
                                    <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                                        <Loader2 className="w-8 h-8 text-rose-500 animate-spin drop-shadow-md" />
                                    </div>
                                )}

                                <div className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === 'game-2' ? 'opacity-0' : 'opacity-100'}`}>
                                    <motion.div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl" initial={{ scale: 0.9, opacity: 0.8 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
                                        <TapConnectSVG />
                                    </motion.div>
                                    <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                                        <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-rose-900 dark:from-rose-300 dark:to-rose-100 mb-1 sm:mb-2">Tap & Connect</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">Match main word with its synonym.</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Lightning Review */}
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleNavigation('game-3', () => navigate('/vocab/synonyms/quiz?mode=speed'))}
                                className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>
                                <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-indigo-200/50 dark:border-b-indigo-700/50 group-hover:border-indigo-300 dark:group-hover:border-indigo-500"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-indigo-500"></div>

                                {loadingId === 'game-3' && (
                                    <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin drop-shadow-md" />
                                    </div>
                                )}

                                <div className={`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 ${loadingId === 'game-3' ? 'opacity-0' : 'opacity-100'}`}>
                                    <motion.div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl" initial={{ scale: 0.9, opacity: 0.8 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
                                        <LightningReviewSVG />
                                    </motion.div>
                                    <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                                        <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-900 dark:from-indigo-300 dark:to-indigo-100 mb-1 sm:mb-2 flex items-center gap-1 justify-center">
                                            Lightning Review
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">Swipe through words with a 5s timer.</p>
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
