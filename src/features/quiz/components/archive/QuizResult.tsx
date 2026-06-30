import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, RotateCcw, Home, Target, Clock, CheckCircle2, XCircle, List, ChevronRight, Award, Zap, CircleDashed, ArrowLeft } from 'lucide-react';
import { Button } from '../../../../components/Button/Button';
import { Card } from '../../../../components/ui/Card';
import { ProgressBar } from '../../../../components/ui/ProgressBar';
import { Question } from '../../types';
import { DonutChart } from './DonutChart';
import { AnimatedCounter } from './AnimatedCounter';
import { QuizReview } from '../QuizReview';
import { cn } from '../../../../utils/cn';

interface QuizResultProps {
  score: number;
  total: number;
  questions: Question[];
  answers: Record<string, string>;
  timeTaken: Record<string, number>;
  bookmarks: string[];
  onRestart: () => void;
  onGoHome?: () => void;
}

/**
 * The Quiz Result Summary Screen.
 *
 * Displays:
 * - Overall Grade/Score and Visual Chart.
 * - Key Performance Indicators (KPIs) like Accuracy, Speed, Attempted count.
 * - Subject-wise performance breakdown.
 * - Options to review answers (All, Incorrect, Skipped).
 *
 * @param {QuizResultProps} props - The component props.
 * @returns {JSX.Element} The rendered Result screen.
 */
export const QuizResult: React.FC<QuizResultProps> = ({
  score,
  total,
  questions,
  answers,
  timeTaken,
  bookmarks,
  onRestart,
  onGoHome
}) => {
  const [view, setView] = useState<'score' | 'review'>('score');
  const [reviewFilter, setReviewFilter] = useState<'All' | 'Correct' | 'Incorrect' | 'Bookmarked' | 'Skipped'>('All');
  const navigate = useNavigate();

  // --- Statistics Calculations ---

  // Basic Counts
  const { correct, incorrect, unanswered, attempted } = useMemo(() => {
      let c = 0, i = 0, a = 0;
      questions.forEach(q => {
          const ans = answers[q.id];
          if (ans) {
              a++;
              if (ans === q.correct) c++; else i++;
          }
      });
      return { correct: c, incorrect: i, attempted: a, unanswered: total - a };
  }, [questions, answers, total]);

  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

  const totalTime = (Object.values(timeTaken) as number[]).reduce((a, b) => a + b, 0);
  const formattedTime = `${Math.floor(totalTime / 60)}m ${Math.round(totalTime % 60)}s`;

  // Advanced Stats (Speed Analysis)
  const stats = useMemo(() => {
      let correctTime = 0, correctCount = 0;
      let incorrectTime = 0, incorrectCount = 0;
      let fastest = Infinity;
      let slowest = 0;

      questions.forEach(q => {
          const t = timeTaken[q.id] || 0;
          const ans = answers[q.id];

          if (ans) {
              if (ans === q.correct) {
                  correctTime += t;
                  correctCount++;
                  // Only calculate speed records for CORRECT answers to filter out guessing
                  if (t > 0) {
                      if (t < fastest) fastest = t;
                      if (t > slowest) slowest = t;
                  }
              } else {
                  incorrectTime += t;
                  incorrectCount++;
              }
          }
      });
      return {
          avgCorrect: correctCount > 0 ? Math.round(correctTime / correctCount) : 0,
          avgIncorrect: incorrectCount > 0 ? Math.round(incorrectTime / incorrectCount) : 0,
          fastest: fastest === Infinity ? 0 : fastest,
          slowest
      };
  }, [questions, answers, timeTaken]);

  // Subject Performance Breakdown
  const subjectPerformance = useMemo(() => {
      const s: Record<string, { total: number, correct: number }> = {};
      questions.forEach(q => {
          const sub = q.subject ?? q.classification?.subject ?? "Unknown";
          if (!s[sub]) s[sub] = { total: 0, correct: 0 };
          s[sub].total++;
          if (answers[q.id] === q.correct) s[sub].correct++;
      });
      return Object.entries(s)
        .map(([name, data]) => ({ name, ...data, accuracy: Math.round((data.correct / data.total) * 100) }))
        .sort((a, b) => b.accuracy - a.accuracy);
  }, [questions, answers]);

  // Dynamic Grade Assignment
  const getGrade = (acc: number) => {
      if (acc >= 90) return { label: 'S', color: 'text-yellow-300', title: 'Legendary!', bg: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900' };
      if (acc >= 80) return { label: 'A', color: 'text-emerald-300', title: 'Excellent!', bg: 'bg-gradient-to-br from-emerald-800 to-teal-900' };
      if (acc >= 60) return { label: 'B', color: 'text-blue-300', title: 'Good Job!', bg: 'bg-gradient-to-br from-blue-800 to-indigo-900' };
      if (acc >= 40) return { label: 'C', color: 'text-orange-300', title: 'Keep Improving', bg: 'bg-gradient-to-br from-orange-800 to-red-900' };
      return { label: 'F', color: 'text-rose-300', title: 'Needs Practice', bg: 'bg-gradient-to-br from-rose-900 to-slate-900' };
  };

  const grade = getGrade(accuracy);

  // --- Sub-View: Review Mode ---
  if (view === 'review') {
      return (
          <QuizReview
            questions={questions}
            userAnswers={answers}
            timeTaken={timeTaken}
            bookmarkedQuestions={bookmarks}
            onBackToScore={() => setView('score')}
            onGoHome={onGoHome || onRestart}
            initialFilter={reviewFilter}
          />
      );
  }


  // --- Main View: Score Dashboard ---
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">

      {/* Top Controls */}
      <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/quiz/library?tab=attempted')} className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-slate-800 pl-0 hover:text-gray-900 dark:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
      </div>

      {/* Hero Section: Grade & Chart */}

      <Card noPadding className="mb-8 border-0 shadow-2xl overflow-hidden">
          <div className={cn("p-8 md:p-10 text-white relative transition-all duration-1000", grade.bg)}>

              {/* Background Texture */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

                  {/* Left: Text Summary */}
                  <div className="flex flex-col items-center md:items-start text-center md:text-left">
                      <div className="flex items-center gap-3 mb-2">
                           <div className="p-2 bg-white dark:bg-gray-800 rounded-lg backdrop-blur-sm">
                               <Award className={cn("w-6 h-6", grade.color)} />
                           </div>
                           <span className="text-sm font-bold uppercase tracking-widest text-white/80">Result Summary</span>
                      </div>

                      <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">{grade.title}</h1>
                      <p className="text-white/60 font-medium mb-6">You completed the quiz in <span className="text-white">{formattedTime}</span></p>

                      <div className="flex items-end gap-4">
                          <div className="text-8xl font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 drop-shadow-lg">
                              {grade.label}
                          </div>
                          <div className="pb-2 text-white/80 font-bold text-xl">
                              Grade
                          </div>
                      </div>
                  </div>

                  {/* Right: Donut Chart Visualization */}
                  <div className="flex flex-col items-center justify-center relative">
                      <div className="relative">
                          <DonutChart correct={correct} incorrect={incorrect} unanswered={unanswered} size={220} />
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-5xl font-black text-white drop-shadow-md">
                                  <AnimatedCounter value={accuracy} />%
                              </span>
                              <span className="text-xs font-bold uppercase tracking-widest text-white/60 mt-1">Accuracy</span>
                          </div>
                      </div>

                      {/* Mini Legend */}
                      <div className="flex gap-6 mt-6 text-xs font-bold uppercase tracking-wider bg-black/20 px-6 py-3 rounded-full backdrop-blur-md border border-white/10">
                          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-50 dark:bg-emerald-900/200 shadow-[0_0_10px_rgba(34,197,94,0.5)]" /> {correct} Correct</div>
                          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" /> {incorrect} Wrong</div>
                          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-400" /> {unanswered} Skipped</div>
                      </div>
                  </div>
              </div>
          </div>

          {/* KPI Grid */}
          <div className="bg-white dark:bg-gray-800 p-6 border-t border-gray-100 dark:border-gray-800">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <StatBox label="Total Score" value={score} suffix={`/ ${total}`} icon={<Trophy className="w-4 h-4 text-amber-500" />} />
                  <StatBox label="Attempted" value={attempted} suffix={`/ ${total}`} icon={<Target className="w-4 h-4 text-indigo-500" />} />
                  <StatBox label="Avg Time (Correct)" value={stats.avgCorrect} suffix="s" icon={<Zap className="w-4 h-4 text-emerald-500" />} />
                  <StatBox label="Avg Time (Incorrect)" value={stats.avgIncorrect} suffix="s" icon={<Clock className="w-4 h-4 text-rose-500" />} />
                  <StatBox label="Fastest Answer" value={stats.fastest} suffix="s" icon={<Clock className="w-4 h-4 text-blue-500" />} />
              </div>
          </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Column 1: Review Actions */}
          <div className="space-y-5 order-2 lg:order-1">
             <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                 <List className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Review & Analysis
             </h3>

             <Card onClick={() => { setReviewFilter('All'); setView('review'); }} className="flex items-center justify-between group border-l-4 border-l-indigo-500 hover:shadow-lg cursor-pointer transition-all">
                 <div>
                    <span className="font-bold text-gray-800 dark:text-gray-100 block">All Questions</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">View solutions & explanations</span>
                 </div>
                 <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-full group-hover:bg-indigo-100 dark:bg-indigo-900/40 transition-colors">
                    <ChevronRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                 </div>
             </Card>

             <Card
                onClick={() => { if(incorrect > 0) { setReviewFilter('Incorrect'); setView('review'); }}}
                className={cn(
                    "flex items-center justify-between group border-l-4 border-l-rose-500 transition-all",
                    incorrect === 0 ? "opacity-60 cursor-not-allowed" : "hover:shadow-lg cursor-pointer"
                )}
             >
                 <div>
                    <span className="font-bold text-gray-800 dark:text-gray-100 block">Incorrect Only</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{incorrect} mistakes to fix</span>
                 </div>
                 <div className="bg-rose-50 p-2 rounded-full group-hover:bg-rose-100 transition-colors">
                    <ChevronRight className="w-5 h-5 text-rose-600" />
                 </div>
             </Card>

             <Card
                onClick={() => { if(unanswered > 0) { setReviewFilter('Skipped'); setView('review'); }}}
                className={cn(
                    "flex items-center justify-between group border-l-4 border-l-gray-400 transition-all",
                    unanswered === 0 ? "opacity-60 cursor-not-allowed" : "hover:shadow-lg cursor-pointer"
                )}
             >
                 <div>
                    <span className="font-bold text-gray-800 dark:text-gray-100 block">Skipped Only</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{unanswered} unanswered questions</span>
                 </div>
                 <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full group-hover:bg-gray-200 dark:bg-gray-700 transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                 </div>
             </Card>

             <div className="grid grid-cols-2 gap-3 pt-2">
                 <Button onClick={onRestart} variant="outline" className="justify-center h-12 border-2 hover:border-indigo-600 hover:text-indigo-600 dark:text-indigo-400">
                    <RotateCcw className="w-4 h-4 mr-2" /> Reattempt
                 </Button>
                 <Button onClick={onGoHome} variant="outline" className="justify-center h-12 border-2 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-slate-800 dark:bg-slate-800/50">
                    <Home className="w-4 h-4 mr-2" /> Home
                 </Button>
             </div>
          </div>

          {/* Column 2: Subject Performance List */}
          <div className="lg:col-span-2 order-1 lg:order-2">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-5 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Performance Breakdown
              </h3>
              <div className="space-y-4">
                  {subjectPerformance.map((sub, idx) => (
                      <div key={sub.name} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:border-indigo-300 transition-colors animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                          <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-gray-700 dark:text-gray-200">{sub.name}</span>
                              <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-400 dark:text-slate-500">{sub.correct}/{sub.total}</span>
                                  <span className={cn(
                                      "text-sm font-bold px-2 py-0.5 rounded",
                                      sub.accuracy >= 80 ? "bg-emerald-100 text-emerald-700 dark:text-emerald-400" :
                                      sub.accuracy >= 50 ? "bg-amber-100 text-amber-700 dark:text-amber-400" :
                                      "bg-rose-100 text-rose-700"
                                  )}>
                                      {sub.accuracy}%
                                  </span>
                              </div>
                          </div>

                          <ProgressBar
                            value={sub.accuracy}
                            variant={sub.accuracy >= 80 ? 'success' : sub.accuracy >= 50 ? 'warning' : 'danger'}
                            size="sm"
                            className="opacity-90"
                          />
                      </div>
                  ))}
              </div>
          </div>
      </div>

    </div>
  );
};

// Helper Component for KPI Grid Item
const StatBox = ({ label, value, suffix, icon }: { label: string, value: number, suffix?: string, icon: React.ReactNode }) => (
    <div className="flex flex-col items-start p-3 rounded-lg hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-slate-800 dark:bg-slate-800/50 transition-colors">
        <div className="flex items-center gap-2 mb-1 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wide">
            {icon} {label}
        </div>
        <div className="text-2xl font-black text-gray-900 dark:text-white">
            <AnimatedCounter value={value} duration={1000} />
            <span className="text-sm text-gray-400 dark:text-slate-500 font-medium ml-1">{suffix}</span>
        </div>
    </div>
);
