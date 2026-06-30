import React, { useMemo } from 'react';
import { Trophy, RotateCcw, Home, Clock, CheckCircle2, XCircle, AlertCircle, TrendingUp, Target, BarChart2 } from 'lucide-react';
import { Button } from '../../../components/Button/Button';
import { Card } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Question } from '../types';
import { cn } from '../../../utils/cn';
import { QuizReview } from './QuizReview'; // Reuse the review tab

interface MockQuizResultProps {
  score: number;
  total: number;
  questions: Question[];
  answers: Record<string, string>;
  timeTaken: Record<string, number>;
  bookmarks: string[];
  onRestart: () => void;
  onGoHome?: () => void;
}

export const MockQuizResult: React.FC<MockQuizResultProps> = ({
  score,
  total,
  questions,
  answers,
  timeTaken,
  bookmarks,
  onRestart,
  onGoHome
}) => {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'analytics' | 'review'>('overview');

  const stats = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    let totalTime = 0;

    questions.forEach(q => {
      const ans = answers[q.id];
      if (!ans) unattempted++;
      else if (ans === q.correct) correct++;
      else incorrect++;

      totalTime += (timeTaken[q.id] || 0) / 1000;
    });

    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    const attempted = correct + incorrect;
    const avgTimePerQuestion = total > 0 ? Math.round(totalTime / total) : 0;

    // Performance categorization
    let performanceRating = 'Needs Work';
    if (accuracy >= 90) performanceRating = 'Excellent';
    else if (accuracy >= 75) performanceRating = 'Good';
    else if (accuracy >= 50) performanceRating = 'Average';

    return { correct, incorrect, unattempted, totalTime, accuracy, attempted, avgTimePerQuestion, performanceRating };
  }, [questions, answers, timeTaken, total]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0s";
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500 pb-24">
      {/* Header Profile / Grade */}
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-indigo-500 opacity-10 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Mock Exam Complete</h1>
                <p className="text-indigo-200 text-lg flex items-center justify-center md:justify-start gap-2">
                    <Target className="w-5 h-5" />
                    Performance: <span className="font-semibold text-white">{stats.performanceRating}</span>
                </p>
            </div>

            <div className="flex items-center gap-6 bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="text-center">
                    <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-sm">
                        {score}
                    </div>
                    <div className="text-sm text-indigo-200 font-medium uppercase tracking-wider mt-1">Score</div>
                </div>
                <div className="w-px h-16 bg-white/20"></div>
                <div className="text-center">
                    <div className="text-4xl md:text-5xl font-black text-white drop-shadow-sm">
                        {total}
                    </div>
                    <div className="text-sm text-indigo-200 font-medium uppercase tracking-wider mt-1">Total</div>
                </div>
            </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2",
            activeTab === 'overview'
              ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50"
          )}
        >
          <Trophy className="w-4 h-4" /> Overview
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={cn(
            "flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2",
            activeTab === 'analytics'
              ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50"
          )}
        >
          <BarChart2 className="w-4 h-4" /> Time Analytics
        </button>
        <button
          onClick={() => setActiveTab('review')}
          className={cn(
            "flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2",
            activeTab === 'review'
              ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50"
          )}
        >
          <AlertCircle className="w-4 h-4" /> Review
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-5 flex flex-col items-center justify-center text-center space-y-2 border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-900/10">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-1" />
                    <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.correct}</div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Correct</div>
                </Card>

                <Card className="p-5 flex flex-col items-center justify-center text-center space-y-2 border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
                    <XCircle className="w-8 h-8 text-red-500 mb-1" />
                    <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.incorrect}</div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Incorrect</div>
                </Card>

                <Card className="p-5 flex flex-col items-center justify-center text-center space-y-2 border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/10">
                    <AlertCircle className="w-8 h-8 text-amber-500 mb-1" />
                    <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.unattempted}</div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Skipped</div>
                </Card>

                <Card className="p-5 flex flex-col items-center justify-center text-center space-y-2 border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10">
                    <TrendingUp className="w-8 h-8 text-blue-500 mb-1" />
                    <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.accuracy.toFixed(1)}%</div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Accuracy</div>
                </Card>
            </div>
        )}

        {activeTab === 'analytics' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Total Time</h3>
                                <p className="text-sm text-slate-500">Duration of the mock exam</p>
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-800 dark:text-white">
                            {formatTime(stats.totalTime)}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/50 rounded-lg text-cyan-600 dark:text-cyan-400">
                                <BarChart2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Average Pace</h3>
                                <p className="text-sm text-slate-500">Time spent per question</p>
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-800 dark:text-white">
                            {formatTime(stats.avgTimePerQuestion)}
                        </div>
                    </Card>
                </div>

                <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200">Question Time Breakdown</h3>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto">
                        {questions.map((q, idx) => {
                            const time = (timeTaken[q.id] || 0) / 1000;
                            const isSlow = time > stats.avgTimePerQuestion * 1.5 && time > 20;
                            const statusColor = answers[q.id] === q.correct ? 'text-emerald-500' : (answers[q.id] ? 'text-red-500' : 'text-slate-400');

                            return (
                                <div key={q.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0", statusColor === 'text-emerald-500' ? 'bg-emerald-100 dark:bg-emerald-900/30' : statusColor === 'text-red-500' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-slate-100 dark:bg-slate-800')}>
                                            {idx + 1}
                                        </div>
                                        <div className="truncate text-sm text-slate-600 dark:text-slate-300 pr-4">
                                            {q.question}
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "flex items-center gap-1.5 font-mono text-sm font-medium shrink-0",
                                        isSlow ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-400"
                                    )}>
                                        <Clock className="w-3.5 h-3.5" />
                                        {formatTime(time)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
        )}

        {activeTab === 'review' && (
             <QuizReview
                    questions={questions}
                    userAnswers={answers}
                    timeTaken={timeTaken}
                    bookmarkedQuestions={bookmarks}
                    onBackToScore={() => setActiveTab('overview')}
                    onGoHome={onGoHome || (() => {})}
                />
        )}
      </div>

      {/* Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-50">
        <div className="max-w-4xl mx-auto flex gap-4">
          <Button
            variant="outline"
            onClick={onRestart}
            className="flex-1 py-3"
            >
  <span className="flex items-center justify-center gap-2"><RotateCcw className="w-5 h-5" />
            Reattempt
          </span>
</Button>
          {onGoHome && (
            <Button
              variant="primary"
              onClick={onGoHome}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700"
              >
  <span className="flex items-center justify-center gap-2"><Home className="w-5 h-5" />
              Dashboard
            </span>
</Button>
          )}
        </div>
      </div>
    </div>
  );
};
