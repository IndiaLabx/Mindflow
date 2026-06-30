import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, PlusCircle, CheckCircle, ArrowLeft, BarChart2, LayoutGrid, List } from 'lucide-react';
import { db } from '../../../lib/db';
import { supabase } from '../../../lib/supabase';
import { SavedQuiz } from '../types';
import { AttemptedQuizCard } from './AttemptedQuizCard';
import { useQuizContext } from '../context/QuizContext';
import { syncService } from '../../../lib/syncService';
import { SynapticLoader } from '../../../components/ui/SynapticLoader';
import { motion } from 'framer-motion';
import { QuizLibraryToolbar } from './QuizLibraryToolbar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/context/AuthContext';
import { ErrorState, QueryStateHandler } from '../../../components/ui/ErrorState';

/**
 * Screen for managing attempted (completed) quizzes.
 *
 * Features:
 * - Lists all quizzes stored in IndexedDB that have been completed.
 * - Allows viewing results of a completed quiz.
 * - Supports renaming completed quizzes.
 * - Allows deleting quizzes.
 * - Sorts by creation date, name, or score.
 *
 * @returns {JSX.Element} The rendered Attempted Quizzes screen.
 */
interface AttemptedQuizzesListProps {
    viewMode: 'list' | 'grid';
    setViewMode: (mode: 'list' | 'grid') => void;
    sortMethod: 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'score-desc' | 'score-asc';
    setSortMethod: (method: 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'score-desc' | 'score-asc') => void;
}

export const AttemptedQuizzesList: React.FC<AttemptedQuizzesListProps> = ({ viewMode, setViewMode, sortMethod, setSortMethod }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, isAuthTransitioning } = useAuth();
    const { data: quizzes = [], isLoading: loading, isError, error, refetch } = useQuery({
        queryKey: ['attempted-quizzes', user?.id],
        enabled: !!user && !isAuthTransitioning,
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return [];

            const { data, error } = await supabase
              .from('saved_quizzes')
              .select('*, bridge_saved_quiz_questions(question_id, sort_order)')
              .eq('user_id', session.user.id)
              .is('deleted_at', null)
              .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching attempted quizzes:', error);
                throw error;
            }

            if (!data || data.length === 0) return [];

            const completedQuizzes = data.filter(rq => rq.status === 'result');
            return completedQuizzes.map(rq => {
                const bridgeData = rq.bridge_saved_quiz_questions || [];
                const questionsCount = bridgeData.length;
                let questions = new Array(questionsCount).fill({});

                const parsedState = typeof rq.state === 'string' ? JSON.parse(rq.state) : (rq.state || {});
                const parsedFilters = typeof rq.filters === 'string' ? JSON.parse(rq.filters) : (rq.filters || {});

                return {
                    id: rq.id,
                    name: rq.name,
                    createdAt: new Date(rq.created_at).getTime(),
                    filters: parsedFilters,
                    mode: rq.mode,
                    questions: questions,
                    state: {
                        ...parsedState,
                        activeQuestions: questions
                    }
                } as SavedQuiz;
            });
        }
    });
    const [isSyncing, setIsSyncing] = useState(syncService.getIsSyncing());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        queryClient.invalidateQueries({ queryKey: ['attempted-quizzes', user?.id] });

        const handleSyncStart = () => {
            setIsSyncing(true);
        };

        const handleSyncComplete = () => {
            setTimeout(async () => {
                await queryClient.invalidateQueries({ queryKey: ['attempted-quizzes', user?.id] });
                setIsSyncing(false);
            }, 100);
        };

        window.addEventListener('mindflow-sync-start', handleSyncStart);
        window.addEventListener('mindflow-sync-complete', handleSyncComplete);

        return () => {
            window.removeEventListener('mindflow-sync-start', handleSyncStart);
            window.removeEventListener('mindflow-sync-complete', handleSyncComplete);
        };
    }, []);




    /** Views results for completed quiz. */
    const handleViewResults = (quiz: SavedQuiz) => {
        // Hydrate the global context state with the saved session data

        navigate(`/result/${quiz.id}`);
    };

    /** Deletes a quiz from storage. */
    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this quiz?')) {
            try {
                const { error } = await supabase.from('saved_quizzes').update({ deleted_at: new Date().toISOString() }).eq('id', id);
                if (error) throw error;
                queryClient.setQueryData(['attempted-quizzes', user?.id], (old: SavedQuiz[] = []) => old.filter(q => q.id !== id));
            } catch (error) {
                console.error("Failed to delete quiz:", error);
            }
        }
    };

    const saveEditCard = async (id: string, newName: string) => {
        try {
            const { error } = await supabase.from('saved_quizzes').update({ name: newName }).eq('id', id);
            if (error) throw error;
            queryClient.setQueryData(['attempted-quizzes', user?.id], (old: SavedQuiz[] = []) => old.map(q => q.id === id ? { ...q, name: newName } : q));
        } catch (error) {
            console.error("Failed to update quiz name:", error);
        }
    };

    const sortedQuizzes = useMemo(() => {
        return [...quizzes].sort((a, b) => {
            switch (sortMethod) {
                case 'date-desc': return b.createdAt - a.createdAt;
                case 'date-asc': return a.createdAt - b.createdAt;
                case 'name-asc': return (a.name || '').localeCompare(b.name || '');
                case 'name-desc': return (b.name || '').localeCompare(a.name || '');
                case 'score-desc': return (b.state.score || 0) - (a.state.score || 0);
                case 'score-asc': return (a.state.score || 0) - (b.state.score || 0);
                default: return b.createdAt - a.createdAt;
            }
        });
    }, [quizzes, sortMethod]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
                <SynapticLoader size="lg" />
            </div>
        );
    }

        return (
        <QueryStateHandler
            isLoading={loading}
            isError={isError}
            error={error}
            onRetry={refetch}
            loadingComponent={<div className="flex items-center justify-center min-h-[60vh]"><SynapticLoader size="lg" /></div>}
        >
        <div className="w-full h-full animate-fade-in pb-8">
            {sortedQuizzes.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative group p-[1px] rounded-3xl overflow-hidden max-w-lg mx-auto mt-6 sm:mt-12"
                    >
                        {/* Glow Background Layer */}
                        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl transition-colors duration-300 z-0" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0" />

                        {/* Interactive Inner Shadow / Border */}
                        <div className="absolute inset-0 rounded-3xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-hover:border-indigo-300 dark:group-hover:border-indigo-500" />

                        {/* Centered Subtle Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] rounded-full blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-indigo-500/20" />

                        <div className="relative z-20 text-center py-8 px-4 sm:py-16 sm:px-6">
                            <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50 shadow-inner">
                                <BookOpen className="w-7 h-7 sm:w-10 sm:h-10 text-indigo-400 dark:text-indigo-500 drop-shadow-sm" />
                            </div>

                            <h3 className="text-xl sm:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 mb-2 sm:mb-3 drop-shadow-sm">
                                No Attempted Quizzes
                            </h3>

                            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium mb-6 sm:mb-8 max-w-sm mx-auto">
                                You haven't finished any quizzes yet. Complete a quiz to see your results here!
                            </p>

                            <button
                                onClick={() => navigate('/quiz/config')}
                                className="relative group/btn overflow-hidden px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 border border-indigo-500 dark:border-indigo-400 shadow-lg hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 flex items-center gap-3 mx-auto"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />

                                <motion.div whileHover={{ scale: 1.2, rotate: 90 }} transition={{ type: "spring", stiffness: 200 }}><PlusCircle className="w-5 h-5 text-indigo-50" /></motion.div>
                                <span className="font-bold text-white tracking-wide">
                                    Create New Quiz
                                </span>
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-col gap-6"
                    >
                        <QuizLibraryToolbar
                            count={sortedQuizzes.length}
                            label="Attempted"
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            sortMethod={sortMethod}
                            setSortMethod={setSortMethod}
                            showScoreSort={true}
                        />

                        <div className={`grid gap-4 sm:gap-6 z-20 ${viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                        {sortedQuizzes.map((quiz, index) => (
                            <AttemptedQuizCard
                                key={quiz.id}
                                quiz={quiz}
                                index={index}
                                onViewResults={handleViewResults}
                                onDelete={handleDelete}
                                onEditName={(id, newName) => {
                                    setEditingId(id);
                                    setEditName(newName);
                                    saveEditCard(id, newName);
                                }}
                            />
                        ))}
                        </div>
                    </motion.div>
                )}
        </div>
        </QueryStateHandler>
    );
};
