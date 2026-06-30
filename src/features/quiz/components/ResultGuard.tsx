import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useQuizSessionStore } from '../stores/useQuizSessionStore';
import { supabase } from '../../../lib/supabase';
import { SynapticLoader } from '../../../components/ui/SynapticLoader';
import { ErrorState } from '../../../components/ui/ErrorState';
import { ArrowLeft } from 'lucide-react';

export const ResultGuard = ({ children }: { children: React.ReactNode }) => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const state = useQuizSessionStore();

    // Check if we already have the state fully hydrated in memory
    const isAlreadyHydrated = Boolean(
        quizId &&
        state.quizId === quizId &&
        state.status === 'result' &&
        state.activeQuestions &&
        state.activeQuestions.length > 0
    );

    const { isLoading, isError, error, refetch } = useQuery({
        queryKey: ['quiz-result', quizId],
        queryFn: async () => {
            if (!quizId) throw new Error("Quiz ID is missing.");

            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                throw new Error("Please login to continue.");
            }

            const { data: quizData, error: err } = await supabase
                .from('saved_quizzes')
                .select('*, bridge_saved_quiz_questions(question_id, sort_order)')
                .eq('id', quizId)
                .single();

            if (err || !quizData) {
                console.error("Failed to fetch quiz for hydration:", err);
                throw new Error("Quiz not found or could not be loaded.");
            }

            if (quizData.user_id !== session.user.id) {
                throw new Error("You do not have permission to view this quiz.");
            }

            const parsedState = typeof quizData.state === 'string' ? JSON.parse(quizData.state) : (quizData.state || {});
            if (quizData.status === 'result') {
                parsedState.status = 'result';
            }

            if (quizData.status !== 'result') {
                 throw new Error("This quiz has not been completed yet.");
            }

            const bridgeData = quizData.bridge_saved_quiz_questions || [];
            bridgeData.sort((a: any, b: any) => a.sort_order - b.sort_order);
            const questionIds = bridgeData.map((bq: any) => bq.question_id);

            if (questionIds.length === 0) {
                 console.error("Hydration failed: bridge table returned 0 question IDs.");
                 throw new Error("Quiz is empty.");
            }

            const { data: qData, error: qError } = await supabase
                .from('questions')
                .select('*')
                .in('id', questionIds);

            if (qError) {
                 console.error("Failed to fetch study materials:", qError);
                 throw new Error("Failed to fetch quiz questions.");
            }

            const questionsMap = new Map((qData || []).map(q => [String(q.id), q]));

            const fullQuestions: any[] = [];
            bridgeData.forEach((bq: any) => {
                const q = questionsMap.get(String(bq.question_id));
                if (q) fullQuestions.push(q);
            });

            if (fullQuestions.length === 0) {
                console.error("Hydration failed: mapped question array is empty. DB IDs might be missing from questions.");
                throw new Error("Quiz questions are missing.");
            }

            // Load into Zustand Store explicitly merging ID
            state.loadSavedQuiz({
                ...parsedState,
                activeQuestions: fullQuestions,
                quizId: quizId,
                isPaused: false
            });

            return true;
        },
        enabled: !isAlreadyHydrated && !!quizId,
        retry: false
    });

    if (isError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                 <ErrorState
                    message={error instanceof Error ? error.message : "An unexpected error occurred."}
                    actionText="Retry or Go Back"
                    actionIcon={ArrowLeft}
                    onRetry={() => refetch().catch(() => navigate('/dashboard'))}
                />
            </div>
        );
    }

    if (!isAlreadyHydrated && isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <SynapticLoader size="lg" />
                <p className="mt-4 text-gray-500">Loading quiz results...</p>
            </div>
        );
    }

    return <>{children}</>;
};
