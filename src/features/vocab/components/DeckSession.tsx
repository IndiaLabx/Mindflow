import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeckSessionStore } from '../stores/useDeckSessionStore';
import { deckService } from '../services/deckService';
import { OWSSession } from '../ows/components/OWSSession';
import { IdiomSession } from '../idioms/components/IdiomSession';
import { SynonymFlashcardSession } from '../synonyms/components/SynonymFlashcardSession';

export const DeckSession: React.FC = () => {
    const { isActive, vocabType, words, state, nextCard, previousCard, deckId, recordAnswer } = useDeckSessionStore();
    const navigate = useNavigate();

    // Auto-save progress periodically
    useEffect(() => {
        const interval = setInterval(async () => {
            if (isActive && deckId && vocabType) {
                 await deckService.updateDeckState(vocabType, deckId, state, 'paused');
            }
        }, 10000); // every 10s
        return () => clearInterval(interval);
    }, [isActive, deckId, vocabType, state]);

    const handleExit = async () => {
        if (deckId && vocabType) {
            await deckService.updateDeckState(vocabType, deckId, state, 'paused');
            navigate(`/vocab/${vocabType}/library`);
        }
    };

    const handleFinish = async () => {
        if (deckId && vocabType) {
             // Mark as completed
             await deckService.updateDeckState(vocabType, deckId, state, 'completed');
             // Navigate to results
             navigate(`/vocab/${vocabType}/result/${deckId}`);
        }
    };

    // We intercept the onNext/onPrev from internal sessions to track state.
    // However, the underlying Session components have their own internal state (useFlashcardStore).
    // To cleanly separate them without rewriting the components entirely, we can pass our own wrapper functions or use a specific implementation.

    // Actually, `OWSSession` etc rely entirely on `data` prop and some callbacks!

    const handleNext = () => {
        nextCard();
    };

    const handlePrev = () => {
        previousCard();
    };

    const handleJump = (index: number) => {
        // Implement jump if needed, or map it.
    };

    if (!isActive || !vocabType) return null;

    if (vocabType === 'ows') {
        return <OWSSession
            data={words}
            currentIndex={state.currentQuestionIndex}
            onNext={handleNext}
            onPrev={handlePrev}
            onExit={handleExit}
            onFinish={handleFinish}
            filters={{} as any}
            onJump={handleJump}
            onSwipe={recordAnswer}
        />;
    }

    if (vocabType === 'idiom') {
        return <IdiomSession
            data={words}
            currentIndex={state.currentQuestionIndex}
            onNext={handleNext}
            onPrev={handlePrev}
            onExit={handleExit}
            onFinish={handleFinish}
            filters={{} as any}
            onJump={handleJump}
            onSwipe={recordAnswer}
        />;
    }

    if (vocabType === 'synonym') {
        return <SynonymFlashcardSession
            data={words}
            currentIndex={state.currentQuestionIndex}
            onNext={handleNext}
            onPrev={handlePrev}
            onExit={handleExit}
            onFinish={handleFinish}
            filters={{} as any}
            onJump={handleJump}
            onSwipe={recordAnswer}
        />;
    }

    return null;
};
