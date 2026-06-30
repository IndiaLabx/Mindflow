import { useQuizSessionStore } from '../stores/useQuizSessionStore';

import React, { useState, useEffect, useRef, useContext } from 'react';
import { Clock, Menu, Flag, CheckCircle, ChevronLeft, ChevronRight, AlertTriangle, ZoomIn, ZoomOut, Maximize2, Minimize2, Eraser, Pause } from 'lucide-react';
import { Question } from '../types';
import { QuizQuestionDisplay } from '../components/QuizQuestionDisplay';
import { QuizNavigationPanel } from '../components/QuizNavigationPanel';
import { Button } from '../../../components/Button/Button';
import { ActiveQuizLayout } from '../layouts/ActiveQuizLayout';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { cn } from '../../../utils/cn';
import { APP_CONFIG } from '../../../constants/config';
import { useMockSessionTimer } from '../hooks/useMockSessionTimer';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { quizEngine } from '../engine';

interface MockSessionProps {
    questions: Question[];
    initialTime?: number;
    onPause?: (timeLeft: number) => void;
    onComplete: (results: { answers: Record<string, string>, timeTaken: Record<string, number>, score: number, bookmarks: string[] }) => void;
}

export const MockSession: React.FC<MockSessionProps> = ({ questions, initialTime, onPause, onComplete }) => {
    // Local State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [markedForReview, setMarkedForReview] = useState<string[]>([]);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const reorderActiveQuestions = useQuizSessionStore(s => s.reorderActiveQuestions);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Track time per question for analytics (approximate)
    const [timeSpentPerQuestion, setTimeSpentPerQuestion] = useState<Record<string, number>>({});

    // Dedicated Mock Timer (Global)
    // If initialTime is provided (resumed session), use it. Otherwise calculate default.
    const totalExamTime = (initialTime !== undefined && initialTime > 0)
        ? initialTime
        : questions.length * APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION;

        const { timeLeft, formatTime, getAndResetCurrentQuestionTime, getCurrentQuestionTimeRef } = useMockSessionTimer({
        totalTime: totalExamTime,
        onTimeUp: () => finishSession()
    });



    // ENTERPRISE: Web Worker Timer (Replaces standard hook)


    // ENTERPRISE: Offline Auto-Save (IndexedDB Resilience)

    // ENTERPRISE: Anti-Cheating System (Visibility change detection)
    useAntiCheat({
        isEnabled: true,
        maxViolations: 3,
        onViolation: (count) => {
            alert(`⚠️ Warning! Tab switching or minimizing is not allowed during Mock Test. Violation ${count}/3`);
        },
        onMaxViolationsReached: () => {
            alert('❌ Maximum violations reached. The test is being auto-submitted.');
            finishSession();
        }
    });

        const finishSession = () => {
        saveCurrentQuestionTime(); // Save last question time

        // Calculate score
        let score = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.correct) score++;
        });

        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => { });
        }

        onComplete({
            answers,
            timeTaken: timeSpentPerQuestion,
            score,
            bookmarks: []
        });
    };



    // Record time when switching questions
    const saveCurrentQuestionTime = () => {
        const qId = questions[currentIndex].id;
        const timeSpent = getAndResetCurrentQuestionTime();
        setTimeSpentPerQuestion(prev => ({
            ...prev,
            [qId]: (prev[qId] || 0) + timeSpent
        }));
    };

    const handlePause = () => {
        if (onPause) {
            saveCurrentQuestionTime();
            onPause(timeLeft);
        }
    };

    const handleAnswer = (option: string) => {
        // Here we could validate via engine, but MockMode validation usually happens at the end
        // If we want real-time analytics tracking, we'd do it here:
        // const isCorrect = quizEngine.getPlugin('mcq').validateAnswer(questions[currentIndex], option);
        if (isHapticEnabled && window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);
        setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: option }));
    };

    const handleClearResponse = () => {
        setAnswers(prev => {
            const next = { ...prev };
            delete next[questions[currentIndex].id];
            return next;
        });
    };

    const handleNext = () => {
        saveCurrentQuestionTime();
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        saveCurrentQuestionTime();
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleJump = (index: number) => {
        saveCurrentQuestionTime();
        setCurrentIndex(index);
        setIsNavOpen(false);
    };

    const toggleReview = () => {
        const qId = questions[currentIndex].id;
        setMarkedForReview(prev => {
            if (prev.includes(qId)) return prev.filter(id => id !== qId);
            return [...prev, qId];
        });
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

    const isHapticEnabled = useSettingsStore(state => state.isHapticEnabled);

    const attemptedCount = Object.keys(answers).length;
    const activeQuestion = questions[currentIndex];
    const isAnswered = !!answers[activeQuestion.id];

    // --- RENDER ---

    const header = (
        <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-900 text-white shadow-md">
            <div className="font-bold text-lg tracking-tight hidden xs:block">Mock Test</div>

            <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-lg border border-slate-700 bg-slate-800",
                timeLeft < 60 ? "text-red-400 border-red-900 animate-pulse" : "text-emerald-400"
            )}>
                <Clock className="w-5 h-5" />
                {formatTime(timeLeft)}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap shrink-0">
                {/* Pause Button */}
                <button
                    onClick={handlePause}
                    className="p-2 hover:bg-slate-800 text-slate-400 rounded-lg transition-colors shrink-0"
                    title="Pause Test"
                 aria-label="Pause">
                    <Pause className="w-5 h-5" />
                </button>

                {/* Zoom Controls (Dark Theme) */}
                <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-800 mr-2 shrink-0">
                    <button onClick={() => setZoomLevel(z => Math.max(0.8, z - 0.1))} className="p-1.5 hover:bg-slate-700 text-slate-400 active:bg-slate-600"><ZoomOut className="w-4 h-4" /></button>
                    <div className="w-px h-4 bg-slate-700"></div>
                    <button onClick={() => setZoomLevel(z => Math.min(1.6, z + 0.1))} className="p-1.5 hover:bg-slate-700 text-slate-400 active:bg-slate-600"><ZoomIn className="w-4 h-4" /></button>
                </div>

                <button onClick={toggleFullScreen} className="p-2 hover:bg-slate-800 text-slate-400 rounded-lg transition-colors shrink-0" aria-label="Toggle fullscreen">
                    {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>

                <button
                    onClick={() => setIsNavOpen(true)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-white shrink-0"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>
        </div>
    );

    const footer = (
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex gap-2 items-center">
                <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0} className="px-3">
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <button
                    onClick={toggleReview}
                    className={cn(
                        "p-2.5 rounded-lg border flex items-center justify-center transition-colors",
                        markedForReview.includes(questions[currentIndex].id)
                            ? "bg-purple-100 border-purple-300 text-purple-700"
                            : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-900"
                    )}
                    title="Mark for Review"
                 aria-label="Toggle review panel">
                    <Flag className="w-5 h-5 fill-current" />
                </button>

                {isAnswered && (
                    <button
                        onClick={handleClearResponse}
                        className="px-3 py-2 rounded-lg border border-transparent text-red-600 hover:bg-red-50 text-sm font-bold transition-colors flex items-center gap-1"
                        title="Clear Response"
                    >
                        <Eraser className="w-4 h-4" /> Clear
                    </button>
                )}
            </div>

            <div className="flex gap-2">
                <Button
                    onClick={() => {
                        if (currentIndex === questions.length - 1) {
                            setShowConfirmModal(true);
                        } else {
                            handleNext();
                        }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 shadow-lg shadow-indigo-200"
                >
                    {currentIndex === questions.length - 1 ? "Submit Test" : "Save & Next"}
                    {currentIndex !== questions.length - 1 && <ChevronRight className="w-4 h-4 ml-2" />}
                </Button>
            </div>
        </div>
    );

    return (
        <>
            <ActiveQuizLayout
                header={header}
                footer={footer}
                overlays={
                    <>
                        <QuizNavigationPanel
                            isOpen={isNavOpen}
                            onClose={() => setIsNavOpen(false)}
                            questions={questions}
                            userAnswers={answers}
                            currentQuestionIndex={currentIndex}
                            onJumpToQuestion={handleJump}
                            markedForReview={markedForReview}
                            bookmarks={[]}
                            onSubmitAndReview={() => setShowConfirmModal(true)}
                            mode="mock"
                            onReorderQuestions={reorderActiveQuestions}
                        />
                        {showConfirmModal && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center scale-100 animate-in zoom-in-95 duration-200">
                                    <div className={cn(
                                        "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                                        questions.length - attemptedCount > 0 ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"
                                    )}>
                                        {questions.length - attemptedCount > 0 ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
                                    </div>

                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white mb-2">Submit Test?</h2>

                                    <div className="text-gray-600 dark:text-gray-300 mb-6 space-y-1">
                                        <p>You have attempted <span className="font-bold text-indigo-600">{attemptedCount}</span> out of <span className="font-bold">{questions.length}</span> questions.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Keep Playing</Button>
                                        <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={finishSession}>Submit</Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                }
            >
                <div className="pb-8 pt-2">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question {currentIndex + 1} of {questions.length}</span>
                        {markedForReview.includes(activeQuestion.id) && (
                            <span className="flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                                <Flag className="w-3 h-3 fill-current" /> Review Later
                            </span>
                        )}
                    </div>

                    <QuizQuestionDisplay
                        question={activeQuestion}
                        selectedAnswer={answers[activeQuestion.id]}
                        onAnswerSelect={handleAnswer}
                        zoomLevel={zoomLevel}
                        isMockMode={true}
                    />
                </div>
            </ActiveQuizLayout>
        </>
    );
};
