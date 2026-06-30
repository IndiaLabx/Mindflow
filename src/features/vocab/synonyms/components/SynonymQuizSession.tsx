import { useSynonymsData } from '../hooks/useSynonymsData';
import React, { useState, useEffect, useMemo } from 'react';
import { SynonymWord } from '../../../../features/quiz/types';
import { quizEngine } from '../../../../features/quiz/engine';
import { ImposterGame } from './ImposterGame';
import { ConnectGame } from './ConnectGame';
import { SpeedGame } from './SpeedGame';
import { SynapticLoader } from '../../../../components/ui/SynapticLoader';

interface SynonymQuizSessionProps {
    onExit: () => void;
}

export const SynonymQuizSession: React.FC<SynonymQuizSessionProps> = ({ onExit }) => {
    const [mode, setMode] = useState<'imposter' | 'connect' | 'speed' | null>(null);
    const [data, setData] = useState<SynonymWord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Game State
    const [gameState, setGameState] = useState<'playing' | 'results'>('playing');
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [startTime, setStartTime] = useState(Date.now());
    const [timeSpentMs, setTimeSpentMs] = useState(0);

    const TOTAL_ROUNDS = 10;
    const [currentRound, setCurrentRound] = useState(1);

    const { data: fetchedData, isLoading: isDataLoading } = useSynonymsData();

    useEffect(() => {
        // Parse mode from hash routing manually since we're outside standard react-router in this block
        const hash = window.location.hash;
        const searchParams = new URLSearchParams(hash.split('?')[1] || '');
        const modeParam = searchParams.get('mode') as 'imposter' | 'connect' | 'speed' | null;
        setMode(modeParam || 'imposter');
    }, []);

    useEffect(() => {
        if (!isDataLoading && fetchedData) {
            const parsedData = [...fetchedData];
            // Sort by importance to prefer high frequency
            parsedData.sort((a, b) => b.importance_score - a.importance_score);
            setData(parsedData);
            setIsLoading(false);
        }
    }, [isDataLoading, fetchedData]);

    const handleCorrect = (bonus: number = 0) => {
        if ('vibrate' in navigator) navigator.vibrate(50);

        setStreak(prev => {
            const nextStreak = prev + 1;
            if (nextStreak > bestStreak) setBestStreak(nextStreak);
            return nextStreak;
        });
        setCorrectCount(prev => prev + 1);

        setScore(prev => {
            let multiplier = 1;
            if (streak + 1 >= 5) multiplier = 3;
            else if (streak + 1 >= 3) multiplier = 2;
            return prev + (10 * multiplier) + bonus;
        });

        advanceRound();
    };

    const handleWrong = () => {
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);

        setStreak(0);
        setWrongCount(prev => prev + 1);
        setScore(prev => Math.max(0, prev - 5));

        advanceRound();
    };

    const advanceRound = () => {
        if (currentRound >= TOTAL_ROUNDS) {
            setTimeSpentMs(Date.now() - startTime);
            setGameState('results');
        } else {
            setCurrentRound(prev => prev + 1);
        }
    };

    const handlePlayAgain = () => {
        setScore(0);
        setStreak(0);
        setBestStreak(0);
        setCorrectCount(0);
        setWrongCount(0);
        setCurrentRound(1);
        setStartTime(Date.now());
        setGameState('playing');
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-slate-500">
                <SynapticLoader size="xl" className="mb-4" />
                <p className="text-lg font-medium animate-pulse">Loading Game Engine...</p>
            </div>
        );
    }

    if (gameState === 'results') {
        const accuracy = Math.round((correctCount / TOTAL_ROUNDS) * 100) || 0;
        const timeSpentStr = `${Math.floor(timeSpentMs / 1000)}s`;

        return (
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 md:p-8 overflow-y-auto">
                <div className="max-w-md w-full mx-auto mt-8 bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 text-center relative overflow-hidden">
                    {/* Confetti or flair could go here */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

                    <h2 className="text-3xl font-bold mb-2">Session Complete!</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">Great job expanding your vocabulary.</p>

                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-2">
                        {score}
                    </div>
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Total Score</div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl">
                            <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">{accuracy}%</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-1">Accuracy</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl">
                            <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">x{bestStreak}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-1">Best Streak</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl">
                            <div className="text-2xl font-bold text-emerald-500">{correctCount}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-1">Correct</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl">
                            <div className="text-2xl font-bold text-rose-500">{wrongCount}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-1">Wrong</div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handlePlayAgain}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-lg shadow-md shadow-blue-500/20"
                        >
                            Play Again
                        </button>
                        <button
                            onClick={onExit}
                            className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors"
                        >
                            Back to Config
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentMultiplier = streak >= 4 ? 3 : streak >= 2 ? 2 : 1;

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            {/* Game Header */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 shadow-sm z-10 shrink-0">
                <button
                    onClick={onExit}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                    ✕
                </button>

                {/* Score & Streak */}
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            {score}
                        </span>
                        {currentMultiplier > 1 && (
                            <span className="text-xs font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 rounded-md">
                                x{currentMultiplier}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-1 mt-1">
                        {/* Streak dots */}
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${i < streak ? 'bg-amber-400' : 'bg-slate-200 dark:bg-slate-700'}`}
                            />
                        ))}
                    </div>
                </div>

                <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    {currentRound} / {TOTAL_ROUNDS}
                </div>
            </div>

            {/* Game Area */}
            <div className="flex-1 overflow-hidden relative">
                {mode === 'imposter' && <ImposterGame data={data} onCorrect={() => handleCorrect()} onWrong={handleWrong} round={currentRound} />}
                {mode === 'connect' && <ConnectGame data={data} onCorrect={() => handleCorrect()} onWrong={handleWrong} round={currentRound} />}
                {mode === 'speed' && <SpeedGame data={data} onCorrect={() => handleCorrect()} onWrong={handleWrong} round={currentRound} />}
            </div>
        </div>
    );
};
