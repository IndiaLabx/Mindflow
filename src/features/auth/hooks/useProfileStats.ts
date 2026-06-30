import { useState, useEffect } from 'react';
import { db } from '../../../lib/db';
import { useAuth } from '../context/AuthContext';

export interface ProfileStats {
  weakTopics: string[];
  quizzesCompleted: number;
  correctAnswers: number;
  averageScore: number;
  totalTimeSpentFormatted: string;
}

const formatTime = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export const useProfileStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({
    weakTopics: [],
    quizzesCompleted: 0,
    correctAnswers: 0,
    averageScore: 0,
    totalTimeSpentFormatted: '0s',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        let quizzesCompleted = 0;
        let correctAnswers = 0;
        let totalQuestionsAnswered = 0; // Sum of correct and incorrect (not skipped)
        let totalTimeSpent = 0;

        let subjectTotals: Record<string, { correct: number; incorrect: number }> = {};

        // Fetch from IndexedDB for both logged in and guest users to ensure fast loading.
        // syncService handles syncing this with Supabase in the background.
        const localHistory: any[] = [];

        if (localHistory && localHistory.length > 0) {
          quizzesCompleted = localHistory.length;
          localHistory.forEach((record: any) => {
            // handle both camelCase (local) and snake_case (synced from remote) if needed
            const recordCorrect = record.totalCorrect ?? record.total_correct ?? 0;
            const recordIncorrect = record.totalIncorrect ?? record.total_incorrect ?? 0;
            const recordTime = record.totalTimeSpent ?? record.total_time_spent ?? 0;
            const recordStats = record.subjectStats ?? record.subject_stats;

            correctAnswers += recordCorrect;
            totalQuestionsAnswered += recordCorrect + recordIncorrect;
            totalTimeSpent += recordTime;

            if (recordStats) {
                Object.entries(recordStats as Record<string, any>).forEach(([subject, s]) => {
                    if (!subjectTotals[subject]) subjectTotals[subject] = { correct: 0, incorrect: 0 };
                    subjectTotals[subject].correct += s.correct || 0;
                    subjectTotals[subject].incorrect += s.incorrect || 0;
                });
            }
          });
        }

        if (isMounted) {
          let averageScore = 0;
          if (totalQuestionsAnswered > 0) {
            averageScore = Math.round((correctAnswers / totalQuestionsAnswered) * 100);
          }

          // Calculate weak topics
          const weakTopicsList: { subject: string; accuracy: number }[] = [];
          Object.entries(subjectTotals).forEach(([subject, stats]) => {
              const attempts = stats.correct + stats.incorrect;
              if (attempts >= 5) { // Minimum 5 attempts to be considered
                  const accuracy = (stats.correct / attempts) * 100;
                  weakTopicsList.push({ subject, accuracy });
              }
          });

          // Sort by lowest accuracy first, and take top 2
          weakTopicsList.sort((a, b) => a.accuracy - b.accuracy);
          const weakTopics = weakTopicsList.slice(0, 2).map(t => t.subject);

          setStats({
            quizzesCompleted,
            correctAnswers,
            averageScore,
            weakTopics,
            totalTimeSpentFormatted: formatTime(totalTimeSpent),
          });

        }
      } catch (err: any) {
        console.error('Error fetching profile stats:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load statistics');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return { stats, loading, error };
};
