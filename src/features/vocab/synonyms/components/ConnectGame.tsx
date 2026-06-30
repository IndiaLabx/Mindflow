import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SynonymWord } from '../../../../features/quiz/types';

interface ConnectGameProps {
    data: SynonymWord[];
    onCorrect: () => void;
    onWrong: () => void;
    round: number;
}

export const ConnectGame: React.FC<ConnectGameProps> = ({ data, onCorrect, onWrong, round }) => {
    const [leftItems, setLeftItems] = useState<{ id: string, text: string }[]>([]);
    const [rightItems, setRightItems] = useState<{ id: string, text: string }[]>([]);
    const [matches, setMatches] = useState<{ [id: string]: string }>({}); // leftId -> rightId
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [selectedRight, setSelectedRight] = useState<string | null>(null);
    const [isAnimatingError, setIsAnimatingError] = useState(false);

    // Setup round
    useEffect(() => {
        if (!data || data.length === 0) return;

        const validWords = data.filter(w => w.synonyms && w.synonyms.length > 0);
        if (validWords.length < 4) return;

        // Pick 4 random base words (weighted by importance in data pre-sort)
        const selectedBases: SynonymWord[] = [];
        const usedIds = new Set();

        while (selectedBases.length < 4) {
            const index = Math.floor(Math.random() * Math.min(50, validWords.length));
            const word = validWords[index];
            if (!usedIds.has(word.word)) {
                selectedBases.push(word);
                usedIds.add(word.word);
            }
        }

        const left: { id: string, text: string }[] = [];
        const right: { id: string, text: string }[] = [];

        selectedBases.forEach(base => {
            const leftId = `L-${base.word}`;
            const rightId = `R-${base.word}`; // Match key is base word

            left.push({ id: leftId, text: base.word });

            // Pick a random synonym
            const randomSyn = base.synonyms[Math.floor(Math.random() * base.synonyms.length)].text;
            right.push({ id: rightId, text: randomSyn });
        });

        setLeftItems(left.sort(() => 0.5 - Math.random()));
        setRightItems(right.sort(() => 0.5 - Math.random()));
        setMatches({});
        setSelectedLeft(null);
        setSelectedRight(null);
        setIsAnimatingError(false);

    }, [data, round]);

    useEffect(() => {
        if (selectedLeft && selectedRight) {
            // Check match
            const baseLeft = selectedLeft.replace('L-', '');
            const baseRight = selectedRight.replace('R-', '');

            if (baseLeft === baseRight) {
                // Match Correct
                setMatches(prev => ({ ...prev, [selectedLeft]: selectedRight }));
                setSelectedLeft(null);
                setSelectedRight(null);

                // If all 4 matched, next round
                if (Object.keys(matches).length + 1 === 4) {
                    setTimeout(() => {
                        onCorrect();
                    }, 500);
                }
            } else {
                // Match Incorrect
                setIsAnimatingError(true);
                setTimeout(() => {
                    setIsAnimatingError(false);
                    setSelectedLeft(null);
                    setSelectedRight(null);
                    onWrong(); // Reset streak
                }, 800);
            }
        }
    }, [selectedLeft, selectedRight, matches, onCorrect, onWrong]);

    const handleLeftClick = (id: string) => {
        if (matches[id] || isAnimatingError) return;
        if (selectedLeft === id) setSelectedLeft(null);
        else setSelectedLeft(id);
    };

    const handleRightClick = (id: string) => {
        if (Object.values(matches).includes(id) || isAnimatingError) return;
        if (selectedRight === id) setSelectedRight(null);
        else setSelectedRight(id);
    };


    if (leftItems.length === 0) return <div className="p-8 text-center text-slate-500">Loading Connect Game...</div>;

    return (
        <div className="flex flex-col h-full p-4 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-center mb-8 text-slate-800 dark:text-slate-200">
                Match the Synonyms
            </h2>

            <div className={`grid grid-cols-2 gap-4 md:gap-8 max-w-3xl w-full mx-auto flex-1 ${isAnimatingError ? 'animate-shake' : ''}`}>

                {/* Left Column */}
                <div className="flex flex-col gap-4">
                    {leftItems.map(item => {
                        const isMatched = !!matches[item.id];
                        const isSelected = selectedLeft === item.id;

                        let btnClass = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:shadow-md text-slate-700 dark:text-slate-200";
                        if (isMatched) {
                            btnClass = "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 opacity-50 scale-95 pointer-events-none";
                        } else if (isSelected) {
                            btnClass = "bg-blue-100 dark:bg-blue-900/40 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/50 shadow-lg scale-105";
                        }

                        if (isSelected && isAnimatingError) {
                            btnClass = "bg-rose-100 dark:bg-rose-900/40 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/50";
                        }

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleLeftClick(item.id)}
                                className={`p-4 md:p-6 rounded-2xl border-2 text-lg md:text-xl font-bold transition-all transform active:scale-95 ${btnClass}`}
                            >
                                {item.text}
                            </button>
                        );
                    })}
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-4">
                    {rightItems.map(item => {
                        const isMatched = Object.values(matches).includes(item.id);
                        const isSelected = selectedRight === item.id;

                        let btnClass = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-pink-500 hover:shadow-md text-slate-700 dark:text-slate-200";
                        if (isMatched) {
                            btnClass = "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 opacity-50 scale-95 pointer-events-none";
                        } else if (isSelected) {
                            btnClass = "bg-pink-100 dark:bg-pink-900/40 border-pink-500 text-pink-700 dark:text-pink-300 ring-2 ring-pink-500/50 shadow-lg scale-105";
                        }

                        if (isSelected && isAnimatingError) {
                            btnClass = "bg-rose-100 dark:bg-rose-900/40 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/50";
                        }

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleRightClick(item.id)}
                                className={`p-4 md:p-6 rounded-2xl border-2 text-lg md:text-xl font-bold transition-all transform active:scale-95 ${btnClass}`}
                            >
                                {item.text}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Flash Red on Error */}
            {isAnimatingError && (
                <div className="absolute inset-0 bg-rose-500/10 pointer-events-none animate-pulse"></div>
            )}
        </div>
    );
};
