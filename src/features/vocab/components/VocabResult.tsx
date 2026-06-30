import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Trophy, Clock, Target, ArrowRight, BarChart3,
    CheckCircle2, XCircle, AlertCircle, Home, RotateCcw, Flame
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { SynapticLoader } from '../../../components/ui/SynapticLoader';
import { VocabType, SavedDeck, UserDeckAnswer } from '../types';
import { useAuth } from '../../auth';
import { deckService } from '../services/deckService';

interface VocabResultProps {
    vocabType: VocabType;
}

export const VocabResult: React.FC<VocabResultProps> = ({ vocabType }) => {
    const { deckId } = useParams<{ deckId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [deck, setDeck] = useState<SavedDeck | null>(null);
    const [answers, setAnswers] = useState<UserDeckAnswer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadResult = async () => {
            if (!deckId || !user) return;
            try {
                // Fetch deck to ensure it's completed and get metadata
                const decks = await deckService.getUserDecks(vocabType, user.id);
                const currentDeck = decks.find(d => d.id === deckId);
                if (currentDeck) {
                    setDeck(currentDeck);

                    // Note: Depending on how we saved answers, we might read from the deck state directly
                    // since DeckSession just recorded answers into `deck.state.answers`.
                    // Let's use the deck.state.answers since we didn't inject individual rows into `user_ows_deck_answers`
                    // on every swipe to avoid DB spam.
                }
            } catch (err) {
                console.error("Failed to load deck result", err);
            } finally {
                setLoading(false);
            }
        };
        loadResult();
    }, [deckId, user, vocabType]);

    if (loading || !deck) return <SynapticLoader />;

    // Calculate Stats from state.answers
    const answerEntries = Object.entries(deck.state.answers || {});
    const totalWords = deck.state.currentQuestionIndex + 1; // Or the total length if we have it
    // Actually, state.answers is populated as { wordId: 'mastered' }

    const mastered = answerEntries.filter(([_, s]) => s === 'mastered').length;
    const tricky = answerEntries.filter(([_, s]) => s === 'tricky').length;
    const review = answerEntries.filter(([_, s]) => s === 'review').length;
    const clueless = answerEntries.filter(([_, s]) => s === 'clueless').length;

    // Fallback logic for synonyms which might only have "familiar" or "mastered"
    const totalAnswered = answerEntries.length;

    const timeSpent = deck.state.timeSpent || 0; // ms
    const timeSpentMinutes = Math.floor(timeSpent / 60000);
    const timeSpentSeconds = Math.floor((timeSpent % 60000) / 1000);

    const accuracy = totalAnswered > 0 ? Math.round((mastered / totalAnswered) * 100) : 0;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
            <div className="relative z-10 flex flex-col min-h-screen w-full max-w-4xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-6 shadow-xl"
                    >
                        <Trophy className="w-12 h-12 text-white" />
                    </motion.div>
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-2"
                    >
                        Deck Completed!
                    </motion.h1>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-slate-600 dark:text-slate-400"
                    >
                        {deck.name}
                    </motion.p>
                </div>

                {/* Stats Grid */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                >
                    <StatCard icon={<CheckCircle2 />} label="Mastered" value={mastered} color="text-green-500" />
                    <StatCard icon={<AlertCircle />} label="Tricky" value={tricky} color="text-yellow-500" />
                    <StatCard icon={<Clock />} label="To Review" value={review} color="text-orange-500" />
                    <StatCard icon={<XCircle />} label="Clueless" value={clueless} color="text-red-500" />
                </motion.div>

                {/* Secondary Stats */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-10 flex justify-around"
                >
                    <div className="text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Time Spent</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {timeSpentMinutes}m {timeSpentSeconds}s
                        </p>
                    </div>
                    <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                    <div className="text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Mastery Rate</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{accuracy}%</p>
                    </div>
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <button
                        onClick={() => navigate(`/vocab/${vocabType}/library`)}
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-bold transition-colors"
                    >
                        <Home className="w-5 h-5" /> Back to Library
                    </button>
                    <button
                        onClick={() => navigate(`/vocab/${vocabType}`)}
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/30"
                    >
                        Continue Learning <ArrowRight className="w-5 h-5" />
                    </button>
                </motion.div>

            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, color }: any) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center shadow-sm">
        <div className={`mb-3 ${color}`}>
            {React.cloneElement(icon, { className: "w-8 h-8" })}
        </div>
        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{value}</h3>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
);
