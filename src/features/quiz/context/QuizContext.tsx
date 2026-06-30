import React, { createContext, useContext } from 'react';
import { useQuiz } from '../hooks/useQuiz';

// Infer the return type of useQuiz
type QuizContextType = ReturnType<typeof useQuiz>;

const QuizContext = createContext<QuizContextType | null>(null);

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const quiz = useQuiz();
    return <QuizContext.Provider value={quiz}>{children}</QuizContext.Provider>;
};

export const useQuizContext = () => {
    const context = useContext(QuizContext);
    if (!context) {
        throw new Error('useQuizContext must be used within a QuizProvider');
    }
    return context;
};
