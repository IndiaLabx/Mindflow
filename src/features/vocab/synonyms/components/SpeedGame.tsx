import React, { useState, useEffect, useRef } from 'react';
import { SynonymWord } from '../../../../features/quiz/types';

interface SpeedGameProps {
    data: SynonymWord[];
    onCorrect: () => void;
    onWrong: () => void;
    round: number;
}

export const SpeedGame: React.FC<SpeedGameProps> = ({ data, onCorrect, onWrong, round }) => {
    const [question, setQuestion] = useState<{ baseWord: string, targetWord: string, isSynonym: boolean } | null>(null);
    const [timeLeft, setTimeLeft] = useState(5);
    const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);

    // Setup question
    useEffect(() => {
        if (!data || data.length === 0) return;

        const validWords = data.filter(w => w.synonyms && w.synonyms.length > 0);
        if (validWords.length === 0) return;

        // Pick random base word (weighted by importance in data pre-sort)
        const baseWordIndex = Math.floor(Math.random() * Math.min(100, validWords.length));
        const base = validWords[baseWordIndex];

        // Decide if we show a synonym (true) or random word (false)
        const isSynonym = Math.random() > 0.5;
        let targetWord = '';

        if (isSynonym) {
            targetWord = base.synonyms[Math.floor(Math.random() * base.synonyms.length)].text;
        } else {
            // Prefer antonym if available
            if (base.antonyms && base.antonyms.length > 0) {
                targetWord = base.antonyms[Math.floor(Math.random() * base.antonyms.length)].text;
            } else {
                // Pick random word not in family
                const otherWords = data.filter(w => w.cluster_id !== base.cluster_id && w.word !== base.word);
                targetWord = otherWords[Math.floor(Math.random() * otherWords.length)].word;
            }
        }

        setQuestion({ baseWord: base.word, targetWord, isSynonym });
        setTimeLeft(5);
        setSelectedAnswer(null);

    }, [data, round]);

    // Timer logic
    useEffect(() => {
        if (selectedAnswer !== null || timeLeft <= 0 || !question) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, selectedAnswer, question]);

    const handleTimeUp = () => {
        // Time up = wrong
        setSelectedAnswer(null);
        setTimeout(() => {
            onWrong();
        }, 800);
    };

    const handleAnswer = (answer: boolean) => {
        if (selectedAnswer !== null || !question) return;

        setSelectedAnswer(answer);

        setTimeout(() => {
            if (answer === question.isSynonym) {
                onCorrect(); // base score +10 is handled in parent
            } else {
                onWrong();
            }
        }, 800); // Quick delay for feedback
    };

    if (!question) return <div className="p-8 text-center text-slate-500">Loading Speed Test...</div>;

    const isTimerWarning = timeLeft <= 2 && selectedAnswer === null;
    const isCorrect = selectedAnswer === question.isSynonym;

    return (
        <div className={`flex flex-col h-full p-4 md:p-8 ${selectedAnswer !== null && !isCorrect ? 'animate-shake' : ''}`}>

            {/* Timer Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-slate-200 dark:bg-slate-700 rounded-none overflow-hidden mx-0">
                <div
                    className={`h-full transition-all duration-1000 ease-linear ${isTimerWarning ? 'bg-rose-500' : 'bg-amber-500'}`}
                    style={{ width: `${(timeLeft / 5) * 100}%` }}
                />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-lg mx-auto w-full">

                <div className="text-xl md:text-2xl font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">
                    Is it a Synonym?
                </div>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl w-full my-8 relative overflow-hidden">

                    {/* Background indicator on select */}
                    {selectedAnswer !== null && (
                        <div className={`absolute inset-0 ${isCorrect ? 'bg-emerald-500/10' : 'bg-rose-500/10'} transition-colors duration-300`}></div>
                    )}

                    <div className="text-4xl md:text-5xl font-black text-slate-800 dark:text-slate-100 mb-6">
                        {question.baseWord}
                    </div>

                    <div className="flex justify-center my-4">
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center text-2xl shadow-inner">
                            ↓
                        </div>
                    </div>

                    <div className="text-4xl md:text-5xl font-black text-blue-600 dark:text-blue-400 mt-6">
                        {question.targetWord}
                    </div>
                </div>

                {/* Yes/No Buttons */}
                <div className="grid grid-cols-2 gap-4 w-full">
                    <button
                        onClick={() => handleAnswer(false)}
                        disabled={selectedAnswer !== null}
                        className={`py-6 rounded-2xl border-4 text-2xl font-black transition-transform transform active:scale-95
                            ${selectedAnswer === false
                                ? (isCorrect ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-rose-100 border-rose-500 text-rose-700')
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-rose-400 text-slate-700 dark:text-slate-200'
                            }`}
                    >
                        ✖ NO
                    </button>

                    <button
                        onClick={() => handleAnswer(true)}
                        disabled={selectedAnswer !== null}
                        className={`py-6 rounded-2xl border-4 text-2xl font-black transition-transform transform active:scale-95
                            ${selectedAnswer === true
                                ? (isCorrect ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-rose-100 border-rose-500 text-rose-700')
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-400 text-slate-700 dark:text-slate-200'
                            }`}
                    >
                        ✔ YES
                    </button>
                </div>

            </div>

            {/* Flash Red on Wrong */}
            {selectedAnswer !== null && !isCorrect && (
                <div className="absolute inset-0 bg-rose-500/10 pointer-events-none animate-pulse z-50"></div>
            )}

            {/* Flash Red on Time Up */}
            {timeLeft <= 0 && selectedAnswer === null && (
                <div className="absolute inset-0 bg-rose-500/10 pointer-events-none animate-pulse z-50"></div>
            )}
        </div>
    );
};
