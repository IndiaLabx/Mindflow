import { useCallback } from 'react';
import { useMockTimer } from '../hooks/useMockTimer';
import { useAntiCheat } from '../hooks/useAntiCheat';

interface ControllerConfig {
    sessionId: string;
    totalQuestions: number;
    totalTime: number;
    state: any; // Using any for reducer state to avoid circular dependency
    dispatch: any; // Using any for reducer dispatch
    onFinish: () => void;
    enableAntiCheat?: boolean;
}

/**
 * Enterprise Test Engine Controller
 * Wraps the complex business logic (Web Worker Timers, Offline Sync, Anti-Cheat, Navigation)
 * keeping the UI components clean and decoupled.
 */
export function useTestEngineController({
    sessionId,
    totalQuestions,
    totalTime,
    state,
    dispatch,
    onFinish,
    enableAntiCheat = true
}: ControllerConfig) {

    // 1. Initialize Web Worker Timer
    const { timeLeft, formatTime } = useMockTimer({
        totalTime,
        onTimeUp: () => submitTest()
    });

    // 2. Initialize Offline Auto-Save (IndexedDB)

    // 3. Initialize Anti-Cheat System
    const { violations } = useAntiCheat({
        isEnabled: enableAntiCheat,
        onViolation: (count) => {
            console.warn(`Anti-Cheat Violation detected! Count: ${count}`);
            // You can dispatch a warning toast or state update here
        },
        onMaxViolationsReached: () => {
            alert("Maximum tab switching violations reached. Your test will be auto-submitted.");
            submitTest();
        }
    });

    // 4. Core Navigation Logic
    const handleNext = useCallback(() => {
        if (state.currentIndex < totalQuestions - 1) {
            dispatch({ type: 'NEXT_QUESTION' });
        }
    }, [state.currentIndex, totalQuestions, dispatch]);

    const handlePrev = useCallback(() => {
        if (state.currentIndex > 0) {
            dispatch({ type: 'PREV_QUESTION' });
        }
    }, [state.currentIndex, dispatch]);

    const handleJump = useCallback((index: number) => {
        dispatch({ type: 'JUMP_TO_QUESTION', payload: index });
    }, [dispatch]);

    const handleAnswer = useCallback((optionId: string) => {
        dispatch({ type: 'ANSWER_QUESTION', payload: optionId });
    }, [dispatch]);

    const handleClearResponse = useCallback(() => {
        dispatch({ type: 'CLEAR_ANSWER' });
    }, [dispatch]);

    // 5. Submit Flow
    const submitTest = useCallback(async () => {
        // Clear offline saved session as we are submitting

        onFinish();
    }, [onFinish]);

    return {
        timer: { timeLeft, formatTime },
        navigation: {
            handleNext,
            handlePrev,
            handleJump,
            handleAnswer,
            handleClearResponse
        },
        submitTest,
        violations
    };
}
