
import { describe, it, expect } from 'vitest';
import { quizReducer, initialState } from './quizReducer';
import { QuizRuntimeState } from '../types/store';

describe('quizReducer', () => {
    it('should handle PAUSE_QUIZ correctly', () => {
        const state: QuizRuntimeState = {
            ...initialState,
            status: 'quiz',
            remainingTimes: { 'q1': 60 }
        };

        const action = {
            type: 'PAUSE_QUIZ' as const,
            payload: { questionId: 'q1', remainingTime: 45 }
        };

        const newState = quizReducer(state, action);

        expect(newState.isPaused).toBe(true);
        expect(newState.remainingTimes['q1']).toBe(45);
    });

    it('should handle PAUSE_QUIZ without payload updates', () => {
        const state: QuizRuntimeState = {
            ...initialState,
            status: 'quiz',
            remainingTimes: { 'q1': 60 }
        };

        const action = {
            type: 'PAUSE_QUIZ' as const,
            payload: {}
        };

        const newState = quizReducer(state, action);

        expect(newState.isPaused).toBe(true);
        expect(newState.remainingTimes['q1']).toBe(60); // Should remain unchanged
    });

    it('should handle RESUME_QUIZ correctly', () => {
        const state: QuizRuntimeState = {
            ...initialState,
            status: 'quiz',
            isPaused: true
        };

        const action = {
            type: 'RESUME_QUIZ' as const
        };

        const newState = quizReducer(state, action);

        expect(newState.isPaused).toBe(false);
    });
});
