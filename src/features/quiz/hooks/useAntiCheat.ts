import { useEffect, useRef, useState } from 'react';

interface UseAntiCheatProps {
  isEnabled: boolean;
  maxViolations?: number;
  onViolation: (violationCount: number) => void;
  onMaxViolationsReached: () => void;
}

/**
 * Enterprise Level Anti-Cheating System Hook
 * Detects tab switching and blur events.
 */
export function useAntiCheat({
    isEnabled,
    maxViolations = 3,
    onViolation,
    onMaxViolationsReached
}: UseAntiCheatProps) {

    const [violations, setViolations] = useState(0);
    const violationsRef = useRef(0);

    useEffect(() => {
        if (!isEnabled) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                triggerViolation();
            }
        };

        const handleWindowBlur = () => {
             triggerViolation();
        };

        const triggerViolation = () => {
            const newCount = violationsRef.current + 1;
            violationsRef.current = newCount;
            setViolations(newCount);

            onViolation(newCount);

            if (newCount >= maxViolations) {
                onMaxViolationsReached();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, [isEnabled, maxViolations, onViolation, onMaxViolationsReached]);

    return { violations };
}
