import { create } from 'zustand';

interface AnalyticsState {
  score: number;
  timeTaken: Record<string, number>;

  // Actions
  answerQuestion: (questionId: string, isCorrect: boolean, wasCorrect: boolean, timeSpent: number, isNewAnswer: boolean) => void;
  logTimeSpent: (questionId: string, timeSpent: number) => void;
  resetAnalytics: () => void;
  loadAnalytics: (score: number, timeTaken: Record<string, number>) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  score: 0,
  timeTaken: {},

  answerQuestion: (questionId, isCorrect, wasCorrect, timeSpent, isNewAnswer) => set((state) => {
    let newScore = state.score;

    if (isNewAnswer) {
      if (isCorrect) newScore++;
    } else {
      // Changing answer
      if (wasCorrect && !isCorrect) newScore--;
      if (!wasCorrect && isCorrect) newScore++;
    }

    const prevTime = state.timeTaken[questionId] || 0;

    return {
      score: newScore,
      timeTaken: { ...state.timeTaken, [questionId]: prevTime + timeSpent }
    };
  }),

  logTimeSpent: (questionId, timeSpent) => set((state) => {
    const prevTime = state.timeTaken[questionId] || 0;
    return {
      timeTaken: { ...state.timeTaken, [questionId]: prevTime + timeSpent }
    };
  }),

  resetAnalytics: () => set({
    score: 0,
    timeTaken: {}
  }),

  loadAnalytics: (score, timeTaken) => set({
    score,
    timeTaken
  })
}));
