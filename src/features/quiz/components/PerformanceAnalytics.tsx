import React, { useState } from 'react';
import { usePerformanceAnalytics } from '../hooks/usePerformanceAnalytics';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import { ChevronLeft, ChevronRight, BarChart2, TrendingUp, CheckCircle2, XCircle, Clock, Target, AlertCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/Button/Button';
import { Card } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { cn } from '../../../utils/cn';
import { SynapticLoader } from '../../../components/ui/SynapticLoader';

export const PerformanceAnalytics: React.FC = () => {
    const navigate = useNavigate();
    const [showToast, setShowToast] = useState(false);
    const { data: metrics, isLoading, isError, error, refetch, resetMutation } = usePerformanceAnalytics();

    const handleResetAnalytics = async () => {
        if (window.confirm("Are you sure you want to reset all analytics data? This action cannot be undone.")) {
            try {
                await resetMutation.mutateAsync();
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            } catch (error) {
                console.error("Failed to reset analytics:", error);
                alert("Failed to reset analytics. Please try again.");
            }
        }
    };



    if (isError) {
        return (
            <div className="p-4">
                <ErrorState
                    message={error instanceof Error ? error.message : "An unexpected error occurred while loading your performance data."}
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    // Safely use metrics, fallback to 0s if something is undefined
    const totalQuizzes = metrics?.total_quizzes ?? 0;
    const totalQuestionsAttempted = (metrics?.total_correct ?? 0) + (metrics?.total_incorrect ?? 0);
    const totalQuestionsSeen = metrics?.total_questions ?? 0;
    const totalCorrect = metrics?.total_correct ?? 0;
    const averageAccuracy = metrics?.average_accuracy ? Math.round(metrics.average_accuracy) : 0;
    const subjectTotals = metrics?.subject_stats ?? {};

    // Calculate Weak Topics
    const weakTopicsList: { subject: string; accuracy: number; attempted: number }[] = [];
    Object.entries(subjectTotals).forEach(([subject, stats]) => {
        const attempts = stats.attempted; // Assuming attempted includes correct + incorrect
        if (attempts >= 5) {
            const accuracy = (stats.correct / attempts) * 100;
            weakTopicsList.push({ subject, accuracy, attempted: attempts });
        }
    });

    // Sort by lowest accuracy first, then take top ones for a dedicated section
    weakTopicsList.sort((a, b) => a.accuracy - b.accuracy);
    const weakTopics = weakTopicsList.filter(t => t.accuracy < 70); // Show topics below 70% as weak, or just top 3

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <SynapticLoader size="lg" />
            </div>
        );
    }

    if (totalQuizzes === 0) {
        return (
            <>
                <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24 h-full flex flex-col justify-center items-center text-center">
                    <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6">
                        <BarChart2 className="w-12 h-12 text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Data Yet</h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
                        Complete your first quiz to start seeing your performance analytics and detailed report cards.
                    </p>
                    <Button onClick={() => navigate('/quiz/config')} className="bg-indigo-600 hover:bg-indigo-700">
                        Start a Quiz
                    </Button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mt-4 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center transition-colors font-semibold uppercase tracking-widest text-xs w-fit"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
                        Back to Dashboard
                    </button>
                </div>
                {/* Toast Notification */}
                {showToast && (
                    <div className="fixed bottom-4 right-4 z-[60] animate-fade-in">
                        <div className="bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <span>Analytics reset successfully.</span>
                        </div>
                    </div>
                )}
            </>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24 space-y-8 animate-fade-in">
            <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center transition-colors font-semibold uppercase tracking-widest text-xs w-fit mb-4"
            >
                <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
                Back to Dashboard
            </button>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">

                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Performance Analytics</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your detailed learning report card.</p>
                </div>
            </div>
            <button
                onClick={handleResetAnalytics}
                disabled={resetMutation.isPending}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors text-sm font-semibold",
                    resetMutation.isPending ? "opacity-50 cursor-not-allowed" : "hover:bg-red-100"
                )}
                title="Reset Analytics"
            >
                {resetMutation.isPending ? (
                    <div className="w-4 h-4 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
                ) : (
                    <Trash2 className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{resetMutation.isPending ? "Resetting..." : "Reset Analytics"}</span>
            </button>
        </div>

        {/* Toast Notification */}
        {showToast && (
            <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
                <div className="bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span>Analytics reset successfully.</span>
                </div>
            </div>
        )}

            {/* High-level KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 flex flex-col items-center text-center justify-center bg-gradient-to-br from-indigo-50 to-white border-indigo-100 dark:border-indigo-900/30">
                    <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-2" />
                    <span className="text-3xl font-black text-indigo-900">{totalQuizzes}</span>
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400/80 uppercase tracking-wider">Total Quizzes</span>
                </Card>
                <Card className="p-4 flex flex-col items-center text-center justify-center bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                    <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-2" />
                    <span className="text-3xl font-black text-emerald-900">{averageAccuracy}%</span>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400/80 uppercase tracking-wider">Avg Accuracy</span>
                </Card>
                <Card className="p-4 flex flex-col items-center text-center justify-center bg-gradient-to-br from-amber-50 to-white border-amber-100">
                    <CheckCircle2 className="w-6 h-6 text-amber-600 dark:text-amber-400 mb-2" />
                    <span className="text-3xl font-black text-amber-900">{totalCorrect}</span>
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400/80 uppercase tracking-wider">Total Correct</span>
                </Card>
                <Card className="p-4 flex flex-col items-center text-center justify-center bg-gradient-to-br from-rose-50 to-white border-rose-100">
                    <AlertCircle className="w-6 h-6 text-rose-600 mb-2" />
                    <span className="text-3xl font-black text-rose-900">{totalQuestionsSeen - totalQuestionsAttempted}</span>
                    <span className="text-xs font-medium text-rose-600/80 uppercase tracking-wider">Total Skipped</span>
                </Card>
            </div>

            {/* Subject-wise Performance */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Subject Mastery
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(subjectTotals).map(([subject, stats]) => {
                        const subjAccuracy = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;
                        return (
                            <Card key={subject} className="p-5">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{subject}</h3>
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-full text-xs font-bold",
                                        subjAccuracy >= 80 ? "bg-emerald-100 text-emerald-800" :
                                        subjAccuracy >= 60 ? "bg-amber-100 text-amber-800" :
                                        "bg-rose-100 text-rose-800"
                                    )}>
                                        {subjAccuracy}% Accuracy
                                    </span>
                                </div>
                                <ProgressBar value={subjAccuracy} variant={subjAccuracy >= 80 ? 'success' : subjAccuracy >= 60 ? 'warning' : 'danger'} className="mb-4" />

                                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
                                        <div className="font-bold text-gray-900 dark:text-white">{stats.attempted}</div>
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Attempt</div>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
                                        <div className="font-bold text-emerald-700 dark:text-emerald-400">{stats.correct}</div>
                                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400/80 uppercase">Right</div>
                                    </div>
                                    <div className="bg-rose-50 rounded-lg p-2">
                                        <div className="font-bold text-rose-700">{stats.incorrect}</div>
                                        <div className="text-[10px] text-rose-600/80 uppercase">Wrong</div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
                                        <div className="font-bold text-gray-500 dark:text-gray-400">{stats.skipped}</div>
                                        <div className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Skip</div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Recent Sessions (Migrating out, as list is not part of high-level aggregated analytics. Or we can just render nothing for this chunk.) */}
            {/* Since the mandate states strictly Server-Side for data aggregation, raw rows are skipped here to prevent heavy payloads. */}

        </div>
    );
};
