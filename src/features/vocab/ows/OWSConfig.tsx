import { deckService } from "../services/deckService";
import { useLayoutStore } from '../../../stores/useLayoutStore';
import React, { useState, useEffect, useRef } from 'react';
import {  ArrowLeft, Play, Target, FileText, Settings, Calendar, Type, CheckCircle, Lock , Save , Image } from 'lucide-react';
import { Button } from '../../../components/Button/Button';
import { InitialFilters } from '../../../features/quiz/types';
import { OneWord } from '../../../types/models';
import { MultiSelectDropdown } from '../../../features/quiz/components/ui/MultiSelectDropdown';
import { SegmentedControl } from '../../../features/quiz/components/ui/SegmentedControl';
import { ActiveFiltersBar } from '../../../features/quiz/components/ui/ActiveFiltersBar';
import { cn } from '../../../utils/cn';
import { db } from '../../../lib/db';
import { SynapticLoader } from '../../../components/ui/SynapticLoader';
import { fetchOwsMetadata, getFilteredOws } from './utils/supabaseOws';
import { useAuth } from '../../../features/auth/context/AuthContext';
import { useOwsQuestionIndex, useOwsFilterCounts, OwsMetadata } from './hooks/useOwsFilterCounts';
import { useOWSProgress } from './hooks/useOWSProgress';

interface OWSConfigProps {
    onStart: (data: OneWord[], filters?: InitialFilters, mode?: 'basic' | 'review') => void;
    onBack: () => void;
}

const emptyFilters: InitialFilters = {
    subject: [],
    topic: [],
    subTopic: [],
    difficulty: [],
    questionType: [],
    examName: [],
    examYear: [],
    examDateShift: [],
    tags: [],
    knownStatus: [],
    reviewModeStatus: ['Unseen'],
    theme: []
};

export const OWSConfig: React.FC<OWSConfigProps> = ({ onStart, onBack }) => {
    const { user } = useAuth();
    const setHideGlobalFooter = useLayoutStore(state => state.setHideGlobalFooter);
    useEffect(() => {
        setHideGlobalFooter(true);
        return () => setHideGlobalFooter(false);
    }, [setHideGlobalFooter]);
    const isAdmin = user?.email === 'admin@mindflow.com';
    const { clearProgress } = useOWSProgress();
    const [deckName, setDeckName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [filters, setFilters] = useState<InitialFilters>(() => {
        const saved = localStorage.getItem('ows_filters');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { return emptyFilters; }
        }
        return emptyFilters;
    });

    useEffect(() => {
        localStorage.setItem('ows_filters', JSON.stringify(filters));
    }, [filters]);
    const [selectedAlphabets, setSelectedAlphabets] = useState<string[]>([]);
    const [sessionMode, setSessionMode] = useState<'basic' | 'review'>('basic');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    const [metadata, setMetadata] = useState<OwsMetadata[]>([]);
    const [isFetchingData, setIsFetchingData] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        const initConfig = async () => {
            try {
                // HOTFIX: Clear corrupted cache from previous bug
                if (!localStorage.getItem('vocab_cache_cleared_v4')) {
                    await db.clearIdiomMetadataCache?.().catch(()=>console.log('clear method not found'));
                    await db.clearOwsMetadataCache?.().catch(()=>console.log('clear method not found'));
                    await db.clearSynonymMetadataCache?.().catch(()=>console.log('clear method not found'));
                    localStorage.setItem('vocab_cache_cleared_v4', 'true');
                    // Force a full re-sync from backend to fix the columns
                    localStorage.removeItem('idiom_last_sync');
                    localStorage.removeItem('ows_last_sync');
                    localStorage.removeItem('synonym_last_sync');
                }
                // 1. Instantly load from IndexedDB cache (Stale-While-Revalidate)
                const cachedMetadata = await db.getOwsMetadataCache();
                if (cachedMetadata && cachedMetadata.length > 0) {
                    setMetadata(cachedMetadata);
                    setIsInitializing(false); // Instantly render UI
                }

                // 2. Fetch fresh data in the background (or foreground if no cache)
                const meta = await fetchOwsMetadata();

                // 3. Update React State & Cache
                setMetadata(meta);
                await db.saveOwsMetadataCache(meta);
            } catch (e) {
                console.error("Error initializing OWS configs", e);
            } finally {
                setIsInitializing(false);
            }
        };
        initConfig();
    }, []);

    const index = useOwsQuestionIndex(metadata);
    const { counts: filterCounts, totalMatchingCount, finalMatchingIds } = useOwsFilterCounts({
        metadata,
        selectedFilters: sessionMode === 'basic' ? { ...filters, reviewModeStatus: [] } : filters,
        selectedAlphabets: selectedAlphabets,
        index
    });

    const availableExamNames = Object.keys(index.examName || {}).sort();
    const availableExamYears = Object.keys(index.examYear || {}).sort();
    const availableThemes = Object.keys(index.theme || {}).sort();

        const handleResetProgress = async () => {
        if (window.confirm(`Are you sure you want to reset your ${sessionMode === 'basic' ? 'Basic Mode' : 'Review Mode'} progress? This action cannot be undone.`)) {
            await clearProgress(sessionMode);
            alert('Progress reset successfully.');
        }
    };

    const handleFilterChange = (key: keyof InitialFilters, selected: string[]) => {
        setFilters(prev => ({ ...prev, [key]: selected }));
    };

    const handleRemoveFilter = (key: keyof InitialFilters, value?: string) => {
        if (value) {
            setFilters(prev => ({ ...prev, [key]: (prev[key] as string[]).filter(item => item !== value) }));
        } else {
            setFilters(prev => ({ ...prev, [key]: [] }));
        }
    };


    // Predictive Prefetching logic
    const prefetchedDataRef = React.useRef<{ idsHash: string, data: OneWord[] } | null>(null);

    useEffect(() => {
        if (finalMatchingIds.length > 0 && finalMatchingIds.length <= 200) {
            const currentHash = finalMatchingIds.join(',');

            // Don't refetch if we already have it
            if (prefetchedDataRef.current?.idsHash === currentHash) return;

            const timer = setTimeout(async () => {
                try {
                    const data = await getFilteredOws(filters, selectedAlphabets, sessionMode, finalMatchingIds);
                    prefetchedDataRef.current = { idsHash: currentHash, data };
                } catch (e) {
                    console.error("Silent prefetch failed", e);
                }
            }, 600); // Wait 600ms after user stops clicking filters

            return () => clearTimeout(timer);
        } else {
             prefetchedDataRef.current = null;
        }
    }, [finalMatchingIds, filters, selectedAlphabets, sessionMode]);

    const handleSaveDeck = async () => {
        setIsSaving(true);
        try {
            if (finalMatchingIds.length === 0) {
                 alert("No data found matching current filters.");
                 return;
            }
            if (!deckName.trim()) {
                 alert("Please enter a name for your deck.");
                 return;
            }
            const data = await getFilteredOws(filters, selectedAlphabets, sessionMode, finalMatchingIds);
            if (data.length > 0) {
                 await deckService.createDeck('ows', {
                     id: crypto.randomUUID(),
                     user_id: user.id,
                     name: deckName,
                     created_at: Date.now(),
                     filters,
                     mode: sessionMode,
                     status: 'active',
                     state: {
                         currentQuestionIndex: 0,
                         answers: {},
                         timeSpent: 0,
                         isPaused: false,
                         markedForReview: []
                     }
                 }, data.map(d => d.id));
                 alert("Deck saved successfully!");
                 onBack();
            }
        } catch (error) {
            console.error("Error saving deck:", error);
            alert("Failed to save deck.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleStart = async () => {
        setIsFetchingData(true);
        try {
            if (finalMatchingIds.length === 0) {
                 alert("No OWS found matching current filters.");
                 return;
            }

            let data: OneWord[] = [];
            const currentHash = finalMatchingIds.join(',');

            // Use prefetched data if it's perfectly matched
            if (prefetchedDataRef.current?.idsHash === currentHash) {
                data = prefetchedDataRef.current.data;
            } else {
                data = await getFilteredOws(filters, selectedAlphabets, sessionMode, finalMatchingIds);
            }

            if (data.length > 0) {
                onStart(data, filters, sessionMode);
            } else {
                alert("No OWS found matching current filters.");
            }
        } catch (error) {
            console.error("Error fetching full OWS data:", error);
            alert("Failed to load OWS data. Please try again.");
        } finally {
            setIsFetchingData(false);
        }
    };

    if (isInitializing) {
        return <SynapticLoader />;
    }

    return (
                <div className="flex flex-col min-h-screen p-4 sm:p-6 lg:p-8 transition-colors duration-700 relative overflow-y-auto bg-slate-50 dark:bg-slate-900">
            {!user && (
              <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-sm border border-slate-200 dark:border-slate-700">
                  <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/50 rounded-full flex items-center justify-center mb-4">
                    <Lock className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Unlock Progress Tracking</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
                    Sign in to save your vocabulary mastery across devices.
                  </p>
                  <div className="flex gap-3 w-full">
                    <Button onClick={onBack} variant="outline" fullWidth>Back</Button>
                    <Button onClick={() => window.location.hash = '#/login'} className="bg-teal-500 hover:bg-teal-600 text-white border-none" fullWidth>
                      Sign In
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 z-10 sticky top-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md pb-4 pt-4 -mt-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-slate-200 dark:border-slate-800">
                <button
                    onClick={onBack}
                    className="p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
                 aria-label="Go back">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Target className="w-7 h-7 text-teal-500" /> OWS Config
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Filter One Word Substitutions</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col relative z-10 animate-fade-in w-full max-w-4xl mx-auto">
                {/* Mode Selection */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-teal-100 shadow-sm mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Settings className="w-5 h-5 text-teal-600" />
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Session Mode</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{sessionMode === 'basic' ? 'Simple Left/Right swiping' : 'Advanced Anki-style 4-way swiping'}</p>
                        </div>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                        <button
                            onClick={() => setSessionMode('basic')}
                            className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", sessionMode === 'basic' ? "bg-white dark:bg-slate-800 text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400")}
                        >
                            Basic
                        </button>
                        <button
                            onClick={() => setSessionMode('review')}
                            className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", sessionMode === 'review' ? "bg-white dark:bg-slate-800 text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400")}
                        >
                            Review
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Alphabetical Filter */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-teal-100 border-l-4 border-l-teal-400 shadow-sm relative">
                        <div className="flex items-center gap-2 mb-4 text-teal-800 font-bold text-sm uppercase tracking-wider">
                            <Type className="w-4 h-4" /> Alphabetical Order
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                onClick={() => setSelectedAlphabets([])}
                                className={cn(
                                    "px-3 py-2 rounded-lg text-xs font-bold transition-all border shadow-sm",
                                    selectedAlphabets.length === 0
                                        ? "bg-teal-500 text-white border-teal-500 ring-2 ring-teal-200"
                                        : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-teal-300 hover:text-teal-600"
                                )}
                            >
                                ALL
                            </button>
                            {alphabet.map(letter => {
                                const isSelected = selectedAlphabets.includes(letter);
                                const count = filterCounts.alphabet?.[letter] || 0;
                                const isDisabled = count === 0 && !isSelected;
                                return (
                                    <button
                                        key={letter}
                                        disabled={isDisabled}
                                        onClick={() => setSelectedAlphabets(prev => isSelected ? prev.filter(l => l !== letter) : [...prev, letter])}
                                        className={cn(
                                            "w-9 h-9 flex flex-col items-center justify-center rounded-lg transition-all border",
                                            isSelected
                                                ? "bg-teal-500 text-white border-teal-500 shadow-md transform scale-110"
                                                : isDisabled
                                                ? "bg-slate-100 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-800 cursor-not-allowed"
                                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-slate-700",
                                        )}
                                    >
                                        <span className="text-xs font-bold">{letter}</span>
                                        {count > 0 && !isSelected && <span className="text-[8px] opacity-60 -mt-1">{count}</span>}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Source Name Card */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-teal-100 border-l-4 border-l-teal-400 shadow-sm relative">
                        <div className="flex items-center gap-2 mb-4 text-teal-800 font-bold text-sm uppercase tracking-wider">
                            <FileText className="w-4 h-4" /> Source Material
                        </div>
                        <MultiSelectDropdown
                            label="Source Name"
                            options={availableExamNames}
                            selectedOptions={filters.examName}
                            onSelectionChange={(sel) => handleFilterChange('examName', sel)}
                            placeholder="Select Source (e.g. Blackbook)"
                            counts={filterCounts.examName}
                        />
                    </div>

                    {/* Exam Year Card */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-teal-100 border-l-4 border-l-teal-400 shadow-sm relative">
                        <div className="flex items-center gap-2 mb-4 text-teal-800 font-bold text-sm uppercase tracking-wider">
                            <Calendar className="w-4 h-4" /> Exam Year
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {availableExamYears.map(year => {
                                const isSelected = filters.examYear.includes(year);
                                const count = filterCounts.examYear?.[year] || 0;
                                const isDisabled = count === 0 && !isSelected;
                                return (
                                    <button
                                        key={year}
                                        disabled={isDisabled}
                                        onClick={() => setFilters(prev => {
                                            const current = prev.examYear;
                                            return { ...prev, examYear: current.includes(year) ? current.filter(y => y !== year) : [...current, year] };
                                        })}
                                        className={cn(
                                            "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 border select-none",
                                            isSelected
                                                ? "bg-teal-100 text-teal-900 border-teal-300 ring-1 ring-teal-300"
                                                : isDisabled
                                                ? "bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-700 border-slate-100 dark:border-slate-800 cursor-not-allowed"
                                                : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:bg-slate-800 hover:border-slate-300 dark:border-slate-600"
                                        )}
                                    >
                                        <span>{year}</span>
                                        {count > 0 && <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">{count}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>


                    {sessionMode === 'review' && (
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-teal-100 border-l-4 border-l-teal-400 shadow-sm relative">
                            <div className="flex items-center gap-2 mb-4 text-teal-800 font-bold text-sm uppercase tracking-wider">
                                <CheckCircle className="w-4 h-4" /> Review Mode Status
                            </div>
                            <SegmentedControl
                                options={['Unseen', 'Mastered', 'Review', 'Clueless', 'Tricky']}
                                selectedOptions={filters.reviewModeStatus || ['Unseen']}
                                onOptionToggle={(opt) => setFilters(prev => ({ ...prev, reviewModeStatus: [opt as "Unseen" | "Mastered" | "Review" | "Clueless" | "Tricky"] }))}
                                counts={filterCounts.reviewModeStatus || {}}
                            />
                        </div>
                    )}

                    {/* Known Status Card */}
                    {sessionMode === 'basic' && (
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-teal-100 border-l-4 border-l-teal-400 shadow-sm relative">
                            <div className="flex items-center gap-2 mb-4 text-teal-800 font-bold text-sm uppercase tracking-wider">
                                <CheckCircle className="w-4 h-4" /> Known Status
                            </div>
                            <SegmentedControl
                                options={['known', 'unknown']}
                                selectedOptions={filters.knownStatus || []}
                                onOptionToggle={(opt) => setFilters(prev => {
                                    const current = prev.knownStatus || [];
                                    return { ...prev, knownStatus: current.includes(opt as any) ? current.filter(i => i !== opt) : [...current, opt as any] };
                                })}
                                counts={filterCounts.knownStatus || {}}
                            />
                        </div>
                    )}


                    {/* Theme Name Card */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-teal-100 border-l-4 border-l-teal-400 shadow-sm relative">
                        <div className="flex items-center gap-2 mb-4 text-teal-800 font-bold text-sm uppercase tracking-wider">
                            <Target className="w-4 h-4" /> Theme
                        </div>
                        <MultiSelectDropdown
                            label="Theme"
                            options={availableThemes}
                            selectedOptions={filters.theme || []}
                            onSelectionChange={(sel) => handleFilterChange('theme', sel)}
                            placeholder="Select Theme (e.g. Science)"
                            counts={filterCounts.theme}
                        />
                    </div>

                    {/* Difficulty Card */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-teal-100 border-l-4 border-l-teal-400 shadow-sm relative">
                        <div className="flex items-center gap-2 mb-4 text-teal-800 font-bold text-sm uppercase tracking-wider">
                            <Settings className="w-4 h-4" /> Difficulty Level
                        </div>
                        <SegmentedControl
                            options={['Easy', 'Medium', 'Hard']}
                            selectedOptions={filters.difficulty}
                            onOptionToggle={(opt) => handleFilterChange('difficulty', filters.difficulty.includes(opt) ? filters.difficulty.filter(i => i !== opt) : [...filters.difficulty, opt])}
                            counts={filterCounts.difficulty}
                        />
                    </div>

                    {/* Admin Has Photo Card */}
                    {isAdmin && (
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-teal-100 border-l-4 border-l-teal-400 shadow-sm relative">
                            <div className="flex items-center gap-2 mb-4 text-teal-800 font-bold text-sm uppercase tracking-wider">
                                <Image className="w-4 h-4" /> Media Status (Admin Only)
                            </div>
                            <SegmentedControl
                                options={['With Photo', 'Without Photo']}
                                selectedOptions={filters.hasPhoto || []}
                                onOptionToggle={(opt) => handleFilterChange('hasPhoto', (filters.hasPhoto || []).includes(opt as any) ? (filters.hasPhoto || []).filter(i => i !== opt) : [...(filters.hasPhoto || []), opt as any])}
                                counts={filterCounts.hasPhoto || {}}
                            />
                        </div>
                    )}
                </div>

                {/* Active Filters Displayed above sticky footer area */}
                <div className="mt-6">
                    <ActiveFiltersBar filters={filters} onRemoveFilter={handleRemoveFilter} onClearAll={() => setFilters(emptyFilters)} />
                        <div className="flex justify-center mt-6">
                            <Button onClick={handleResetProgress} variant="outline" className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                                Reset {sessionMode === 'basic' ? 'Basic Mode' : 'Review Mode'} Progress
                            </Button>
                        </div>
                </div>
                </div>
                <div className="pb-32"></div>
                {/* Sticky Action Footer */}
                <div className="fixed bottom-0 left-0 w-full z-[40] border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 pb-safe md:px-6 md:py-4 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.1)] dark:shadow-none">

                    <div className="max-w-4xl mx-auto flex flex-col gap-2">
                        <input
                            type="text"
                            value={deckName}
                            onChange={(e) => setDeckName(e.target.value)}
                            placeholder="Enter Deck Name to Save..."
                            className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <div className="flex gap-2">
                            <Button size="lg" onClick={handleSaveDeck} disabled={totalMatchingCount === 0 || isSaving || !deckName.trim()} className="bg-indigo-500 hover:bg-indigo-600 text-white w-1/3 shadow-lg shadow-indigo-200">
                                <Save className="w-5 h-5 mr-2" /> {isSaving ? 'Saving...' : 'Save'}
                            </Button>

                            <Button
                            size="lg"
                            onClick={handleStart}
                            disabled={totalMatchingCount === 0 || isFetchingData}
                            className="w-2/3 bg-teal-500 hover:bg-teal-600 text-white border-none shadow-lg shadow-teal-200"
                        >
                            {isFetchingData ? (
                                <span className="animate-pulse">Loading...</span>
                            ) : (
                                <>
                                    <Play className="w-5 h-5 mr-2 fill-current" /> Start Flashcards ({totalMatchingCount})
                                </>
                            )}
                        </Button>
                        </div>
                </div>
            </div>
        </div>
    );
};