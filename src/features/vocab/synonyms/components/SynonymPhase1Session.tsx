import { useSynonymsData } from '../hooks/useSynonymsData';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SynonymWord } from '../../../../features/quiz/types';
import { quizEngine } from '../../../../features/quiz/engine';
// Define the shape of our chunked/alphabetical groups
interface WordGroup {
    name: string;
    words: SynonymWord[];
}

export const SynonymPhase1Session: React.FC = () => {
    const navigate = useNavigate();

    // Core State
    const [vocabularyGroups, setVocabularyGroups] = useState<WordGroup[]>([]);
    const [currentGroupIndex, setCurrentGroupIndex] = useState<number>(-1);
    const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);

    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [detailsVisible, setDetailsVisible] = useState(false);
    const [allSynonymsExpanded, setAllSynonymsExpanded] = useState(false);
    const [allAntonymsExpanded, setAllAntonymsExpanded] = useState(false);
    const [groupingMode, setGroupingMode] = useState<'chunked' | 'alphabetical'>('chunked');

    // Expanded groups in nav panel
    const [expandedGroupIdx, setExpandedGroupIdx] = useState<number | null>(null);

    // Refs for animations
    const wordDisplayRef = useRef<HTMLDivElement>(null);

    const { data: fetchedData, isLoading: isDataLoading } = useSynonymsData();

    // Load and process data based on grouping mode
    useEffect(() => {
        if (isDataLoading) return;
        setIsLoading(true);
        const parsed: SynonymWord[] = []; // Replaced by async load

        // Ensure some basic sorting so chunking is deterministic
        const sortedData = [...fetchedData].sort((a, b) => a.word.localeCompare(b.word));

        let groups: WordGroup[] = [];

        if (groupingMode === 'chunked') {
            const chunkSize = 50;
            for (let i = 0; i < sortedData.length; i += chunkSize) {
                const chunk = sortedData.slice(i, i + chunkSize);
                groups.push({
                    name: `Group ${Math.floor(i / chunkSize) + 1} (${i + 1}-${i + chunk.length})`,
                    words: chunk
                });
            }
        } else {
            // Alphabetical grouping
            const map = new Map<string, SynonymWord[]>();
            sortedData.forEach(wordObj => {
                const firstLetter = wordObj.word.charAt(0).toUpperCase();
                if (!map.has(firstLetter)) {
                    map.set(firstLetter, []);
                }
                map.get(firstLetter)!.push(wordObj);
            });

            // Convert map to sorted array
            groups = Array.from(map.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([letter, words]) => ({
                    name: `Letter ${letter}`,
                    words
                }));
        }

        setVocabularyGroups(groups);

        // Auto-load first group if nothing loaded yet, or if grouping changed
        if (groups.length > 0) {
            setCurrentGroupIndex(0);
            setCurrentWordIndex(0);
            setExpandedGroupIdx(0);
        } else {
            setCurrentGroupIndex(-1);
            setCurrentWordIndex(-1);
        }

        setIsLoading(false);
    }, [groupingMode, fetchedData, isDataLoading]);

    // Handle Word Display Animation restart
    useEffect(() => {
        if (wordDisplayRef.current) {
            wordDisplayRef.current.style.animation = 'none';
            void wordDisplayRef.current.offsetWidth; // trigger reflow
            wordDisplayRef.current.style.animation = 'wordAppear 0.6s ease-out, oscillateWord 4s ease-in-out infinite 0.7s';
        }
    }, [currentWordIndex, currentGroupIndex]);

    const handleExit = () => {
        navigate('/synonyms/config');
    };

    const toggleNav = () => setIsNavOpen(!isNavOpen);

    const loadGroup = (idx: number) => {
        setCurrentGroupIndex(idx);
        setCurrentWordIndex(0);
        setDetailsVisible(false);
        setAllSynonymsExpanded(false);
        setAllAntonymsExpanded(false);
        setExpandedGroupIdx(idx);
        if (window.innerWidth <= 768) {
            setIsNavOpen(false);
        }
    };

    const jumpToWord = (wordIdx: number) => {
        setCurrentWordIndex(wordIdx);
        setDetailsVisible(false);
        setAllSynonymsExpanded(false);
        setAllAntonymsExpanded(false);
        if (window.innerWidth <= 768) {
            setIsNavOpen(false);
        }
    };

    const nextWord = () => {
        if (currentGroupIndex === -1 || currentWordIndex === -1) return;

        const currentGroup = vocabularyGroups[currentGroupIndex];
        if (currentWordIndex < currentGroup.words.length - 1) {
            setCurrentWordIndex(currentWordIndex + 1);
            setDetailsVisible(false);
            setAllSynonymsExpanded(false);
            setAllAntonymsExpanded(false);
        } else {
            // End of group
            if (currentGroupIndex < vocabularyGroups.length - 1) {
                if (window.confirm("You've reached the end of this group. Load the next group?")) {
                    loadGroup(currentGroupIndex + 1);
                }
            } else {
                alert("Congratulations! You've reached the end of all vocabulary groups!");
            }
        }
    };

    const prevWord = () => {
        if (currentGroupIndex === -1 || currentWordIndex === -1) return;

        if (currentWordIndex > 0) {
            setCurrentWordIndex(currentWordIndex - 1);
            setDetailsVisible(false);
            setAllSynonymsExpanded(false);
            setAllAntonymsExpanded(false);
        } else {
            // Start of group
            if (currentGroupIndex > 0) {
                if (window.confirm("You are at the first word of this group. Load the previous group?")) {
                    const prevGroupIdx = currentGroupIndex - 1;
                    setCurrentGroupIndex(prevGroupIdx);
                    setCurrentWordIndex(vocabularyGroups[prevGroupIdx].words.length - 1);
                    setExpandedGroupIdx(prevGroupIdx);
                    setDetailsVisible(false);
                    setAllSynonymsExpanded(false);
                    setAllAntonymsExpanded(false);
                }
            }
        }
    };

    const toggleDetails = () => setDetailsVisible(!detailsVisible);

    const speakWord = () => {
        if (!window.speechSynthesis || currentGroupIndex === -1 || currentWordIndex === -1) return;

        const wordToSpeak = vocabularyGroups[currentGroupIndex].words[currentWordIndex].word;
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(wordToSpeak);
        const voices = window.speechSynthesis.getVoices();

        // Try to find an English voice, prefer male based on original HTML logic
        let targetVoice = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('male'));
        if (!targetVoice) targetVoice = voices.find(v => v.lang.startsWith('en'));
        if (!targetVoice && voices.length > 0) targetVoice = voices[0];

        if (targetVoice) utterance.voice = targetVoice;
        utterance.rate = 0.9;

        window.speechSynthesis.speak(utterance);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

            if (e.key === 'Escape' && isNavOpen) {
                setIsNavOpen(false);
                return;
            }
            if (isNavOpen) return;

            switch(e.key.toLowerCase()) {
                case 'n': case 'arrowright': nextWord(); break;
                case 'p': case 'arrowleft': prevWord(); break;
                case 'd': toggleDetails(); break;
                case 's': speakWord(); break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isNavOpen, currentGroupIndex, currentWordIndex, detailsVisible]);

    // Helpers
    const calculateOverallWordNumber = () => {
        if (currentGroupIndex === -1) return 0;
        let total = 0;
        for (let i = 0; i < currentGroupIndex; i++) {
            total += vocabularyGroups[i].words.length;
        }
        total += (currentWordIndex + 1);
        return total;
    };

    const totalWordsOverall = vocabularyGroups.reduce((acc, g) => acc + g.words.length, 0);

    if (isLoading || vocabularyGroups.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center text-white">
                <div className="animate-pulse text-2xl font-bold">Loading Vocabulary...</div>
            </div>
        );
    }

    const currentGroup = vocabularyGroups[currentGroupIndex];
    const currentWordObj = currentGroup?.words[currentWordIndex];

    const hasMainMeaning = currentWordObj && !!(currentWordObj.meaning || currentWordObj.hindiMeaning);
    const hasSynonyms = currentWordObj && currentWordObj.synonyms && currentWordObj.synonyms.length > 0;
    const hasAntonyms = currentWordObj && currentWordObj.antonyms && currentWordObj.antonyms.length > 0;
    const canShowDetails = hasMainMeaning || hasSynonyms || hasAntonyms;

    return (
        <div className="min-h-screen relative flex flex-col font-sans transition-all duration-300"
             style={{
                 background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                 marginLeft: (isNavOpen && window.innerWidth > 768) ? '300px' : '0'
             }}>

            {/* Animated Background Overlay */}
            <div className="fixed inset-0 pointer-events-none z-0" style={{
                background: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)'
            }}></div>

            <style>{`
                @keyframes wordAppear {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes oscillateWord {
                    0%, 100% { transform: translateX(-8px); }
                    50% { transform: translateX(8px); }
                }
                @keyframes detailsSlideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* --- Navigation Panel --- */}
            <div
                className={`fixed top-0 left-0 w-[300px] h-full bg-white/10 dark:bg-slate-900/80 backdrop-blur-xl border-r border-white/20 z-50 transition-transform duration-300 ${isNavOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Header & Controls */}
                <div className="p-4 pt-8 border-b border-white/10 text-white flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h2 className="font-bold text-lg">Vocabulary Index</h2>
                        <button onClick={toggleNav} className="text-white/70 hover:text-white p-2">✕</button>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex bg-black/20 rounded-lg p-1 text-sm font-medium">
                        <button
                            className={`flex-1 py-1.5 rounded-md transition-colors ${groupingMode === 'chunked' ? 'bg-indigo-500 text-white shadow' : 'text-white/60 hover:text-white'}`}
                            onClick={() => setGroupingMode('chunked')}
                        >
                            Batches (50)
                        </button>
                        <button
                            className={`flex-1 py-1.5 rounded-md transition-colors ${groupingMode === 'alphabetical' ? 'bg-indigo-500 text-white shadow' : 'text-white/60 hover:text-white'}`}
                            onClick={() => setGroupingMode('alphabetical')}
                        >
                            A-Z
                        </button>
                    </div>
                </div>

                {/* Group List */}
                <div className="overflow-y-auto h-[calc(100%-140px)] pb-20">
                    {vocabularyGroups.map((group, gIdx) => (
                        <div key={gIdx} className="border-b border-white/5">
                            <div
                                className={`flex justify-between items-center p-4 cursor-pointer hover:bg-white/5 transition-colors ${expandedGroupIdx === gIdx ? 'bg-white/10' : ''}`}
                                onClick={() => setExpandedGroupIdx(expandedGroupIdx === gIdx ? null : gIdx)}
                            >
                                <span className="font-semibold text-white/90 text-sm truncate pr-2">{group.name}</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="text-xs px-3 py-1 bg-gradient-to-r from-blue-400 to-cyan-400 text-white rounded shadow-sm hover:scale-105 transition-transform"
                                        onClick={(e) => { e.stopPropagation(); loadGroup(gIdx); }}
                                    >
                                        Load
                                    </button>
                                    <span className={`text-white/50 transition-transform duration-200 ${expandedGroupIdx === gIdx ? 'rotate-90' : ''}`}>
                                        ▶
                                    </span>
                                </div>
                            </div>

                            {/* Expandable Words List */}
                            {expandedGroupIdx === gIdx && (
                                <div className="bg-black/10 p-4">
                                    <div className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] gap-2">
                                        {group.words.length === 0 ? (
                                            <div className="col-span-full text-center text-white/50 py-2 text-sm">No words.</div>
                                        ) : (
                                            group.words.map((w, wIdx) => {
                                                const isActive = currentGroupIndex === gIdx && currentWordIndex === wIdx;
                                                return (
                                                    <button
                                                        key={w.id || wIdx}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (currentGroupIndex !== gIdx) {
                                                                if(window.confirm(`Load ${group.name}?`)) {
                                                                    setCurrentGroupIndex(gIdx);
                                                                    jumpToWord(wIdx);
                                                                }
                                                            } else {
                                                                jumpToWord(wIdx);
                                                            }
                                                        }}
                                                        className={`h-10 flex items-center justify-center rounded text-sm font-medium transition-all ${
                                                            isActive
                                                                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/30'
                                                                : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10 hover:border-white/30'
                                                        }`}
                                                    >
                                                        {wIdx + 1}
                                                    </button>
                                                )
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Nav Overlay */}
            {isNavOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity md:hidden"
                    onClick={toggleNav}
                ></div>
            )}

            {/* Nav Trigger Button */}
            <button
                onClick={toggleNav}
                className="fixed top-5 left-5 w-14 h-14 bg-white/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white text-xl z-30 shadow-lg hover:bg-white/30 hover:scale-110 transition-all"
             aria-label="Toggle navigation menu">
                {isNavOpen ? '✕' : '☰'}
            </button>

            {/* Exit Button */}
            <button
                onClick={handleExit}
                className="fixed top-5 right-5 h-14 px-6 bg-white/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white font-medium z-30 shadow-lg hover:bg-white/30 hover:-translate-x-1 transition-all"
            >
                Exit
            </button>

            {/* --- Main Content Area --- */}
            {currentWordObj ? (
                <div className="flex-1 flex flex-col items-center pt-16 md:pt-24 pb-20 px-4 md:px-8 z-10 w-full max-w-4xl mx-auto animate-[containerFadeIn_0.8s_ease-out]">

                    <div className="w-full bg-white/20 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
                        {/* Inner Gradient Decor */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-white/10 pointer-events-none -z-10"></div>

                        {/* Stats Header */}
                        <div className="flex flex-wrap justify-between items-center gap-4 border-b-2 border-white/20 pb-5 mb-5">
                            <div className="flex gap-4 w-full md:w-auto">
                                <div className="bg-black/20 backdrop-blur-md px-4 py-2 rounded border border-white/30 font-semibold text-white shadow-sm flex-1 md:flex-none text-center">
                                    Group: {currentWordIndex + 1} / {currentGroup?.words.length}
                                </div>
                                <div className="bg-black/20 backdrop-blur-md px-4 py-2 rounded border border-white/30 font-semibold text-white shadow-sm flex-1 md:flex-none text-center">
                                    Total: {calculateOverallWordNumber()} / {totalWordsOverall}
                                </div>
                            </div>
                        </div>

                        {/* Group Title */}
                        <div className="text-white/80 font-semibold mb-4 bg-white/10 p-3 rounded-lg border-l-4 border-white/50">
                            📚 {currentGroup?.name}
                        </div>

                        {/* Word Presentation */}
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 my-8">
                            <h1
                                ref={wordDisplayRef}
                                className="text-5xl md:text-8xl font-extrabold text-white text-center break-all sm:break-words drop-shadow-xl flex-wrap"
                            >
                                {currentWordObj.word}
                            </h1>
                            <button
                                onClick={speakWord}
                                className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-2xl flex items-center justify-center shadow-lg hover:scale-110 hover:rotate-12 active:scale-95 transition-all flex-shrink-0"
                                title="Pronounce word"
                            >
                                🔊
                            </button>
                        </div>

                        {/* POS & Tags */}
                        <div className="text-center mb-8">
                            {currentWordObj.pos && (
                                <span className="text-lg md:text-xl italic text-white/90 font-medium mr-3">({currentWordObj.pos})</span>
                            )}
                            {currentWordObj.repetition_raw && (
                                <span className="bg-gradient-to-r from-pink-400 to-yellow-400 text-white font-bold px-3 py-1 rounded text-sm shadow-sm inline-block">
                                    {currentWordObj.repetition_raw.split(' ')[0]}
                                </span>
                            )}
                        </div>

                                                {/* Expandable Details Area */}
                        {detailsVisible && canShowDetails && (
                            <div className="w-full flex flex-col gap-6 mb-8 animate-[detailsSlideDown_0.3s_ease-out]">

                                {/* Meaning */}
                                {hasMainMeaning && (
                                    <div className="bg-gradient-to-br from-blue-400/20 to-cyan-400/20 border border-blue-400/30 border-l-4 border-l-blue-400 p-6 rounded-2xl backdrop-blur-md text-white shadow-md">
                                        <h3 className="font-bold text-xl mb-4 bg-white/10 inline-block px-4 py-2 rounded-lg backdrop-blur-md border border-white/20">Meaning</h3>
                                        {currentWordObj.meaning && (
                                            <div className="bg-black/20 p-4 rounded-xl text-lg mb-3 shadow-inner border border-white/10">
                                                {currentWordObj.meaning}
                                            </div>
                                        )}
                                        {currentWordObj.hindiMeaning && (
                                            <div className="bg-orange-500/20 border-l-4 border-orange-400 p-4 rounded-xl text-lg font-medium shadow-inner">
                                                हिन्दी अर्थ: {currentWordObj.hindiMeaning}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Synonyms */}
                                {hasSynonyms && (
                                    <div className="bg-gradient-to-br from-emerald-400/20 to-teal-400/20 border border-emerald-400/30 border-l-4 border-l-emerald-400 p-6 rounded-2xl backdrop-blur-md text-white shadow-md">
                                        <div className="flex items-center gap-3 mb-4">
                                            <h3 className="font-bold text-xl bg-white/10 inline-block px-4 py-2 rounded-lg backdrop-blur-md border border-white/20 m-0">Synonyms</h3>
                                            <button
                                                onClick={() => setAllSynonymsExpanded(!allSynonymsExpanded)}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all text-white/70 hover:text-white"
                                                title={allSynonymsExpanded ? "Collapse all" : "Expand all"}
                                            >
                                                <span className={`transition-transform duration-300 ${allSynonymsExpanded ? 'rotate-90' : ''}`}>
                                                    ▶
                                                </span>
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {currentWordObj.synonyms!.map((syn, idx) => (
                                                <ExpandableListItem key={idx} item={syn} isHindi={true} accentColor="emerald" forceExpanded={allSynonymsExpanded} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Antonyms */}
                                {hasAntonyms && (
                                    <div className="bg-gradient-to-br from-pink-400/20 to-rose-400/20 border border-pink-400/30 border-l-4 border-l-pink-400 p-6 rounded-2xl backdrop-blur-md text-white shadow-md">
                                        <div className="flex items-center gap-3 mb-4">
                                            <h3 className="font-bold text-xl bg-white/10 inline-block px-4 py-2 rounded-lg backdrop-blur-md border border-white/20 m-0">Antonyms</h3>
                                            <button
                                                onClick={() => setAllAntonymsExpanded(!allAntonymsExpanded)}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all text-white/70 hover:text-white"
                                                title={allAntonymsExpanded ? "Collapse all" : "Expand all"}
                                            >
                                                <span className={`transition-transform duration-300 ${allAntonymsExpanded ? 'rotate-90' : ''}`}>
                                                    ▶
                                                </span>
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {currentWordObj.antonyms!.map((ant, idx) => (
                                                <ExpandableListItem key={idx} item={ant} isHindi={true} accentColor="pink" forceExpanded={allAntonymsExpanded} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Controls */}
                        <div className="flex flex-row items-center justify-center gap-4 md:gap-6 mt-8 w-full">
                            <button
                                onClick={prevWord}
                                disabled={currentGroupIndex === 0 && currentWordIndex === 0}
                                className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm md:text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all flex items-center justify-center flex-shrink-0"
                            >
                                Prev
                            </button>

                            <button
                                onClick={toggleDetails}
                                disabled={!canShowDetails}
                                className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-600 text-slate-900 font-bold text-xs md:text-sm leading-tight shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-center p-1 md:p-2 flex-shrink-0"
                                style={{ background: canShowDetails ? 'linear-gradient(135deg, #e7dfdb 0%, #b49b79 100%)' : 'gray' }}
                             aria-label="Toggle details">
                                {detailsVisible ? 'Hide Details' : 'Show Details'}
                            </button>

                            <button
                                onClick={nextWord}
                                disabled={currentGroupIndex === vocabularyGroups.length - 1 && currentWordIndex === currentGroup.words.length - 1}
                                className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm md:text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all flex items-center justify-center flex-shrink-0"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-white z-10">
                    <div className="text-xl">Please select a group from the index.</div>
                </div>
            )}
        </div>
    );
};



// Helper component for Synonym/Antonym list items
const ExpandableListItem: React.FC<{item: any, isHindi?: boolean, accentColor: string, forceExpanded?: boolean}> = ({item, isHindi, accentColor, forceExpanded}) => {
    const [expanded, setExpanded] = React.useState(false);

    React.useEffect(() => {
        if (forceExpanded !== undefined) {
            setExpanded(forceExpanded);
        }
    }, [forceExpanded]);

    // Safety check
    if (!item || !item.text) return null;

    const hasDetails = !!(item.pos || item.meaning || item.hindiMeaning);

    return (
        <div className="bg-black/20 rounded-lg border border-white/10 overflow-hidden transition-all duration-300">
            <div
                className={`p-4 flex items-center cursor-pointer hover:bg-white/10 transition-colors ${!hasDetails ? 'cursor-default' : ''}`}
                onClick={() => hasDetails && setExpanded(!expanded)}
            >
                <div className="w-6 flex justify-center text-white/70">
                    {hasDetails && (
                        <span className={`transition-transform duration-300 ${expanded ? 'rotate-90' : ''}`}>
                            ▶
                        </span>
                    )}
                </div>
                <span className="font-bold text-base md:text-lg flex-1 text-white break-words">{item.text}</span>
            </div>

            {expanded && hasDetails && (
                <div className="p-4 pt-0 pl-10 bg-black/10 border-t border-white/10 text-sm animate-[detailsSlideDown_0.2s_ease-out] text-white">
                    {item.pos && (
                        <div className="mb-3">
                            <span className="bg-white/20 px-2 py-1 rounded font-semibold text-white/90 text-xs md:text-sm">
                                [{item.pos}]
                            </span>
                        </div>
                    )}
                    {item.meaning && (
                        <div className="bg-black/30 p-3 rounded-lg border-l-2 border-white/30 mb-2">
                            <span className="text-white/70 block text-xs uppercase mb-1">Meaning</span>
                            {item.meaning}
                        </div>
                    )}
                    {item.hindiMeaning && (
                        <div className="bg-white/10 p-3 rounded-lg border-l-2 border-orange-400 mt-2">
                            <span className="text-white/70 block text-xs uppercase mb-1">Hindi</span>
                            <span className="font-medium">{item.hindiMeaning}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
