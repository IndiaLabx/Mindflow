export interface QuizPlugin<QuestionType, AnswerType> {
  /** The unique identifier for this type of quiz plugin (e.g., 'mcq', 'synonym') */
  type: string;

  /** Resolves the list of questions. Could be from local JSON or a remote API. */
  loadQuestions: (filters?: any) => Promise<QuestionType[]>;

  /** Evaluates if the provided answer is correct for the given question. */
  validateAnswer: (question: QuestionType, answer: AnswerType) => boolean;

  /** Determines the index of the next question. Can be used for adaptive difficulty jumping. */
  getNextQuestionIndex: (questions: QuestionType[], currentIndex: number) => number;

  /** Optional lifecycle hook called when the quiz completes. */
  onQuizComplete?: () => void;
}
