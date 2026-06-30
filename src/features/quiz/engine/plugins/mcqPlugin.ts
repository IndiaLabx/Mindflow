import { QuizPlugin } from '../quizPlugin';
import { Question } from '../../../../types/models';
import { supabase } from '../../../../lib/supabase';

/**
 * Standard Multiple Choice Question (MCQ) Plugin for the GK Quiz.
 * Handles fetching, parsing, and validating standard 4-option questions.
 */
export const mcqPlugin: QuizPlugin<Question, string> = {
  type: 'mcq',

  /**
   * For the initial phase, we mimic the existing logic where data is passed directly from config,
   * but the engine provides an interface if we want it to fetch directly.
   * We will rely on existing config passing for now.
   */
  async loadQuestions(filters?: any): Promise<Question[]> {
    // In the future, the heavy Supabase fetching from QuizConfig can be moved here.
    // For now, this returns an empty array to be populated by the config component.
    return [];
  },

  validateAnswer(question: Question, answer: string): boolean {
    return question.correct === answer;
  },

  getNextQuestionIndex(questions: Question[], currentIndex: number): number {
    // Basic linear progression
    return currentIndex + 1;
  }
};
