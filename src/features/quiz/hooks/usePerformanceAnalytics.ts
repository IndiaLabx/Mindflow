import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

export interface PerformanceMetrics {
  total_quizzes: number;
  total_correct: number;
  total_incorrect: number;
  total_skipped: number;
  total_time_spent: number;
  total_questions: number;
  average_accuracy: number;
  subject_stats: Record<string, {
    attempted: number;
    correct: number;
    incorrect: number;
    skipped: number;
  }>;
}

export const usePerformanceAnalytics = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['performance-analytics'],
    queryFn: async (): Promise<PerformanceMetrics> => {
      const { data, error } = await supabase.rpc('get_user_performance_metrics');

      if (error) {
        console.error('Failed to fetch performance metrics:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          total_quizzes: 0,
          total_correct: 0,
          total_incorrect: 0,
          total_skipped: 0,
          total_time_spent: 0,
          total_questions: 0,
          average_accuracy: 0,
          subject_stats: {}
        };
      }

      return data[0] as PerformanceMetrics;
    },
    // Adding some default TanStack Query configurations suitable for dashboards
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('reset_user_analytics');
      if (error) {
        console.error('Failed to reset analytics:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate the query so that it refetches immediately and returns zeroes
      queryClient.invalidateQueries({ queryKey: ['performance-analytics'] });
    }
  });

  return {
    ...query,
    resetMutation
  };
};
