import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ExamBlueprint } from '@/features/blueprints/types/blueprint';
import { BlueprintPreview } from '@/features/blueprints/components/BlueprintPreview';
import { useQuizSessionStore } from '@/features/quiz/stores/useQuizSessionStore';
import { Question } from '@/features/quiz/types';
import { CookingLoader } from '@/features/quiz/components/CookingLoader';
import { useNotification } from '@/stores/useNotificationStore';
import { useAuth } from '@/features/auth/context/AuthContext';

export const BlueprintPreviewWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const { user } = useAuth();
  const [blueprint, setBlueprint] = useState<ExamBlueprint | null>(null);
  const [loading, setLoading] = useState(true);
  const startQuiz = useQuizSessionStore(state => state.startQuiz);

  useEffect(() => {
    const fetchBlueprint = async () => {
      if (!id || !user) return;
      try {
        const { data, error } = await supabase
          .from('user_exam_blueprints')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setBlueprint({
            id: data.id,
            name: data.name,
            totalQuestions: data.config.totalQuestions,
            nodes: data.config.nodes
          });
        }
      } catch (err: any) {
        showToast({ title: 'Error', message: 'Could not load blueprint', variant: 'error' });
        navigate('/quiz/config');
      } finally {
        setLoading(false);
      }
    };

    fetchBlueprint();
  }, [id, user, navigate, showToast]);

  const handleStartExam = async (questions: Question[]) => {
    // Launching in native God Mode for strict exam simulation
    const quizId = crypto.randomUUID();
    const mode = 'god';

    // Save to database first!
    if (user) {
        try {
            const bridgeData = questions.map((q, idx) => ({
                question_id: q.id,
                sort_order: idx
            }));

            const stateToSave = {
                currentQuestionIndex: 0,
                score: 0,
                answers: {},
                timeTaken: {},
                remainingTimes: {},
                quizTimeRemaining: 0,
                bookmarks: [],
                markedForReview: [],
                hiddenOptions: {},
                isPaused: false,
                status: 'quiz',
                mode: mode,
                quizId: quizId
            };

            const { error: rpcError } = await supabase.rpc('create_quiz_session', {
                p_quiz_id: quizId,
                p_user_id: user.id,
                p_name: blueprint?.name || 'Blueprint Exam',
                p_created_at: Date.now(),
                p_filters: { isGodMode: true },
                p_mode: mode,
                p_state: stateToSave,
                p_questions: bridgeData
            });

            if (rpcError) {
                console.error("Failed to save blueprint quiz to db:", rpcError);
                showToast({ title: 'Error', message: 'Could not start exam session', variant: 'error' });
                return;
            }
        } catch (err) {
            console.error("Error saving blueprint quiz:", err);
        }
    }

    startQuiz(questions, { subject: [], topic: [], subTopic: [], difficulty: [], isGodMode: true } as any, 'god', quizId);
    navigate(`/quiz/session/god/${quizId}`);
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><CookingLoader progress={1} syncedItems={1} totalItems={1} /></div>;
  }

  if (!blueprint) {
    return <div className="text-white text-center mt-20">Blueprint not found.</div>;
  }

  return (
    <BlueprintPreview
      blueprint={blueprint}
      onBack={() => navigate('/quiz/config')}
      onStartExam={handleStartExam}
    />
  );
};
