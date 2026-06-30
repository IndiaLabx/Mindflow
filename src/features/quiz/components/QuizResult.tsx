import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, RotateCcw, Home, Target, Clock, CheckCircle2, XCircle, List, ChevronRight, AlertCircle, TrendingUp, Zap, ChevronLeft } from 'lucide-react';
import { Button } from '../../../components/Button/Button';
import { Card } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Question } from '../types';
import { QuizReview } from './QuizReview';
import { cn } from '../../../utils/cn';

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
  
  const totalTime = (Object.values(timeTaken) as number[]).reduce((a, b) => a + b, 0) / 1000;
  const formattedTime = `${Math.floor(totalTime / 60)}m ${Math.round(totalTime % 60)}s`;

  // Advanced Stats (Speed Analysis)
  const stats = useMemo(() => {
      let correctTime = 0, correctCount = 0;
      let incorrectTime = 0, incorrectCount = 0;
      let skippedTime = 0, skippedCount = 0;
      
      questions.forEach(q => {
          const t = (timeTaken[q.id] || 0) / 1000;
          const ans = answers[q.id];

          if (ans) {
              if (ans === q.correct) {
                  correctTime += t;
                  correctCount++;
              } else {
                  incorrectTime += t;
                  incorrectCount++;
              }
          } else {
              skippedTime += t;
              skippedCount++;
          }
      });
      return {
          avgOverall: total > 0 ? Math.round(totalTime / total) : 0,
          avgCorrect: correctCount > 0 ? Math.round(correctTime / correctCount) : 0,
          avgIncorrect: incorrectCount > 0 ? Math.round(incorrectTime / incorrectCount) : 0,
          timeWastedSkipped: Math.round(skippedTime),
          totalCorrectTime: Math.round(correctTime),
          totalIncorrectTime: Math.round(incorrectTime),
          totalSkippedTime: Math.round(skippedTime)
      };
  }, [questions, answers, timeTaken, total, totalTime]);

  // Subject Performance Breakdown
  const subjectPerformance = useMemo(() => {
      const s: Record<string, { total: number, attempted: number, correct: number, incorrect: number, timeSpent: number }> = {};
      questions.forEach(q => {
          const sub = q?.subject || q?.classification?.subject || 'Unknown';
          if (!s[sub]) s[sub] = { total: 0, attempted: 0, correct: 0, incorrect: 0, timeSpent: 0 };

          s[sub].total++;
          s[sub].timeSpent += (timeTaken[q.id] || 0) / 1000;

          const ans = answers[q.id];
          if (ans) {
              s[sub].attempted++;
              if (ans === q.correct) {
                  s[sub].correct++;
              } else {
                  s[sub].incorrect++;
              }
          }
      });

      return Object.entries(s)
        .map(([name, data]) => ({
            name,
            ...data,
            accuracy: data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0
        }))
        .sort((a, b) => b.accuracy - a.accuracy);
  }, [questions, answers, timeTaken]);

  const strongSubjects = subjectPerformance.filter(s => s.accuracy >= 75);
  const weakSubjects = subjectPerformance.filter(s => s.accuracy < 60 && s.attempted > 0);

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

  // Helper for formatting seconds
  const formatSecs = (secs: number) => {
      if (secs < 60) return `${secs}s`;
      return `${Math.floor(secs/60)}m ${secs%60}s`;
  };

  // --- Main View: Dashboard ---
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-500 bg-gray-50/50 dark:bg-gray-900/50 min-h-screen">
      
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/quiz/library?tab=attempted')} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white pl-0">
              <ChevronLeft className="w-5 h-5 mr-1" /> Back to Quizzes
          </Button>
          <div className="flex gap-3">
              <Button
                  onClick={() => { setReviewFilter('All'); setView('review'); }}
                  variant="primary"
                  className="flex items-center group"
              >
                  View Solutions <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button onClick={onRestart} variant="outline" className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <RotateCcw className="w-4 h-4 mr-2" /> Reattempt
              </Button>
          </div>
      </div>

      <div className="space-y-6">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Section 2: Visual Attempt Breakdown & Review Navigation */}
              <div className="lg:col-span-1 space-y-6">
                  <Card className="p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                          <Target className="w-5 h-5 text-indigo-500" /> Attempt Analysis
                      </h3>
                      
                      {/* Top 4 Metrics (Moved inside) */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Score</span>
                              <div className="flex items-baseline gap-1">
                                  <span className="text-xl font-bold text-gray-900 dark:text-white">{score}</span>
                                  <span className="text-sm text-gray-400 dark:text-gray-500">/ {total}</span>
                              </div>
                          </div>

                          <div className="flex flex-col items-center justify-center p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Accuracy</span>
                              <div className="flex items-baseline gap-1">
                                  <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{accuracy}</span>
                                  <span className="text-sm text-indigo-400/50 dark:text-indigo-400/50">%</span>
                              </div>
                          </div>

                          <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Attempted</span>
                              <div className="flex items-baseline gap-1">
                                  <span className="text-xl font-bold text-gray-900 dark:text-white">{attempted}</span>
                                  <span className="text-sm text-gray-400 dark:text-gray-500">/ {total}</span>
                              </div>
                          </div>

                          <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /></span>
                              <div className="flex items-baseline gap-1">
                                  <span className="text-lg font-bold text-gray-900 dark:text-white">{formattedTime}</span>
                              </div>
                          </div>
                      </div>

                      {/* Simple Stacked Bar Visualization */}
                      <div className="w-full h-4 rounded-full flex overflow-hidden mb-6 bg-gray-100 dark:bg-gray-800">
                          <div style={{ width: `${(correct/total)*100}%` }} className="h-full bg-emerald-500 transition-all duration-1000" />
                          <div style={{ width: `${(incorrect/total)*100}%` }} className="h-full bg-rose-500 transition-all duration-1000" />
                          <div style={{ width: `${(unanswered/total)*100}%` }} className="h-full bg-gray-300 dark:bg-gray-600 transition-all duration-1000" />
                      </div>

                      <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-emerald-500" /> <span className="text-gray-700 dark:text-gray-300 font-medium">Correct</span></div>
                              <span className="font-bold text-gray-900 dark:text-white">{correct}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-rose-500" /> <span className="text-gray-700 dark:text-gray-300 font-medium">Incorrect</span></div>
                              <span className="font-bold text-gray-900 dark:text-white">{incorrect}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-gray-300 dark:bg-gray-600" /> <span className="text-gray-700 dark:text-gray-300 font-medium">Skipped</span></div>
                              <span className="font-bold text-gray-900 dark:text-white">{unanswered}</span>
                          </div>
                      </div>

                      </Card>

                  {/* Insights Section */}
                  {(strongSubjects.length > 0 || weakSubjects.length > 0) && (
                      <Card className="p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                         <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                             <TrendingUp className="w-5 h-5 text-indigo-500" /> Insights
                         </h3>
                         <div className="space-y-4">
                             {strongSubjects.length > 0 && (
                                 <div>
                                     <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Strong Areas</h4>
                                     <div className="flex flex-wrap gap-2">
                                         {strongSubjects.map(s => (
                                             <span key={s.name} className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm rounded-md border border-emerald-200 dark:border-emerald-800/50">
                                                 {s.name}
                                             </span>
                                         ))}
                                     </div>
                                 </div>
                             )}
                             {weakSubjects.length > 0 && (
                                 <div>
                                     <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2">Needs Improvement</h4>
                                     <div className="flex flex-wrap gap-2">
                                         {weakSubjects.map(s => (
                                             <span key={s.name} className="px-2.5 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-sm rounded-md border border-rose-200 dark:border-rose-800/50">
                                                 {s.name}
                                             </span>
                                         ))}
                                     </div>
                                 </div>
                             )}
                         </div>
                      </Card>
                  )}
              </div>

              {/* Section 3: Detailed Tables (Time & Subject) */}
              <div className="lg:col-span-2 space-y-6">

                  {/* Time Analysis */}
                  <Card className="p-0 border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                      <div className="p-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              <Clock className="w-5 h-5 text-indigo-500" /> Time Management
                          </h3>
                      </div>
                      <div className="p-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                          {/* New Tabular Breakdown */}
                          <div className="grid grid-cols-4 gap-4 text-center">
                              <div className="flex flex-col items-center">
                                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Total Spent</span>
                                  <span className="text-base font-bold text-gray-900 dark:text-white">{formatSecs(totalTime)}</span>
                                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5">100%</span>
                              </div>
                              <div className="flex flex-col items-center border-l border-gray-100 dark:border-gray-800">
                                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">On Correct</span>
                                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{formatSecs(stats.totalCorrectTime)}</span>
                                  <span className="text-xs font-medium text-emerald-400/70 dark:text-emerald-500/70 mt-0.5">{totalTime > 0 ? Math.round((stats.totalCorrectTime / totalTime) * 100) : 0}%</span>
                              </div>
                              <div className="flex flex-col items-center border-l border-gray-100 dark:border-gray-800">
                                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">On Incorrect</span>
                                  <span className="text-base font-bold text-rose-600 dark:text-rose-400">{formatSecs(stats.totalIncorrectTime)}</span>
                                  <span className="text-xs font-medium text-rose-400/70 dark:text-rose-500/70 mt-0.5">{totalTime > 0 ? Math.round((stats.totalIncorrectTime / totalTime) * 100) : 0}%</span>
                              </div>
                              <div className="flex flex-col items-center border-l border-gray-100 dark:border-gray-800">
                                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">On Skipped</span>
                                  <span className="text-base font-bold text-amber-600 dark:text-amber-400">{formatSecs(stats.totalSkippedTime)}</span>
                                  <span className="text-xs font-medium text-amber-400/70 dark:text-amber-500/70 mt-0.5">{totalTime > 0 ? Math.round((stats.totalSkippedTime / totalTime) * 100) : 0}%</span>
                              </div>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100 dark:divide-gray-800 bg-gray-50 dark:bg-gray-900/50">
                          <TimeMetricBox label="Avg / Question" value={formatSecs(stats.avgOverall)} icon={<Zap className="w-4 h-4 text-indigo-500" />} />
                          <TimeMetricBox label="Avg Correct" value={formatSecs(stats.avgCorrect)} icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} />
                          <TimeMetricBox label="Avg Incorrect" value={formatSecs(stats.avgIncorrect)} icon={<XCircle className="w-4 h-4 text-rose-500" />} />
                          <TimeMetricBox label="Skipped Wasted" value={formatSecs(stats.timeWastedSkipped)} icon={<Clock className="w-4 h-4 text-amber-500" />} />
                      </div>
                  </Card>

                  {/* Subject Table */}
                  <Card className="p-0 border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                      <div className="p-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              <List className="w-5 h-5 text-indigo-500" /> Sectional Summary
                          </h3>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm whitespace-nowrap bg-white dark:bg-gray-900">
                              <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-800">
                                  <tr>
                                      <th className="p-4">Subject</th>
                                      <th className="p-4 text-center">Questions</th>
                                      <th className="p-4 text-center">Attempted</th>
                                      <th className="p-4 text-center">Correct</th>
                                      <th className="p-4 text-center">Accuracy</th>
                                      <th className="p-4 text-right">Time Spent</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                  {subjectPerformance.map((sub) => (
                                      <tr key={sub.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                          <td className="p-4 font-medium text-gray-900 dark:text-white">{sub.name}</td>
                                          <td className="p-4 text-center text-gray-600 dark:text-gray-400">{sub.total}</td>
                                          <td className="p-4 text-center text-gray-600 dark:text-gray-400">{sub.attempted}</td>
                                          <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 font-medium">{sub.correct}</td>
                                          <td className="p-4 text-center">
                                              <span className={cn(
                                                  "px-2 py-1 rounded text-xs font-bold",
                                                  sub.accuracy >= 75 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                                  sub.accuracy >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                                  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                              )}>
                                                  {sub.accuracy}%
                                              </span>
                                          </td>
                                          <td className="p-4 text-right text-gray-600 dark:text-gray-400 font-medium">
                                              {formatSecs(sub.timeSpent)}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </Card>

              </div>
          </div>
      </div>
    </div>
  );
};

const TimeMetricBox = ({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) => (
    <div className="p-5 flex flex-col items-center justify-center text-center">
        <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {icon} {label}
        </div>
        <div className="text-xl font-bold text-gray-900 dark:text-white">
            {value}
        </div>
    </div>
);
