import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { SynapticLoader } from '../../../components/ui/SynapticLoader';
import { BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

export const ShareGatekeeper: React.FC = () => {
    const { originalQuizId } = useParams<{ originalQuizId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading: authLoading } = useAuth();
    const [cloning, setCloning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasAttemptedClone = useRef(false);

    useEffect(() => {
        // Wait until auth state is definitively known
        if (authLoading) return;

        // If not logged in, redirect to login page with returnTo parameter
        if (!user) {
            navigate(`/login?returnTo=/share/${originalQuizId}`, { replace: true });
            return;
        }

        // If logged in but we are already cloning or there's an error, do nothing
        if (cloning || error) return;

        // Prevent double clone execution due to React strict mode or fast re-renders
        if (hasAttemptedClone.current) return;

        const cloneQuiz = async () => {
            if (!originalQuizId) {
                setError('Invalid link: No quiz ID provided.');
                return;
            }

            hasAttemptedClone.current = true;
            setCloning(true);
            try {
                const { data, error: rpcError } = await supabase.rpc('clone_shared_quiz', {
                    p_original_quiz_id: originalQuizId,
                });

                if (rpcError) throw rpcError;

                if (data && data.new_quiz_id && data.mode) {
                    // Navigate to the newly cloned quiz session
                    navigate(`/quiz/session/${data.mode}/${data.new_quiz_id}`, { replace: true });
                } else {
                    throw new Error('Invalid response from cloning service.');
                }
            } catch (err: any) {
                console.error('Error cloning quiz:', err);
                setError(err.message || 'Failed to clone quiz. It may no longer exist.');
            } finally {
                setCloning(false);
            }
        };

        cloneQuiz();
    }, [authLoading, user, originalQuizId, cloning, error, navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center"
            >
                <div className="mx-auto bg-primary-100 dark:bg-primary-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                    <BrainCircuit className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>

                {error ? (
                    <>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                            Oops! Something went wrong.
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            {error}
                        </p>
                        <button
                            onClick={() => navigate('/dashboard', { replace: true })}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
                        >
                            Return Home
                        </button>
                    </>
                ) : (
                    <>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                            Preparing your quiz...
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            We're cloning this shared quiz into your account so you can take it right away.
                        </p>
                        <div className="flex justify-center">
                            <SynapticLoader size="md" />
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
};
