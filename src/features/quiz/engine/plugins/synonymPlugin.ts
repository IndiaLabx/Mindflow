import { QuizPlugin } from '../quizPlugin';
import { SynonymWord } from '../../types';
import { fetchAllSynonyms } from '../../../vocab/synonyms/services/synonymService';

export const synonymPlugin: QuizPlugin<SynonymWord, string> = {
  type: 'synonym',

  async loadQuestions(): Promise<SynonymWord[]> {
    try {
      return await fetchAllSynonyms();
    } catch (e) {
      console.error("Failed to load synonym plugin data", e);
      return [];
    }
  },

  validateAnswer(question: SynonymWord, answer: string): boolean {
    if (!question.synonyms) return false;
    return question.synonyms.some(s => s.text.toLowerCase() === answer.toLowerCase());
  },

  getNextQuestionIndex(questions: SynonymWord[], currentIndex: number): number {
    return currentIndex + 1;
  }
};
