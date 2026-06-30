import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Star, Trash2, LibraryBig, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/db';
import { Question } from '@/features/quiz';
import { Button } from '@/components/Button/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';
import { SynapticLoader } from '@/components/ui/SynapticLoader';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorState } from '@/components/ui/ErrorState';

export const BookmarksPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedSubject, setSelectedSubject] = useState<string>('All');
    const [showToast, setShowToast] = useState(false);

    const handleResetBookmarks = async () => {
        if (window.confirm("Are you sure you want to reset all bookmarks? This action cannot be undone.")) {
            try {
                await db.clearBookmarks();
                queryClient.setQueryData(['bookmarks'], []);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            } catch (error) {
                console.error("Failed to reset bookmarks:", error);
                alert("Failed to reset bookmarks. Please try again.");
            }
        }
    };

    const { data: bookmarks = [], isLoading, isError, error, refetch } = useQuery({
        queryKey: ['bookmarks'],
        queryFn: async () => {
            return await db.getAllBookmarks();
        },
        staleTime: 1000 * 60 * 5,
    });

    useEffect(() => {
        const handleSyncComplete = () => {
            refetch();
        };
        window.addEventListener('mindflow-sync-complete', handleSyncComplete);
        return () => {
            window.removeEventListener('mindflow-sync-complete', handleSyncComplete);
        };
    }, [refetch]);

    const handleRemoveBookmark = async (id: string) => {
        try {
            await db.removeBookmark(id);
            queryClient.setQueryData(['bookmarks'], (old: Question[] = []) => old.filter(b => b.id !== id));
        } catch (error) {
            console.error("Failed to remove bookmark:", error);
        }
    };

    const subjects = useMemo(() => {
        const subs = new Set<string>();
        bookmarks.forEach(q => {
            if ((q.subject ?? q.classification?.subject)) subs.add((q.subject ?? q.classification?.subject));
        });
        return ['All', ...Array.from(subs)];
    }, [bookmarks]);

    const filteredBookmarks = useMemo(() => {
        if (selectedSubject === 'All') return bookmarks;
        return bookmarks.filter(q => (q.subject ?? q.classification?.subject) === selectedSubject);
    }, [bookmarks, selectedSubject]);

    if (isError) {
        return (
            <div className="min-h-screen pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-slate-50 dark:bg-slate-900">
                 <ErrorState message={(error as Error)?.message || "Failed to load bookmarks"} onRetry={() => refetch()} />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <SynapticLoader size="lg" />
            </div>
        );
    }

    if (bookmarks.length === 0) {
        return (
            <>
                <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24 h-full flex flex-col justify-center items-center text-center">
                    <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-6">
                        <Star className="w-12 h-12 text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Bookmarks Yet</h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
                        Tap the star icon during a quiz to save questions here for later review.
                    </p>
                    <Button onClick={() => navigate('/dashboard')} className="bg-indigo-600 hover:bg-indigo-700 mb-4">
                        Back to Dashboard
                    </Button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center transition-colors font-semibold uppercase tracking-widest text-xs w-fit"
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
                            <span>Bookmarks reset successfully.</span>
                        </div>
                    </div>
                )}
            </>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24 space-y-6 animate-fade-in">
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
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Your Bookmarks</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review saved questions sorted by subject.</p>
                    </div>
                </div>
                <button
                    onClick={handleResetBookmarks}
                    className="flex items-center gap-2 px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors text-sm font-semibold border border-rose-200"
                    title="Reset Bookmarks"
                >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Reset Bookmarks</span>
                </button>
            </div>

            {/* Toast Notification */}
            {showToast && (
                <div className="fixed bottom-4 right-4 z-[60] animate-fade-in">
                    <div className="bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>Bookmarks reset successfully.</span>
                    </div>
                </div>
            )}

            {/* Subject Filters (Capsule Type) */}
            <div className="flex overflow-x-auto py-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide space-x-2">
                {subjects.map(subject => (
                    <button
                        key={subject}
                        onClick={() => setSelectedSubject(subject)}
                        className={cn(
                            "whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 border",
                            selectedSubject === subject
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:bg-slate-800/50 hover:border-gray-300 dark:border-gray-600"
                        )}
                    >
                        {subject}
                    </button>
                ))}
            </div>

            {/* Bookmark List */}
            <div className="space-y-4">
                {filteredBookmarks.map((question, index) => (
                    <Card key={question.id} className="p-5 flex flex-col sm:flex-row gap-4 group transition-shadow hover:shadow-md">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded uppercase tracking-wider">
                                    {(question.subject ?? question.classification?.subject) || 'General'}
                                </span>
                                <span className={cn(
                                    "text-xs font-bold px-2 py-1 rounded uppercase tracking-wider",
                                    (question.properties?.difficulty) === 'Easy' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" :
                                    (question.properties?.difficulty) === 'Medium' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" :
                                    "bg-rose-50 text-rose-700"
                                )}>
                                    {(question.properties?.difficulty)}
                                </span>
                            </div>

                            <h3 className="text-gray-900 dark:text-white font-medium mb-3">
                                {index + 1}. {question.question}
                            </h3>

                            <div className="space-y-2 mb-4">
                                {question.options.map((opt, i) => (
                                    <div key={i} className={cn(
                                        "p-3 rounded-lg border text-sm flex items-center gap-3",
                                        opt === question.correct
                                            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 text-emerald-900 font-medium"
                                            : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300"
                                    )}>
                                        <div className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                                            opt === question.correct
                                                ? "bg-emerald-200 text-emerald-800"
                                                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                                        )}>
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                        <span>{opt}</span>
                                    </div>
                                ))}
                            </div>

                            {question.explanation && (
                                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50 text-sm text-blue-900">
                                    <span className="font-bold flex items-center gap-2 mb-1">
                                        <LibraryBig className="w-4 h-4 text-blue-600" />
                                        Explanation
                                    </span>
                                    {question.explanation.summary || question.explanation.fact || "No specific explanation provided."}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex sm:flex-col justify-end sm:justify-start gap-2">
                            <button
                                onClick={() => handleRemoveBookmark(question.id)}
                                className="p-2 text-gray-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2 sm:w-full justify-center"
                                title="Remove Bookmark"
                            >
                                <Trash2 className="w-5 h-5" />
                                <span className="sm:hidden text-sm font-medium">Remove</span>
                            </button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
