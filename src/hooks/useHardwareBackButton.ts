import { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotificationStore } from '../stores/useNotificationStore';
import { useQuizSessionStore } from '../features/quiz/stores/useQuizSessionStore';

export const useHardwareBackButton = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const lastBackPress = useRef<number>(0);
    const isNavigating = useRef<boolean>(false);

    useEffect(() => {
        const handleBackButton = async () => {
            const currentTime = new Date().getTime();

            // --- 0. DEBOUNCE & LOCK ---
            if (isNavigating.current || currentTime - lastBackPress.current < 300) {
                return; // Ignore spam presses
            }
            isNavigating.current = true;

            try {
                const currentPath = location.pathname;

                // --- 1. KEYBOARD DISMISSAL ---
                if (document.activeElement &&
                    (document.activeElement.tagName === 'INPUT' ||
                     document.activeElement.tagName === 'TEXTAREA' ||
                     (document.activeElement as HTMLElement).isContentEditable)) {
                    (document.activeElement as HTMLElement).blur();
                    return;
                }

                // --- 2. FULLSCREEN EXIT ---
                if (document.fullscreenElement) {
                    await document.exitFullscreen();
                    return;
                }

                // --- 3. MODAL / DRAWER / OVERLAY PRIORITY ---
                const activeOverlays = document.querySelectorAll(
                    '[role="dialog"], .modal, .bottom-sheet, [data-headlessui-state="open"]'
                );
                if (activeOverlays.length > 0) {
                    // Try standard escape key for accessible dialogs
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                    return;
                }

                // --- 4. CRITICAL WORKFLOW PROTECTION (Quiz, etc) ---
                // Wait for syncs to avoid corruption
                const quizStore = useQuizSessionStore.getState();
                if (quizStore.syncStatus === 'syncing') {
                    useNotificationStore.getState().showToast({
                        title: 'Syncing',
                        message: 'Please wait, saving progress...',
                        variant: 'info'
                    });
                    return;
                }

                if (currentPath.startsWith('/quiz/session/')) {
                    if (quizStore.status === 'quiz' && !quizStore.isPaused) {
                        quizStore.pauseQuiz();
                        useNotificationStore.getState().showToast({
                            title: 'Quiz Paused',
                            message: 'Quiz paused. Press back again to exit.',
                            variant: 'info'
                        });
                        return;
                    }
                }

                // --- 5. DASHBOARD SINGLE EXIT ROOT ---
                const exitRoots = ['/', '/dashboard'];

                if (exitRoots.includes(currentPath)) {
                    if (currentTime - lastBackPress.current < 2000) {
                        App.exitApp();
                    } else {
                        lastBackPress.current = currentTime;
                        useNotificationStore.getState().showToast({
                            title: 'Exit App',
                            message: 'Press back again to exit',
                            variant: 'info',
                            duration: 2000
                        });
                    }
                    return;
                }

                // --- 6. DETERMINISTIC HIERARCHICAL MAPPING ---
                let targetPath = '/dashboard'; // Safe fallback for deep links or broken histories

                // Level 1: Main Sections
                if (currentPath.startsWith('/mcqs')) targetPath = '/dashboard';
                else if (currentPath.startsWith('/english')) targetPath = '/dashboard';
                else if (currentPath.startsWith('/community')) targetPath = '/dashboard';
                else if (currentPath.startsWith('/tools')) targetPath = '/dashboard';
                else if (currentPath.startsWith('/ai')) targetPath = '/dashboard';
                else if (currentPath.startsWith('/school')) targetPath = '/dashboard';
                else if (currentPath.startsWith('/admin')) targetPath = '/dashboard';
                else if (currentPath.startsWith('/bookmarks')) targetPath = '/dashboard';
                else if (currentPath.startsWith('/settings')) targetPath = '/dashboard';
                else if (currentPath.startsWith('/profile')) targetPath = '/dashboard';
                else if (currentPath.startsWith('/about')) targetPath = '/dashboard';

                // Level 2: Nested Features
                else if (currentPath.startsWith('/quiz/library') ||
                         currentPath.startsWith('/quiz/create') ||
                         currentPath.startsWith('/quiz/session/') ||
                         currentPath.startsWith('/quiz/results/') ||
                         currentPath.startsWith('/quiz/config')) {
                    targetPath = '/mcqs';
                }
                else if (currentPath.startsWith('/idioms') ||
                         currentPath.startsWith('/synonyms') ||
                         currentPath.startsWith('/ows') ||
                         currentPath.startsWith('/flashcards/')) {
                    targetPath = '/english';
                }

                // Record time for dashboard exit timeout logic and debounce
                lastBackPress.current = currentTime;

                // Navigate hierarchically (replace prevents infinite back stacks)
                navigate(targetPath, { replace: true });

            } finally {
                // Release lock after a short delay
                setTimeout(() => {
                    isNavigating.current = false;
                }, 100);
            }
        };

        const listener = App.addListener('backButton', handleBackButton);

        return () => {
            listener.then(l => l.remove());
        };
    }, [navigate, location.pathname]);
};
