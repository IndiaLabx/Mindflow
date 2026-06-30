import { useQuizSessionStore } from '../stores/useQuizSessionStore';

import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalyticsStore } from '../stores/useAnalyticsStore';
import { useBookmarkStore } from '../stores/useBookmarkStore';
import { quizEngine } from '../engine';
import { ArrowRight, Star, Settings, Menu, ZoomIn, ZoomOut, Maximize2, Minimize2, Clock, ChevronLeft, Home, AlertCircle, X, Pause, Play, Percent, ChevronDown, ChevronUp } from 'lucide-react';
import { Question, InitialFilters } from '../types';
import { QuizQuestionDisplay } from '../components/QuizQuestionDisplay';
import { QuizExplanation } from '../components/QuizExplanation';
import { QuizBreadcrumbs } from '../components/QuizBreadcrumbs';
import { Button } from '../../../components/Button/Button';
import { Badge } from '../../../components/ui/Badge';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { useQuizSounds } from '@/features/quiz';
import { ActiveQuizLayout } from '../layouts/ActiveQuizLayout';
import { SettingsModal } from '../components/ui/SettingsModal';
import { cn } from '../../../utils/cn';
import { QuizNavigationPanel } from '../components/QuizNavigationPanel';
import { APP_CONFIG } from '../../../constants/config';
import { useLearningTimer } from '../hooks/useLearningTimer';

interface LearningSessionProps {
    questions: Question[];
    filters: InitialFilters;
    remainingTimes: Record<string, number>;
    isPaused: boolean;
    quizName?: string;

    // State from Parent
    currentIndex: number;
    answers: Record<string, string>;
    bookmarks: string[];
    timeTaken: Record<string, number>; // Add this if needed for completion
    hiddenOptions: Record<string, string[]>;

    // Actions
    onAnswer: (questionId: string, answer: string, timeTaken: number) => void;
    onNext: () => void;
    onPrev: () => void;
    onJump: (index: number) => void;
    onToggleBookmark: (questionId: string) => void;
    onFiftyFifty: (questionId: string, hiddenOptions: string[]) => void;

    onComplete: (results: { answers: Record<string, string>, timeTaken: Record<string, number>, score: number, bookmarks: string[] }) => void;
    onGoHome: () => void;
    onPause: (questionId?: string, timeLeft?: number) => void;
    onResume: () => void;
    onSaveTimer: (questionId: string, time: number) => void;
}

export const LearningSession: React.FC<LearningSessionProps> = ({
    questions,
    filters,
    remainingTimes,
    isPaused,
    quizName,
    currentIndex,
    answers,
    bookmarks,
    timeTaken,
    hiddenOptions,
    onAnswer,
    onNext,
    onPrev,
    onJump,
    onToggleBookmark,
    onFiftyFifty,
    onComplete,
    onGoHome,
    onPause,
    onResume,
    onSaveTimer
}) => {
    const navigate = useNavigate();
    const analyticsStore = useAnalyticsStore();
    const bookmarkStore = useBookmarkStore();
    // UI State (Local)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const reorderActiveQuestions = useQuizSessionStore(s => s.reorderActiveQuestions);
    const isToolbarExpanded = useQuizSessionStore(s => s.isToolbarExpanded);
    const toggleToolbar = useQuizSessionStore(s => s.toggleToolbar);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Pop-up state for timer expiry
    const [showTimeUpModal, setShowTimeUpModal] = useState(false);

    const currentQuestion = questions[currentIndex];

    // Safety check: if question is undefined, we shouldn't attempt to render
    if (!currentQuestion) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Loading Question...</h2>
                </div>
            </div>
        );
    }

    const userAnswer = answers[currentQuestion.id];
    const questionMountTimeRef = React.useRef(Date.now());

    React.useEffect(() => {
        questionMountTimeRef.current = Date.now();
    }, [currentQuestion.id]);

    // Check if question is conceptually "done"
    const isAnswered = !!userAnswer;
    const isTimeOut = userAnswer === 'TIME_UP';
    const currentHiddenOptions = hiddenOptions[currentQuestion.id] || [];
    const isFiftyFiftyUsed = currentHiddenOptions.length > 0;

    const progress = ((currentIndex + 1) / questions.length) * 100;

    // New Synthesized Sounds
    const { playCorrect, playWrong, playTick } = useQuizSounds();
    const isHapticEnabled = useSettingsStore(state => state.isHapticEnabled);


    const finishSession = () => {
        let score = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.correct) score++;
        });

        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => { });
        }

        onComplete({
            answers,
            timeTaken: timeTaken || {},
            score,
            bookmarks
        });
    };

    // Handle Timer Expiry
    const handleTimeUp = useCallback(() => {
        setShowTimeUpModal(true);
        // Mark as time up (0 time taken for this attempt effectively, or max?)
        // Ideally we pass 0 or current time?
        // We call onAnswer with a special marker.
        if (isHapticEnabled && window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);
        onAnswer(currentQuestion.id, 'TIME_UP', 0);
        playWrong();
    }, [currentQuestion.id, playWrong, onAnswer, isHapticEnabled]);

    // Auto-close Time Up Modal after 2 seconds
    useEffect(() => {
        if (showTimeUpModal) {
            const timer = setTimeout(() => {
                setShowTimeUpModal(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [showTimeUpModal]);

    // Dedicated Learning Timer
    const { timeLeft, timeLeftRef, formatTime } = useLearningTimer({
        initialTime: remainingTimes[currentQuestion.id] ?? APP_CONFIG.TIMERS.LEARNING_MODE_DEFAULT,
        questionId: currentQuestion.id,
        isPaused: isPaused || isAnswered,
        onTimeUp: handleTimeUp,
        onTick: (time) => {
            // Play tick sound in last 5 seconds
            if (time <= 5 && time > 0) playTick();
        }
    });

    // Save timer when unmounting or changing questions
    useEffect(() => {
        return () => {
            if (!isAnswered && !isPaused) {
                onSaveTimer(currentQuestion.id, timeLeftRef.current);
            }
        };
    }, [currentQuestion.id, isAnswered, isPaused, onSaveTimer]);

    const handlePause = () => {
        onPause(currentQuestion.id, timeLeftRef.current);
        // Small delay to allow the immediate DB save in useQuiz to trigger before we navigate away
        // and potentially load the old state from DB in SavedQuizzes
        setTimeout(() => {
            navigate('/quiz/library?tab=created');
        }, 100);
    };

    const handleResume = () => {
        onResume();
    };

    const handleFiftyFifty = () => {
        // Local timeout check to prevent clicking right as it times out
        if (isAnswered || isTimeOut || isFiftyFiftyUsed || timeLeft === 0) return;

        // Identify incorrect options
        const incorrectOptions = currentQuestion.options.filter(opt => opt !== currentQuestion.correct);

        // Shuffle incorrect options
        const shuffled = [...incorrectOptions].sort(() => 0.5 - Math.random());

        // Determine how many to hide (half of total options)
        const countToHide = Math.floor(currentQuestion.options.length / 2);

        // Select options to hide
        const optionsToHide = shuffled.slice(0, countToHide);

        onFiftyFifty(currentQuestion.id, optionsToHide);
    };

    const handleAnswerSelect = (option: string) => {
        if (isAnswered) return;
        if (isHapticEnabled && window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);

        // Calculate exact ms time spent on this question
        const exactSpentMs = Date.now() - questionMountTimeRef.current;

        onAnswer(currentQuestion.id, option, exactSpentMs);

        if (option === currentQuestion.correct) {
            playCorrect();

        } else {
            playWrong();

        }
    };

    const handleNextClick = () => {
        setShowTimeUpModal(false);
        if (currentIndex < questions.length - 1) {
            onNext();
        } else {
            finishSession();
        }
    };

    const handlePrevClick = () => {
        setShowTimeUpModal(false);
        if (currentIndex > 0) {
            onPrev();
        }
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
            setIsFullScreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullScreen(false);
            }
        }
    };

    // --- RENDER ---

    const header = (
        <div className="w-full relative z-20 flex flex-col">
            {/* Primary Quiz Title Bar */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-3 bg-indigo-600 dark:bg-indigo-900 text-white w-full pt-[max(0.75rem,env(safe-area-inset-top))]">
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <button
                        onClick={onGoHome}
                        className="p-1.5 hover:bg-indigo-700 dark:hover:bg-indigo-800 rounded-lg transition-colors shrink-0"
                        title="Go Home"
                    >
                        <Home className="w-5 h-5 text-white" />
                    </button>
                    <h1 className="font-semibold text-white truncate pr-2 text-base md:text-lg">
                        {quizName || 'Learning Session'}
                    </h1>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={toggleToolbar}
                        className="p-1.5 hover:bg-indigo-700 dark:hover:bg-indigo-800 rounded-lg transition-colors"
                        title={isToolbarExpanded ? 'Collapse Tools' : 'Expand Tools'}
                    >
                        {isToolbarExpanded ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                    </button>
                    <button
                        onClick={handlePause}
                        className="p-1.5 hover:bg-indigo-700 dark:hover:bg-indigo-800 rounded-lg transition-colors ml-1"
                        title="Pause Quiz"
                        data-testid="pause-button"
                    >
                        <Pause className="w-5 h-5 fill-current text-white" />
                    </button>
                </div>
            </div>

            {/* Secondary Utility Row (Collapsible) */}
            <div className={cn(
                "w-full bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out origin-top border-b border-gray-100 dark:border-gray-800",
                isToolbarExpanded ? "max-h-28 opacity-100 p-3 sm:p-4" : "max-h-0 opacity-0 overflow-hidden py-0 border-transparent"
            )}>
                <div className="flex items-center justify-between w-full">
                    <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            {/* Desktop Breadcrumbs (if filters exist, or just placeholder to keep layout) */}
                            <div className="hidden sm:block">
                                {filters && (filters.subject?.length > 0 || filters.examName) ? <QuizBreadcrumbs filters={filters} onGoHome={onGoHome} /> : <div />}
                            </div>

                            {/* Tools Group */}
                            <div className="flex items-center gap-2 ml-auto sm:ml-0 overflow-x-auto no-scrollbar flex-nowrap w-full sm:w-auto">
                                {/* Timer Badge */}
                                <Badge
                                    variant="neutral"
                                    icon={<Clock className="w-3.5 h-3.5" />}
                                    className={cn(
                                        "font-mono font-bold tabular-nums min-w-[4rem] justify-center transition-colors shrink-0",
                                        timeLeft <= 5 ? "bg-red-50 text-red-600 border-red-200 animate-pulse" :
                                        timeLeft <= 15 ? "bg-amber-50 text-amber-600 border-amber-200" :
                                        "bg-gray-50 dark:bg-gray-900"
                                    )}
                                >
                                    {formatTime(timeLeft)}
                                </Badge>

                                {/* Zoom Controls */}
                                <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 shrink-0">
                                    <button onClick={() => setZoomLevel(z => Math.max(0.8, z - 0.1))} className="p-1.5 hover:bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 active:bg-gray-300"><ZoomOut className="w-4 h-4" /></button>
                                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                    <button onClick={() => setZoomLevel(z => Math.min(1.6, z + 0.1))} className="p-1.5 hover:bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 active:bg-gray-300"><ZoomIn className="w-4 h-4" /></button>
                                </div>

                                {/* Fullscreen Toggle */}
                                <button onClick={toggleFullScreen} className="p-1.5 rounded-lg hover:bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 flex shrink-0" aria-label="Toggle fullscreen">
                                    {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>

                                {/* Bookmark */}
                                <button onClick={() => onToggleBookmark(currentQuestion.id)} className={cn("p-1.5 rounded-lg border transition-colors shrink-0 ml-1", bookmarks.includes(currentQuestion.id) ? "bg-amber-100 border-amber-200 text-amber-500" : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-100 dark:bg-gray-800")}>
                                    <Star className={cn("w-4 h-4", bookmarks.includes(currentQuestion.id) && "fill-current")} />
                                </button>
                            </div>
                        </div>

                        {/* Progress Bar Row */}
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 min-w-[3rem]">{currentIndex + 1} / {questions.length}</span>
                            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner relative">
                                <div
                                    className={cn(
                                        "h-full transition-all duration-1000 ease-linear rounded-full",
                                        timeLeft <= 5 ? "bg-red-500" :
                                        timeLeft <= 15 ? "bg-amber-500" :
                                        "bg-indigo-500"
                                    )}
                                    style={{ width: `${(timeLeft / APP_CONFIG.TIMERS.LEARNING_MODE_DEFAULT) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const footer = (
        <div className="px-2 py-3 sm:px-4 sm:py-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-800 w-full shadow-[0_-8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.2)]">
            <div className="max-w-md mx-auto flex items-center justify-between gap-1.5 sm:gap-2">

                {/* Settings */}
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 sm:p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700 shrink-0 flex items-center justify-center"
                    title="Settings"
                >
                    <Settings className="w-5 h-5 sm:w-5 sm:h-5" />
                </button>

                {/* Menu */}
                <button
                    onClick={() => setIsNavOpen(true)}
                    className="p-2 sm:p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0 min-w-[2.5rem] sm:min-w-[3rem]"
                    title="Side Panel"
                >
                    <Menu className="w-5 h-5 sm:w-6 sm:h-5" strokeWidth={2.5} />
                </button>

                <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-0.5 shrink-0 hidden sm:block"></div>

                {/* Previous */}
                <button
                    onClick={handlePrevClick}
                    disabled={currentIndex === 0}
                    className="p-2.5 sm:p-3 rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-gray-200 dark:border-gray-700 shrink-0 flex items-center justify-center"
                    title="Previous Question"
                >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                </button>

                {/* 50:50 Lifeline Button (Pill) */}
                <button
                    onClick={handleFiftyFifty}
                    disabled={isAnswered || isTimeOut || isFiftyFiftyUsed}
                    className={cn(
                        "flex-1 min-w-[3.5rem] sm:min-w-[4.5rem] max-w-[5.5rem] py-2 sm:py-2.5 px-1 sm:px-3 rounded-full font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center border",
                        (isAnswered || isTimeOut || isFiftyFiftyUsed)
                            ? "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed"
                            : "bg-amber-400 hover:bg-amber-500 text-amber-950 border-amber-500/20 shadow-[0_2px_10px_rgba(251,191,36,0.2)] active:scale-95"
                    )}
                    title="50:50 Lifeline"
                >
                    50:50
                </button>

                {/* Next */}
                <button
                    onClick={handleNextClick}
                    disabled={!isAnswered}
                    className={cn(
                        "flex-[2] min-w-[6rem] sm:min-w-[7.5rem] py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl transition-all font-bold flex items-center justify-center text-sm sm:text-base whitespace-nowrap",
                        !isAnswered
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-70"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_4px_14px_rgba(79,70,229,0.3)] dark:shadow-[0_4px_14px_rgba(79,70,229,0.2)] active:scale-95"
                    )}
                >
                    {currentIndex === questions.length - 1 ? "Finish" : "Next"}
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2" strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );

    const overlays = (
        <>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <QuizNavigationPanel
                isOpen={isNavOpen}
                onClose={() => setIsNavOpen(false)}
                questions={questions}
                userAnswers={answers}
                currentQuestionIndex={currentIndex}
                onJumpToQuestion={(idx) => {
                    onJump(idx);
                    setIsNavOpen(false);
                }}
                markedForReview={[]}
                bookmarks={bookmarks}
                onSubmitAndReview={finishSession}
                mode='learning'
                onReorderQuestions={reorderActiveQuestions}
            />

            {isFullScreen && (
                <div className="fixed top-4 right-4 z-50">
                    <button
                        onClick={toggleFullScreen}
                        className="bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm flex items-center gap-2 transition-all"
                    >
                        <Minimize2 className="w-4 h-4" /> Exit Full Screen
                    </button>
                </div>
            )}

            {showTimeUpModal && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/20 pointer-events-none">
                    <div className="bg-white dark:bg-gray-800 border border-red-100 shadow-2xl rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-bottom-10 pointer-events-auto max-w-sm w-full mx-auto">
                        <div className="bg-red-100 p-3 rounded-full text-red-600">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white dark:text-white">Time's Up!</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Revealing answer & explanation.</p>
                        </div>
                        <button
                            onClick={() => setShowTimeUpModal(false)}
                            className="ml-auto text-gray-400 hover:text-gray-600 dark:text-gray-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Pause Overlay - Heavily Blurred */}
            {isPaused && (
                <div
                    className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-4 bg-black/10 backdrop-blur-md animate-in fade-in duration-300"
                    data-testid="session-paused-overlay"
                >
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 max-w-sm w-full text-center transform scale-100 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Pause className="w-8 h-8 fill-current" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white mb-2">Quiz Paused</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Take a break! Your progress is saved.</p>

                        <Button
                            onClick={handleResume}
                            size="lg"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                        >
                            <Play className="w-5 h-5 mr-2 fill-current" /> Resume Quiz
                        </Button>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <ActiveQuizLayout
            header={isFullScreen ? null : header}
            footer={footer}
            overlays={overlays}
        >
            <div id="quiz-card-container" className={cn("pb-8", isPaused && "filter blur-lg transition-all duration-300 select-none pointer-events-none")}>
                <QuizQuestionDisplay
                    question={currentQuestion}
                    selectedAnswer={userAnswer}
                    hiddenOptions={currentHiddenOptions}
                    onAnswerSelect={handleAnswerSelect}
                    zoomLevel={zoomLevel}
                    isMockMode={false}
                />

                {isAnswered && (
                    <QuizExplanation explanation={currentQuestion.explanation} zoomLevel={zoomLevel} />
                )}
            </div>
        </ActiveQuizLayout>
    );
};
