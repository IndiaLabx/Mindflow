import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuizSessionStore } from '../stores/useQuizSessionStore';
import { supabase } from '../../../lib/supabase';
import { db } from '../../../lib/db';
import { syncService } from '../../../lib/syncService';
import { SynapticLoader } from '../../../components/ui/SynapticLoader';
import { ErrorState } from '../../../components/ui/ErrorState';
import { ArrowLeft } from 'lucide-react';
import { fetchQuestionsByIds } from '../services/questionService';

const WINDOW_SIZE = 50;
const PREFETCH_THRESHOLD = 10;

export const QuizSessionGuard = ({ children }: { children: React.ReactNode }) => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const state = useQuizSessionStore();
    const [isHydrating, setIsHydrating] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Ref to keep track of which IDs we've already hydrated to avoid redundant network calls
    const hydratedIdsRef = useRef<Set<string>>(new Set());

    // 1. Initial Session Hydration (either from IDB/Supabase if resuming, or directly taking from store if new)
    useEffect(() => {
        const hydrateQuizSession = async () => {
            if (!quizId) {
                setError("Quiz ID is missing.");
                setIsHydrating(false);
                return;
            }

            // A. If the store is already active with this specific quiz (New Quiz Started)
            if (state.quizId === quizId && state.activeQuestions && state.activeQuestions.length > 0) {
                // Determine which questions need full content based on current index
                const startIndex = Math.max(0, state.currentQuestionIndex - 10); // buffer for backward nav
                const endIndex = startIndex + WINDOW_SIZE;
                const questionsToHydrate = state.activeQuestions.slice(startIndex, endIndex);

                // Check if they need hydration (missing 'question' field)
                const unhydratedIds = questionsToHydrate.filter(q => !q.question).map(q => q.id);

                if (unhydratedIds.length > 0) {
                    try {
                        const fullQuestions = await fetchQuestionsByIds(unhydratedIds);
                        state.hydrateQuestions(fullQuestions);
                        fullQuestions.forEach(q => hydratedIdsRef.current.add(q.id));
                    } catch (e) {
                         console.error("Initial window hydration failed", e);
                         setError("Failed to load initial questions.");
                    }
                }

                setIsHydrating(false);
                return;
            }

            // B. Resuming a saved quiz from Dashboard
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) {
                    setError("Please login to continue.");
                    setIsHydrating(false);
                    return;
                }

                // 1. Fetch lightweight structure (IDs only)
                const { data: quizData, error } = await supabase
                    .from('saved_quizzes')
                    .select('*, bridge_saved_quiz_questions(question_id, sort_order)')
                    .eq('id', quizId)
                    .single();

                if (error || !quizData) {
                    console.error("Failed to fetch quiz for hydration:", error);
                    setError("Quiz not found or could not be loaded.");
                    setIsHydrating(false);
                    return;
                }

                if (quizData.user_id !== session.user.id) {
                    setError("You do not have permission to view this quiz.");
                    setIsHydrating(false);
                    return;
                }

                const bridgeData = quizData.bridge_saved_quiz_questions || [];
                bridgeData.sort((a: any, b: any) => a.sort_order - b.sort_order);
                const allQuestionIds = bridgeData.map((bq: any) => bq.question_id);

                if (allQuestionIds.length > 0) {
                    const parsedState = typeof quizData.state === 'string' ? JSON.parse(quizData.state) : (quizData.state || {});
                    if (quizData.status) parsedState.status = quizData.status;

                    let finalStateToLoad = parsedState;
                    try {
                        const localQuiz = await db.getQuiz(quizId);
                        if (localQuiz && localQuiz.state) {
                            const localUpdated = (localQuiz.state as any).last_updated || 0;
                            const remoteUpdated = parsedState.last_updated || 0;
                            const isRemoteCompleted = parsedState.status === 'result' || quizData.status === 'result';
                            const isLocalCompleted = localQuiz.state.status === 'result';

                            if (!isRemoteCompleted && !isLocalCompleted && localUpdated > remoteUpdated) {
                                finalStateToLoad = localQuiz.state;
                            }
                        }
                    } catch (dbErr) {
                        console.error("Failed to read IndexedDB", dbErr);
                    }

                    // 2. Fetch full content ONLY for the current window
                    const currentIndex = finalStateToLoad.currentQuestionIndex || 0;
                    const startIndex = Math.max(0, currentIndex - 10);
                    const endIndex = startIndex + WINDOW_SIZE;

                    const windowIds = allQuestionIds.slice(startIndex, endIndex);

                    const { data: qData, error: qError } = await supabase
                        .from('questions')
                        .select('*')
                        .in('id', windowIds);

                    if (qError) {
                         setError("Failed to fetch quiz questions.");
                         setIsHydrating(false);
                         return;
                    }

                    const questionsMap = new Map((qData || []).map(q => [String(q.id), q]));

                    // We must build the full array of questions (metadata only for outside window, full for inside)
                    const mixedQuestions: any[] = allQuestionIds.map((id: any) => {
                         const strId = String(id);
                         if (questionsMap.has(strId)) {
                             hydratedIdsRef.current.add(strId);
                             return questionsMap.get(strId);
                         }
                         // Placeholder for unhydrated
                         return { id: strId, question: '', options: [] };
                    });

                    state.loadSavedQuiz({
                        ...finalStateToLoad,
                        activeQuestions: mixedQuestions,
                        quizId: quizId,
                        quizName: quizData.name,
                        isPaused: false
                    });
                } else {
                     setError("Quiz is empty.");
                     setIsHydrating(false);
                     return;
                }

                setIsHydrating(false);
            } catch (err) {
                console.error("Hydration error:", err);
                setError("An unexpected error occurred while loading the quiz.");
                setIsHydrating(false);
            }
        };

        hydrateQuizSession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quizId]);

    // 2. Background Prefetching (Sliding Window)
    useEffect(() => {
        if (isHydrating || !state.activeQuestions || state.activeQuestions.length === 0) return;

        const currentIndex = state.currentQuestionIndex;
        const total = state.activeQuestions.length;

        // Find how many unhydrated questions are left in our lookahead window
        const lookaheadEnd = Math.min(currentIndex + WINDOW_SIZE, total);
        const unhydratedInWindow = state.activeQuestions
             .slice(currentIndex, lookaheadEnd)
             .filter(q => !q.question && !hydratedIdsRef.current.has(q.id));

        // If we drop below our threshold of hydrated questions ahead of us,
        // OR we are missing questions we currently need, trigger a batch fetch.
        // We fetch the entire next WINDOW_SIZE chunk of unhydrated questions.
        const hydratedAheadCount = (lookaheadEnd - currentIndex) - unhydratedInWindow.length;

        if (hydratedAheadCount <= PREFETCH_THRESHOLD || unhydratedInWindow.length > 0) {
            // Find the NEXT 50 unhydrated questions to batch fetch, starting from current index
            const questionsToHydrate = state.activeQuestions
                .slice(currentIndex, currentIndex + (WINDOW_SIZE * 2)) // Look a bit further to grab a full batch
                .filter(q => !q.question && !hydratedIdsRef.current.has(q.id))
                .slice(0, WINDOW_SIZE); // Only take WINDOW_SIZE amount at a time

            if (questionsToHydrate.length === 0) return;
            const idsToFetch = questionsToHydrate.map(q => q.id);

            // Optimistically mark as hydrating to prevent duplicate calls
            idsToFetch.forEach(id => hydratedIdsRef.current.add(id));

            fetchQuestionsByIds(idsToFetch)
                .then(fullQuestions => {
                    state.hydrateQuestions(fullQuestions);
                })
                .catch(err => {
                    console.error("Sliding window prefetch failed", err);
                    // Remove from ref so we can try again later
                    idsToFetch.forEach(id => hydratedIdsRef.current.delete(id));
                });
        }

    }, [state.currentQuestionIndex, state.activeQuestions, isHydrating, state]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                 <ErrorState
                    message={error}
                    actionText="Go Back to Dashboard"
                    actionIcon={ArrowLeft}
                    onRetry={() => navigate('/dashboard')}
                />
            </div>
        );
    }

    if (isHydrating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <SynapticLoader size="lg" />
                <p className="mt-4 text-gray-500">Loading your quiz session...</p>
            </div>
        );
    }

    return <>{children}</>;
};
