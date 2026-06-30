import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SynonymWord } from '../../../../features/quiz/types';

interface ImposterGameProps {
    data: SynonymWord[];
    onCorrect: () => void;
    onWrong: () => void;
    round: number;
}

export const ImposterGame: React.FC<ImposterGameProps> = ({ data, onCorrect, onWrong, round }) => {
    const [question, setQuestion] = useState<{ baseWord: SynonymWord, options: string[], answer: string } | null>(null);
    const [timeLeft, setTimeLeft] = useState(10);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    // Setup question
    useEffect(() => {
        if (!data || data.length === 0) return;

        // Ensure the word has at least 3 synonyms
        const validWords = data.filter(w => w.synonyms && w.synonyms.length >= 3);
        if (validWords.length === 0) return;

        // Pick random base word (weighted by importance in data pre-sort)
        const baseWordIndex = Math.floor(Math.random() * Math.min(50, validWords.length));
        const baseWord = validWords[baseWordIndex];

        // Pick 3 synonyms
        const shuffledSynonyms = [...baseWord.synonyms].sort(() => 0.5 - Math.random());
        const selectedSynonyms = shuffledSynonyms.slice(0, 3).map(s => s.text);

        // Pick 1 imposter (antonym if available, else random unrelated word)
        let imposter = '';
        if (baseWord.antonyms && baseWord.antonyms.length > 0) {
            const shuffledAntonyms = [...baseWord.antonyms].sort(() => 0.5 - Math.random());
            imposter = shuffledAntonyms[0].text;
        } else {
            // Pick random word not in family
            const otherWords = data.filter(w => w.cluster_id !== baseWord.cluster_id && w.word !== baseWord.word);
            imposter = otherWords[Math.floor(Math.random() * otherWords.length)].word;
        }

        const options = [...selectedSynonyms, imposter].sort(() => 0.5 - Math.random());

        setQuestion({ baseWord, options, answer: imposter });
        setTimeLeft(10);
        setSelectedOption(null);
        setIsAnimating(false);
    }, [data, round]);

    // Timer logic
    useEffect(() => {
        if (selectedOption || timeLeft <= 0 || !question) return;

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
    }, [timeLeft, selectedOption, question]);

    const handleTimeUp = () => {
        setSelectedOption(question?.answer || ''); // Reveal answer
        setTimeout(() => {
            onWrong();
        }, 1500);
    };

    const handleSelect = (option: string) => {
        if (selectedOption || !question) return;

        setSelectedOption(option);
        setIsAnimating(true);

        setTimeout(() => {
            if (option === question.answer) {
                onCorrect();
            } else {
                onWrong();
            }
        }, 1500); // 1.5s delay to show correct answer and family
    };

    if (!question) return <div className="p-8 text-center text-slate-500">Loading Trap...</div>;

    const isTimerWarning = timeLeft <= 3 && !selectedOption;

    return (
        <div className={`flex flex-col h-full p-4 md:p-8 ${selectedOption && selectedOption !== question.answer ? 'animate-shake' : ''}`}>

            {/* Base Word Card */}
            <div className="flex-1 flex flex-col items-center justify-center mb-8 relative">

                {/* Timer Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mx-8">
                    <div
                        className={`h-full transition-all duration-1000 ease-linear ${isTimerWarning ? 'bg-rose-500' : 'bg-blue-500'}`}
                        style={{ width: `${(timeLeft / 10) * 100}%` }}
                    />
                </div>

                <div className={`text-6xl md:text-8xl font-black text-slate-800 dark:text-slate-100 mb-4 transition-transform ${isTimerWarning ? 'scale-105 text-rose-500 dark:text-rose-400' : ''}`}>
                    {question.baseWord.word}
                </div>

                <div className="text-xl md:text-2xl font-bold text-slate-500 dark:text-slate-400 mt-2 mb-8 uppercase tracking-widest flex items-center gap-3">
                    <span className="w-12 h-px bg-slate-300 dark:bg-slate-600"></span>
                    Find the Imposter
                    <span className="w-12 h-px bg-slate-300 dark:bg-slate-600"></span>
                </div>

                {/* Family Reveal (shows after selection) */}
                <div className={`transition-opacity duration-500 ${selectedOption ? 'opacity-100' : 'opacity-0'}`}>
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center px-4 max-w-md">
                        <strong>{question.baseWord.word}</strong>: {question.baseWord.hindiMeaning}
                    </p>
                </div>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8 max-w-2xl w-full mx-auto">
                {question.options.map(option => {

                    let bgClass = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:shadow-md";
                    let textClass = "text-slate-700 dark:text-slate-200";

                    if (selectedOption) {
                        if (option === question.answer) {
                            bgClass = "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-500";
                            textClass = "text-emerald-700 dark:text-emerald-300";
                        } else if (option === selectedOption && option !== question.answer) {
                            bgClass = "bg-rose-100 dark:bg-rose-900/40 border-rose-500";
                            textClass = "text-rose-700 dark:text-rose-300";
                        } else {
                            bgClass = "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 opacity-50";
                        }
                    }

                    return (
                        <button
                            key={option}
                            onClick={() => handleSelect(option)}
                            disabled={!!selectedOption}
                            className={`p-6 rounded-2xl border-2 text-xl font-bold transition-all transform active:scale-95 ${bgClass} ${textClass}`}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>

            {/* Flash Red on Wrong */}
            {selectedOption && selectedOption !== question.answer && (
                <div className="absolute inset-0 bg-rose-500/10 pointer-events-none animate-pulse"></div>
            )}
        </div>
    );
};
