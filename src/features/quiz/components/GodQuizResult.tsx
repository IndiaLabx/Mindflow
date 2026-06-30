import React, { useMemo } from 'react';
import { Trophy, RotateCcw, Home, Clock, CheckCircle2, XCircle, AlertCircle, TrendingUp, Target, Zap, ShieldAlert, Crosshair } from 'lucide-react';
import { Button } from '../../../components/Button/Button';
import { Card } from '../../../components/ui/Card';
import { Question } from '../types';
import { cn } from '../../../utils/cn';
import { QuizReview } from './QuizReview';

interface GodQuizResultProps {
  score: number;
  total: number;
  questions: Question[];
  answers: Record<string, string>;
  timeTaken: Record<string, number>;
  bookmarks: string[];
  onRestart: () => void;
  onGoHome?: () => void;
}

export const GodQuizResult: React.FC<GodQuizResultProps> = ({
  score,
  total,
  questions,
  answers,
  timeTaken,
  bookmarks,
  onRestart,
  onGoHome
}) => {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'blueprint' | 'review'>('overview');

  const stats = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    let totalTime = 0;

    // God mode might have specific groupings by subject/topic later, but we use the basic metrics for now
    questions.forEach(q => {
      const ans = answers[q.id];
      if (!ans) unattempted++;
      else if (ans === q.correct) correct++;
      else incorrect++;

      totalTime += (timeTaken[q.id] || 0) / 1000;
    });

    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    const avgTimePerQuestion = total > 0 ? Math.round(totalTime / total) : 0;

    // Strict performance categorization for God Mode
    let rank = 'Mortal';
    if (accuracy >= 95) rank = 'Godlike';
    else if (accuracy >= 85) rank = 'Ascended';
    else if (accuracy >= 70) rank = 'Heroic';

    return { correct, incorrect, unattempted, totalTime, accuracy, avgTimePerQuestion, rank };
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
      <div className="bg-gradient-to-br from-amber-600 via-orange-600 to-red-700 rounded-3xl p-8 text-white shadow-[0_0_40px_-10px_rgba(251,146,60,0.5)] relative overflow-hidden border border-amber-400/20">
        {/* Animated background elements for "God" vibe */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-yellow-300 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-red-500 opacity-20 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left space-y-2">
                <div className="flex items-center justify-center md:justify-start gap-2 text-amber-200 text-sm font-bold tracking-widest uppercase mb-2">
                    <Zap className="w-4 h-4" /> Blueprint Finalized
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-amber-200">
                    God Mode Run
                </h1>
                <p className="text-amber-100/80 text-lg flex items-center justify-center md:justify-start gap-2 mt-2">
                    <ShieldAlert className="w-5 h-5" />
                    Final Rank: <span className="font-bold text-white drop-shadow-md">{stats.rank}</span>
                </p>
            </div>

            <div className="flex items-center gap-6 bg-black/20 p-6 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
                <div className="text-center">
                    <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-yellow-500 drop-shadow-sm">
                        {score}
                    </div>
                    <div className="text-xs text-amber-200/70 font-bold uppercase tracking-widest mt-2">Score</div>
                </div>
                <div className="w-px h-16 bg-white/10"></div>
                <div className="text-center">
                    <div className="text-5xl md:text-6xl font-black text-white drop-shadow-sm opacity-90">
                        {total}
                    </div>
                    <div className="text-xs text-amber-200/70 font-bold uppercase tracking-widest mt-2">Max</div>
                </div>
            </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-900 p-1 rounded-xl shadow-inner border border-slate-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "flex-1 py-3 px-4 text-sm font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2",
            activeTab === 'overview'
              ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-orange-500/20"
              : "text-slate-400 hover:text-amber-400 hover:bg-slate-800"
          )}
        >
          <Trophy className="w-4 h-4" /> Mission Stats
        </button>
        <button
          onClick={() => setActiveTab('blueprint')}
          className={cn(
            "flex-1 py-3 px-4 text-sm font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2",
            activeTab === 'blueprint'
              ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-orange-500/20"
              : "text-slate-400 hover:text-amber-400 hover:bg-slate-800"
          )}
        >
          <Crosshair className="w-4 h-4" /> Tactics & Time
        </button>
        <button
          onClick={() => setActiveTab('review')}
          className={cn(
            "flex-1 py-3 px-4 text-sm font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2",
            activeTab === 'review'
              ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-orange-500/20"
              : "text-slate-400 hover:text-amber-400 hover:bg-slate-800"
          )}
        >
          <Zap className="w-4 h-4" /> Intel Review
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-6 flex flex-col items-center justify-center text-center space-y-3 border-amber-500/20 bg-slate-900/50 backdrop-blur-sm shadow-xl">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                    <div className="text-4xl font-black text-white">{stats.correct}</div>
                    <div className="text-xs font-bold text-emerald-400/70 uppercase tracking-widest">Hits</div>
                </Card>

                <Card className="p-6 flex flex-col items-center justify-center text-center space-y-3 border-amber-500/20 bg-slate-900/50 backdrop-blur-sm shadow-xl">
                    <XCircle className="w-8 h-8 text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]" />
                    <div className="text-4xl font-black text-white">{stats.incorrect}</div>
                    <div className="text-xs font-bold text-red-400/70 uppercase tracking-widest">Misses</div>
                </Card>

                <Card className="p-6 flex flex-col items-center justify-center text-center space-y-3 border-amber-500/20 bg-slate-900/50 backdrop-blur-sm shadow-xl">
                    <AlertCircle className="w-8 h-8 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                    <div className="text-4xl font-black text-white">{stats.unattempted}</div>
                    <div className="text-xs font-bold text-amber-400/70 uppercase tracking-widest">Evaded</div>
                </Card>

                <Card className="p-6 flex flex-col items-center justify-center text-center space-y-3 border-amber-500/20 bg-slate-900/50 backdrop-blur-sm shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent"></div>
                    <TrendingUp className="w-8 h-8 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)] relative z-10" />
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-amber-200 relative z-10">
                        {stats.accuracy.toFixed(1)}%
                    </div>
                    <div className="text-xs font-bold text-amber-400/70 uppercase tracking-widest relative z-10">Precision</div>
                </Card>
            </div>
        )}

        {activeTab === 'blueprint' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-6 border-slate-800 bg-slate-900 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400 border border-amber-500/30">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-200">Execution Time</h3>
                                <p className="text-sm text-slate-400">Total duration of the run</p>
                            </div>
                        </div>
                        <div className="text-4xl font-black text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                            {formatTime(stats.totalTime)}
                        </div>
                    </Card>

                    <Card className="p-6 border-slate-800 bg-slate-900 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 border border-blue-500/30">
                                <Crosshair className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-200">Reaction Pace</h3>
                                <p className="text-sm text-slate-400">Average time per target</p>
                            </div>
                        </div>
                        <div className="text-4xl font-black text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.3)]">
                            {formatTime(stats.avgTimePerQuestion)}
                        </div>
                    </Card>
                </div>

                <Card className="p-0 overflow-hidden border border-slate-800 bg-slate-900 text-slate-300 shadow-2xl">
                    <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                        <h3 className="font-bold text-amber-400 uppercase tracking-wider text-sm flex items-center gap-2">
                            <Zap className="w-4 h-4" /> Tactical Time Breakdown
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-800/50 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {questions.map((q, idx) => {
                            const time = (timeTaken[q.id] || 0) / 1000;
                            const isDanger = time > stats.avgTimePerQuestion * 2 && time > 30;
                            const statusColor = answers[q.id] === q.correct ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' : (answers[q.id] ? 'text-red-400 border-red-400/30 bg-red-400/10' : 'text-slate-400 border-slate-600 bg-slate-800');

                            return (
                                <div key={q.id} className="p-4 flex items-center justify-between hover:bg-slate-800/80 transition-colors group">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-black shrink-0", statusColor)}>
                                            {idx + 1}
                                        </div>
                                        <div className="truncate text-sm font-medium text-slate-300 group-hover:text-white transition-colors pr-4">
                                            {q.question}
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "flex items-center gap-2 font-mono text-sm font-bold shrink-0 px-3 py-1 rounded-md",
                                        isDanger ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-slate-800 text-slate-400"
                                    )}>
                                        <Clock className="w-4 h-4" />
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
             <div className="dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                <QuizReview
                    questions={questions}
                    userAnswers={answers}
                    timeTaken={timeTaken}
                    bookmarkedQuestions={bookmarks}
                    onBackToScore={() => setActiveTab('overview')}
                    onGoHome={onGoHome || (() => {})}
                />
             </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 z-50">
        <div className="max-w-4xl mx-auto flex gap-4">
          <Button
            variant="outline"
            onClick={onRestart}
            className="flex-1 py-3 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-400 hover:text-amber-300"
            >
  <span className="flex items-center justify-center gap-2"><RotateCcw className="w-5 h-5" />
            Reattempt
          </span>
</Button>
          {onGoHome && (
            <Button
              variant="primary"
              onClick={onGoHome}
              className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-orange-500/20 border-0"
              >
  <span className="flex items-center justify-center gap-2"><Home className="w-5 h-5" />
              Command Center
            </span>
</Button>
          )}
        </div>
      </div>
    </div>
  );
};
