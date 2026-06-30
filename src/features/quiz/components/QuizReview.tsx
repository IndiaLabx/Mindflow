import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Home, CheckCircle2, XCircle, Bookmark, Filter, CircleDashed, Menu, Maximize2, Minimize2 } from 'lucide-react';
import { Question } from '../types';
import { Button } from '../../../components/Button/Button';
import { SegmentedControl } from './ui/SegmentedControl';
import { QuizQuestionDisplay } from './QuizQuestionDisplay';
import { QuizExplanation } from './QuizExplanation';
import { QuizNavigationPanel } from './QuizNavigationPanel';
import { cn } from '../../../utils/cn';
import { useQuizContext } from '../context/QuizContext';
import { quizEngine } from '../engine';

interface QuizReviewProps {
  questions: Question[];
  userAnswers: { [key: string]: string };
  timeTaken?: { [key: string]: number }; 
  bookmarkedQuestions: string[];
  onBackToScore: () => void;
  onGoHome: () => void;
  initialFilter?: 'All' | 'Correct' | 'Incorrect' | 'Bookmarked' | 'Skipped';
}

/**
 * A detailed review screen for exploring quiz answers post-completion.
 *
 * Features:
 * - Filtering by status (Correct, Incorrect, Skipped, Bookmarked).
 * - Detailed question view (using `QuizQuestionDisplay` in read-only mode).
 * - Full explanations.
 * - Time taken per question.
 *
 * @param {QuizReviewProps} props - The component props.
 * @returns {JSX.Element} The rendered Review screen.
 */
export const QuizReview: React.FC<QuizReviewProps> = ({
  questions,
  userAnswers,
  timeTaken = {},
  bookmarkedQuestions,
  onBackToScore,
  onGoHome,
  initialFilter = 'All'
}) => {
  const [filter, setFilter] = useState<string>(initialFilter);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { setIsReviewMode } = useQuizContext();

  useEffect(() => {
    setIsReviewMode(true);
    return () => setIsReviewMode(false);
  }, [setIsReviewMode]);

  // Calculate dynamic counts for filter tabs
  const counts = useMemo(() => {
    const c = {
      All: questions.length,
      Correct: 0,
      Incorrect: 0,
      Skipped: 0,
      Bookmarked: bookmarkedQuestions.length,
    };
    questions.forEach(q => {
      const ans = userAnswers[q.id];
      if (!ans) {
        c.Skipped++;
      } else if (ans === q.correct) {
        c.Correct++;
      } else {
        c.Incorrect++;
      }
    });
    return c;
  }, [questions, userAnswers, bookmarkedQuestions]);

  // Filter questions based on selected tab
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const ans = userAnswers[q.id];
      if (filter === 'All') return true;
      if (filter === 'Correct') return ans === q.correct;
      if (filter === 'Incorrect') return ans && ans !== q.correct; // Strict incorrect (answered wrong)
      if (filter === 'Skipped') return !ans;
      if (filter === 'Bookmarked') return bookmarkedQuestions.includes(q.id);
      return true;
    });
  }, [filter, questions, userAnswers, bookmarkedQuestions]);

  // Reset pagination index when filter changes to avoid out-of-bounds
  useEffect(() => {
    setReviewIndex(0);
  }, [filter]);

  const currentQuestion = filteredQuestions[reviewIndex];
  const currentAns = currentQuestion ? userAnswers[currentQuestion.id] : undefined;
  const isCorrect = currentQuestion && currentAns && quizEngine.getPlugin('mcq').validateAnswer(currentQuestion, currentAns);
  const isSkipped = currentQuestion && !currentAns;
  const userTime = currentQuestion ? (timeTaken[currentQuestion.id] || 0) / 1000 : 0;

  // Handle header visibility on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsHeaderVisible(false); // Scrolling down, hide
      } else if (currentScrollY < lastScrollY) {
        setIsHeaderVisible(true); // Scrolling up, show
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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

  // Listen for fullscreen change events to sync state
  useEffect(() => {
      const handleFullscreenChange = () => setIsFullScreen(!!document.fullscreenElement);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      
      {/* Header & Controls */}
      {!isFullScreen && (
      <div className={cn("bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6 sticky top-0 z-50 transition-all duration-300", !isHeaderVisible && "-translate-y-full opacity-0 pointer-events-none")}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
                <Button variant="ghost" size="sm" onClick={onBackToScore} className="text-gray-500 dark:text-gray-400">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Score
                </Button>
                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
                <h2 className="font-bold text-gray-800 dark:text-gray-100">Review Mode</h2>
            </div>

            <div className="flex-1 w-full md:w-auto overflow-x-auto">
                <SegmentedControl 
                    options={['All', 'Correct', 'Incorrect', 'Skipped', 'Bookmarked']}
                    selectedOptions={[filter]}
                    onOptionToggle={(opt) => setFilter(opt)}
                    counts={counts}
                />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <Button variant="outline" size="sm" onClick={onGoHome} className="flex-none px-2 justify-center text-gray-500 dark:text-gray-400 hover:text-indigo-600" title="Go Home">
                    <Home className="w-5 h-5" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFullScreen}
                    className="flex-none px-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600"
                    title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                >
                    {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsNavOpen(true)}
                    className="flex-none px-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600"
                    title="Open Question Map"
                >
                    <Menu className="w-5 h-5" />
                </Button>
            </div>
        </div>
      </div>

      )}

      {/* Navigation Panel for Review Mode */}
      <QuizNavigationPanel
          isOpen={isNavOpen}
          onClose={() => setIsNavOpen(false)}
          questions={filteredQuestions}
          userAnswers={userAnswers}
          currentQuestionIndex={reviewIndex}
          onJumpToQuestion={(idx) => {
              setReviewIndex(idx);
              setIsNavOpen(false);
          }}
          markedForReview={[]}
          bookmarks={bookmarkedQuestions}
          onSubmitAndReview={() => setIsNavOpen(false)}
          mode="learning"
      />

      {/* Floating Exit Full Screen Button */}
      {isFullScreen && (
          <div className="fixed top-4 right-4 z-[60] pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)]">
              <button
                  onClick={toggleFullScreen}
                  className="bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm flex items-center gap-2 transition-all shadow-lg"
              >
                  <Minimize2 className="w-4 h-4" /> Exit Full Screen
              </button>
          </div>
      )}

      {/* Main Review Content */}
      {currentQuestion ? (
        <div id="quiz-card-container" className="space-y-6 pb-20">
            {/* Question Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 relative overflow-hidden">
                
                {/* Status Color Strip */}
                <div className={cn(
                    "absolute top-0 left-0 w-full h-1.5",
                    isCorrect ? "bg-green-500" : (isSkipped ? "bg-gray-300" : "bg-red-500")
                )} />

                {/* Question Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded">
                            Q {questions.findIndex(q => q.id === currentQuestion.id) + 1}
                        </span>
                        {isSkipped ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                                <CircleDashed className="w-3 h-3" /> Skipped
                            </span>
                        ) : (
                             isCorrect ? (
                                 <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                                     <CheckCircle2 className="w-3 h-3" /> Correct
                                 </span>
                             ) : (
                                 <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
                                     <XCircle className="w-3 h-3" /> Incorrect
                                 </span>
                             )
                        )}
                    </div>
                    <span className="text-xs text-gray-400 font-mono">ID: {currentQuestion.id}</span>
                </div>

                {/* Reusing Question Display Component in Read-Only Mode */}
                <QuizQuestionDisplay 
                    question={currentQuestion}
                    selectedAnswer={currentAns} // Pass user answer to highlight their choice
                    onAnswerSelect={() => {}} // No-op for read-only
                    zoomLevel={1}
                    userTime={userTime} // Display time spent
                />
            </div>

            {/* Explanation Section */}
            <QuizExplanation explanation={currentQuestion.explanation} />

            {/* Fixed Navigation Footer (Global tab bar is hidden in Review Mode) */}
            <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Button 
                        onClick={() => setReviewIndex(i => Math.max(0, i - 1))}
                        disabled={reviewIndex === 0}
                        variant="outline"
                    >
                        Previous
                    </Button>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {reviewIndex + 1} of {filteredQuestions.length}
                    </span>
                    <Button 
                        onClick={() => setReviewIndex(i => Math.min(filteredQuestions.length - 1, i + 1))}
                        disabled={reviewIndex === filteredQuestions.length - 1}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Filter className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white mb-2">No questions found</h3>
            <p className="text-gray-500 dark:text-gray-400">There are no questions in the "{filter}" category.</p>
            <Button variant="outline" className="mt-6" onClick={() => setFilter('All')}>
                View All Questions
            </Button>
        </div>
      )}
    </div>
  );
};
