import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SynapticLoader } from '../../../components/ui/SynapticLoader';
import { deckService } from '../services/deckService';
import { useDeckSessionStore } from '../stores/useDeckSessionStore';
import { useFlashcardStore } from '../../quiz/stores/useFlashcardStore';
import { VocabType } from '../types';
import { useAuth } from '../../auth';

interface DeckSessionGuardProps {
    vocabType: VocabType;
    children: React.ReactNode;
}

export const DeckSessionGuard: React.FC<DeckSessionGuardProps> = ({ vocabType, children }) => {
    const { deckId } = useParams<{ deckId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const { startSession, isActive, deckId: activeDeckId } = useDeckSessionStore();
    const flashcardStore = useFlashcardStore();

    useEffect(() => {
        const initDeck = async () => {
            if (!deckId || !user) return;
            try {
                // If it's already the active session, just render
                if (isActive && activeDeckId === deckId) {
                    setLoading(false);
                    return;
                }

                // Fetch Deck metadata and words
                const decks = await deckService.getUserDecks(vocabType, user.id);
                const deck = decks.find(d => d.id === deckId);
                if (!deck) {
                    console.error("Deck not found");
                    navigate(`/vocab/${vocabType}/library`);
                    return;
                }

                const words = await deckService.getDeckWords(vocabType, deckId);

                // Initialize the Global Flashcard Store so that components like IdiomSession can get the mode.
                if (vocabType === 'idiom') {
                    flashcardStore.startIdioms(words as any, deck.filters, deck.mode as 'basic' | 'review');
                } else if (vocabType === 'ows') {
                    flashcardStore.startOWS(words as any, deck.filters, deck.mode as 'basic' | 'review');
                } else if (vocabType === 'synonym') {
                    flashcardStore.startSynonyms(words as any, deck.filters);
                }

                // Hydrate the flashcard store with the saved current index from DeckState
                if (deck.state && typeof deck.state.currentQuestionIndex === 'number') {
                    flashcardStore.jumpToCard(deck.state.currentQuestionIndex);
                }

                // Initialize the Session Zustand store
                startSession(vocabType, deckId, words, deck.state);

                setLoading(false);
            } catch (err) {
                console.error("Failed to load deck:", err);
                navigate(`/vocab/${vocabType}/library`);
            }
        };

        initDeck();
    }, [deckId, user, vocabType]);

    if (loading) return <SynapticLoader />;

    return <>{children}</>;
};
