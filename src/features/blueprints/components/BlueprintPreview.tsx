import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { Button } from '@/components/Button/Button';
import { ExamBlueprint } from '@/features/blueprints/types/blueprint';
import { calculateBlueprintAllocations, generateQueriesFromTree } from '@/features/blueprints/engine/blueprintMath';
import { fetchBlueprintQuestions, markQuestionsAsSeen } from '@/features/blueprints/services/blueprintService';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Question } from '@/features/quiz/types';
import { CookingLoader } from '@/features/quiz/components/CookingLoader';
import { useNotification } from '@/stores/useNotificationStore';

interface BlueprintPreviewProps {
  blueprint: ExamBlueprint;
  onBack: () => void;
  onStartExam: (questions: Question[]) => void;
}

export const BlueprintPreview: React.FC<BlueprintPreviewProps> = ({ blueprint, onBack, onStartExam }) => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [isCompiling, setIsCompiling] = useState(true);
  const [fetchedQuestions, setFetchedQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    compileBlueprint();
  }, []);

  const compileBlueprint = async () => {
    if (!user || !blueprint.id) return;
    setIsCompiling(true);

    try {
      // 1. Math calculation
      const calculatedTree = calculateBlueprintAllocations(blueprint.totalQuestions, blueprint.nodes);

      // 2. Generate flat queries
      const queries = generateQueriesFromTree(calculatedTree);

      // 3. Fetch from DB
      const questions = await fetchBlueprintQuestions(user.id, blueprint.id, queries);

      // 4. Group stats for UI
      const breakdown = queries.map(q => {
        const foundCount = questions.filter(fq =>
          (q.subject ? (fq.subject ?? fq.classification?.subject) === q.subject : true) &&
          (q.topic ? (fq.topic ?? fq.classification?.topic) === q.topic : true) &&
          (q.subTopic ? (fq.subTopic ?? fq.classification?.subTopic) === q.subTopic : true) &&
          (q.difficulty !== 'All' ? (fq.properties?.difficulty) === q.difficulty : true)
        ).length;

        return {
          query: q,
          requested: q.limit,
          found: foundCount
        };
      });

      setStats(breakdown);
      setFetchedQuestions(questions);
    } catch (err: any) {
      showToast({ title: 'Compilation Failed', message: err.message, variant: 'error' });
    } finally {
      setIsCompiling(false);
    }
  };

  const handleStart = async () => {
    if (!user || !blueprint.id) return;

    // Log seen questions to enforce uniqueness in future exams
    const ids = fetchedQuestions.map(q => q.id);
    await markQuestionsAsSeen(user.id, blueprint.id, ids);

    // Shuffle globally
    const shuffled = [...fetchedQuestions].sort(() => Math.random() - 0.5);
    onStartExam(shuffled);
  };

  if (isCompiling) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <CookingLoader progress={1} syncedItems={1} totalItems={1} />
        <p className="mt-4 text-gray-400 text-sm">Running TABLE_SAMPLE queries to fetch unseen data...</p>
      </div>
    );
  }

  const totalFound = fetchedQuestions.length;
  const isPerfect = totalFound === blueprint.totalQuestions;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-6 pb-24">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors" aria-label="Go back">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h1 className="text-2xl font-bold">Blueprint Compilation Report</h1>
        </div>

        <div className={`p-5 rounded-xl border ${isPerfect ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
          <div className="flex items-start space-x-4">
            {isPerfect ? <CheckCircle className="w-8 h-8 text-green-400 mt-1" /> : <AlertTriangle className="w-8 h-8 text-yellow-400 mt-1" />}
            <div>
              <h2 className="text-xl font-bold mb-1">
                {isPerfect ? 'Compilation Successful' : 'Partial Compilation Warning'}
              </h2>
              <p className="text-gray-300">
                Requested: <strong>{blueprint.totalQuestions}</strong> | Generated: <strong>{totalFound}</strong>
              </p>
              {!isPerfect && (
                <p className="text-sm text-yellow-300/80 mt-2">
                  Some specific filters ran out of *unseen* questions. We fetched as many as possible based on your constraints.
                  Adjust your blueprint or create a new one to reset history.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="font-semibold text-lg mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-purple-400" /> Breakdown
          </h3>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            {stats.map((stat, i) => (
              <div key={i} className="flex justify-between items-center bg-black/40 p-3 rounded border border-white/5">
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {stat.query.subject || 'Any Subject'}
                    {stat.query.topic ? ` > ${stat.query.topic}` : ''}
                    {stat.query.subTopic ? ` > ${stat.query.subTopic}` : ''}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Diff: {stat.query.difficulty}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${stat.found < stat.requested ? 'text-yellow-400' : 'text-green-400'}`}>
                    {stat.found} / {stat.requested}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
           <Button onClick={compileBlueprint} variant="secondary" className="flex-1">
              Re-Compile (Shuffle)
           </Button>
           <Button onClick={handleStart} variant="primary" className="flex-[2] bg-purple-600 hover:bg-purple-700" disabled={totalFound === 0}>
             <Play className="w-5 h-5 mr-2" /> Start Exam ({totalFound} Qs)
           </Button>
        </div>
      </div>
    </div>
  );
};
