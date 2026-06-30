import React, { useState, useEffect } from 'react';
import { Layers, Plus, Play, MoreVertical, Edit2, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/Button/Button';
import { useAuth } from '@/features/auth';
import { supabase } from '@/lib/supabase';
import { ExamBlueprint } from '@/features/blueprints';
import { BlueprintBuilder } from '@/features/blueprints';
import { useNotification } from '@/stores/useNotificationStore';
import { motion, AnimatePresence } from 'framer-motion';
import { CookingLoader } from '@/features/quiz';

interface ExamBlueprintsHubProps {
  onBack: () => void;
  onLaunchBlueprint: (blueprint: ExamBlueprint) => void;
  metadataIndex?: Record<string, Record<string, Set<string>>>;
}

export const ExamBlueprintsHubPage: React.FC<ExamBlueprintsHubProps> = ({ onBack, onLaunchBlueprint, metadataIndex }) => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [blueprints, setBlueprints] = useState<ExamBlueprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuilding, setIsBuilding] = useState(false);
  const [editingBlueprint, setEditingBlueprint] = useState<ExamBlueprint | null>(null);

  useEffect(() => {
    if (user) {
      fetchBlueprints();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchBlueprints = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_exam_blueprints')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setBlueprints(data.map(item => ({
          id: item.id,
          name: item.name,
          totalQuestions: item.config.totalQuestions,
          nodes: item.config.nodes,
          created_at: item.created_at
        })));
      }
    } catch (err: any) {
      showToast({ title: 'Error fetching blueprints', message: err.message, variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this blueprint?')) return;

    try {
      const { error } = await supabase.from('user_exam_blueprints').delete().eq('id', id);
      if (error) throw error;
      setBlueprints(prev => prev.filter(b => b.id !== id));
      showToast({ title: 'Deleted', message: 'Blueprint deleted successfully.', variant: 'success' });
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, variant: 'error' });
    }
  };

  const handleEdit = (blueprint: ExamBlueprint, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBlueprint(blueprint);
    setIsBuilding(true);
  };

  const handleSave = async (blueprint: ExamBlueprint) => {
    if (!user) {
      showToast({ title: 'Auth Required', message: 'Please login to save blueprints', variant: 'error' });
      return;
    }

    try {
      const payload = {
        user_id: user.id,
        name: blueprint.name,
        config: { totalQuestions: blueprint.totalQuestions, nodes: blueprint.nodes }
      };

      if (blueprint.id) {
        const { error } = await supabase
          .from('user_exam_blueprints')
          .update(payload)
          .eq('id', blueprint.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_exam_blueprints')
          .insert([payload]);
        if (error) throw error;
      }

      showToast({ title: 'Success', message: 'Blueprint saved!', variant: 'success' });
      setIsBuilding(false);
      setEditingBlueprint(null);
      fetchBlueprints();
    } catch (err: any) {
      showToast({ title: 'Error saving', message: err.message, variant: 'error' });
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center px-6">
        <Layers className="w-16 h-16 text-purple-500 mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-white mb-2">Auth Required</h2>
        <p className="text-gray-400 mb-6">You must be logged in to create and manage God-Mode Exam Blueprints.</p>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  if (isBuilding) {
    return (
      <BlueprintBuilder
        initialData={editingBlueprint || undefined}
        onSave={handleSave}
        onCancel={() => { setIsBuilding(false); setEditingBlueprint(null); }}
        onLaunch={onLaunchBlueprint}
        metadataIndex={metadataIndex}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
             aria-label="Go back">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Exam Blueprints
            </h1>
          </div>
          <Button
            onClick={() => setIsBuilding(true)}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Blueprint
          </Button>
        </div>

        <p className="text-gray-400">
          Design your absolute "God-Mode" exams. Define exact mathematical weightages, set strict limits per subject, and guarantee zero repetitions across attempts.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-12"><CookingLoader progress={1} syncedItems={1} totalItems={1} /></div>
        ) : blueprints.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <Layers className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Blueprints Yet</h3>
            <p className="text-gray-400 max-w-sm mx-auto mb-6">
              Create your first blueprint to unlock proportional algorithmic sampling for your exams.
            </p>
            <Button onClick={() => setIsBuilding(true)} variant="primary">
              Create First Blueprint
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence>
              {blueprints.map(bp => (
                <motion.div
                  key={bp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1 truncate pr-8">{bp.name}</h3>
                      <p className="text-sm text-gray-400">{bp.totalQuestions} Questions Total</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button onClick={(e) => handleEdit(bp, e)} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => handleDelete(bp.id!, e)} className="p-2 text-gray-400 hover:text-red-400 rounded-full hover:bg-white/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 flex gap-3">
                    <Button
                      className="flex-1 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 hover:text-purple-200 border border-purple-500/30"
                      onClick={() => onLaunchBlueprint(bp)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Generate Exam
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
