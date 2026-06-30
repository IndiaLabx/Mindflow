import { RotateCcw } from "lucide-react";
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Clock, BookOpen, Edit2, Check, X, Save, ArrowLeft, Trash2, CheckCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { SavedDeck, VocabType } from '../types';
import { deckService } from '../services/deckService';
import { SynapticLoader } from '../../../components/ui/SynapticLoader';
import { useAuth } from '../../auth';
import { motion } from 'framer-motion';
import { QuizLibraryToolbar } from '../../quiz/components/QuizLibraryToolbar';

interface VocabLibraryProps {
  vocabType: VocabType;
  onBack: () => void;
  onStartDeck: (deckId: string) => void;
}

export const VocabLibrary: React.FC<VocabLibraryProps> = ({ vocabType, onBack, onStartDeck }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'attempted' ? 'attempted' : 'created';

  const [decks, setDecks] = useState<SavedDeck[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortMethod, setSortMethod] = useState<'date-desc' | 'date-asc' | 'name-asc' | 'name-desc'>('date-desc');

  useEffect(() => {
    if (user) {
      loadDecks();
    }
  }, [user, vocabType]);

  const loadDecks = async () => {
    try {
      setLoading(true);
      const data = await deckService.getUserDecks(vocabType, user!.id);
      setDecks(data);
    } catch (e) {
      console.error('Failed to load decks', e);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: 'created' | 'attempted') => {
    setSearchParams({ tab }, { replace: true });
  };

  const handleDelete = async (deckId: string) => {
    if (confirm("Are you sure you want to delete this deck?")) {
        try {
            await deckService.deleteDeck(vocabType, deckId);
            setDecks(prev => prev.filter(d => d.id !== deckId));
        } catch (e) {
            console.error("Failed to delete deck", e);
        }
    }
  };

  const filteredDecks = useMemo(() => {
      return decks.filter(deck => activeTab === 'created' ? deck.status !== 'completed' : deck.status === 'completed');
  }, [decks, activeTab]);

  const sortedDecks = useMemo(() => {
      return [...filteredDecks].sort((a, b) => {
          switch (sortMethod) {
              case 'date-desc':
                  return b.created_at - a.created_at;
              case 'date-asc':
                  return a.created_at - b.created_at;
              case 'name-asc':
                  return (a.name || 'Untitled Deck').localeCompare(b.name || 'Untitled Deck');
              case 'name-desc':
                  return (b.name || 'Untitled Deck').localeCompare(a.name || 'Untitled Deck');
              default:
                  return 0;
          }
      });
  }, [filteredDecks, sortMethod]);

  if (loading) return <SynapticLoader />;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-700 relative overflow-hidden">
      {/* Header Title & Back Button */}
      <div className="flex flex-col gap-3 sm:gap-6 mb-2 sm:mb-6 p-4 sm:p-6 lg:p-8 z-10">
          <div className="flex items-center gap-3 sm:gap-4">
              <button
                  onClick={onBack}
                  className="z-20 flex items-center justify-center p-2 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-all shadow-sm backdrop-blur-sm border border-white/20 dark:border-gray-700/30"
                  title="Back"
              >
                  <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight drop-shadow-sm capitalize">
                  {vocabType === 'ows' ? 'One Word Substitution' : vocabType} Library
              </h1>
          </div>

          {/* Tabs Navigation */}
          <div className="flex p-1 bg-indigo-50/50 dark:bg-slate-800/50 rounded-xl border border-indigo-100/50 dark:border-slate-700/50 backdrop-blur-sm shadow-sm w-full sm:w-fit self-start">
              <button
                  onClick={() => handleTabChange('created')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg transition-all text-sm sm:text-base ${
                      activeTab === 'created'
                      ? 'bg-white dark:bg-slate-700 shadow-sm border border-indigo-100 dark:border-slate-600 font-bold text-indigo-700 dark:text-indigo-300'
                      : 'hover:bg-white/50 dark:hover:bg-slate-700/50 font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
              >
                  <BookOpen className="w-4 h-4" />
                  Saved Decks
              </button>
              <button
                  onClick={() => handleTabChange('attempted')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg transition-all text-sm sm:text-base ${
                      activeTab === 'attempted'
                      ? 'bg-white dark:bg-slate-700 shadow-sm border border-indigo-100 dark:border-slate-600 font-bold text-emerald-700 dark:text-emerald-400'
                      : 'hover:bg-white/50 dark:hover:bg-slate-700/50 font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
              >
                  <CheckCircle className="w-4 h-4" />
                  Attempted
              </button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-8 z-10 w-full max-w-7xl mx-auto">
        <QuizLibraryToolbar
            count={sortedDecks.length}
            label={activeTab === 'created' ? 'Saved' : 'Attempted'}
            viewMode={viewMode}
            setViewMode={setViewMode}
            sortMethod={sortMethod}
            setSortMethod={setSortMethod}
            showScoreSort={false}
        />

        {sortedDecks.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 py-12">
             <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
             <p>No decks found.</p>
          </div>
        ) : (
          <div className={`grid gap-4 sm:gap-6 z-20 ${viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              {sortedDecks.map(deck => (
                <motion.div
                  key={deck.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl p-4 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{deck.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Created: {new Date(deck.created_at).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => handleDelete(deck.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors">
                        <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                     <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className={`capitalize px-2 py-1 rounded-md text-xs font-semibold ${deck.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400'}`}>
                            {deck.status}
                        </span>
                     </div>

                     <button
                        onClick={() => onStartDeck(deck.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm ${deck.status === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                     >
                        {deck.status === 'completed' ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        {deck.status === 'active' || deck.status === 'paused' ? 'Resume' : 'Restart'}
                     </button>
                  </div>
                </motion.div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
