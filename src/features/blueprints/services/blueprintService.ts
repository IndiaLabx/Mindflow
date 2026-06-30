import { supabase } from '../../../lib/supabase';
import { CalculatedQuery } from '../engine/blueprintMath';
import { Question } from '../../quiz/types';

export const fetchBlueprintQuestions = async (
  userId: string,
  blueprintId: string,
  queries: CalculatedQuery[]
): Promise<Question[]> => {
  if (!queries || queries.length === 0) return [];

  // Convert logical 'All' to null for SQL parsing
  const formattedQueries = queries.map(q => ({
    ...q,
    difficulty: q.difficulty === 'All' ? null : q.difficulty
  }));

  try {
    const { data, error } = await supabase.rpc('get_blueprint_questions', {
      p_user_id: userId,
      p_blueprint_id: blueprintId,
      p_queries: formattedQueries
    });

    if (error) {
      console.error("RPC Error:", error);
      throw error;
    }

    if (!data || data.length === 0) return [];

    // The RPC returns { question_id, subject, topic, difficulty }.
    // We need to fetch the full question bodies using the existing helper, or just directly via IDs
    const questionIds = data.map((row: any) => row.question_id);

    // Fetch full data using the optimized batch function
    const { fetchQuestionsByIds } = await import('../../quiz/services/questionService');
    const fullQuestions = await fetchQuestionsByIds(questionIds);

    return fullQuestions;
  } catch (error) {
    console.error("Failed to fetch blueprint queries:", error);
    throw error;
  }
};

export const markQuestionsAsSeen = async (
  userId: string,
  blueprintId: string,
  questionIds: string[]
) => {
  if (!questionIds.length) return;

  const payload = questionIds.map(id => ({
    user_id: userId,
    blueprint_id: blueprintId,
    question_id: id
  }));

  try {
    const { error } = await supabase
      .from('blueprint_seen_questions')
      .insert(payload)
      // On conflict do nothing just in case
      ;
    if (error && error.code !== '23505') throw error; // Ignore unique constraint violations
  } catch (err) {
    console.error("Failed to log seen questions:", err);
  }
};
