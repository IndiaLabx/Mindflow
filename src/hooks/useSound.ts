import { useMemo, useContext, useEffect } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';

/**
 * Custom hook to play a sound effect.
 *
 * This hook creates an HTMLAudioElement for the given URL and returns a play function.
 * It respects the global sound settings (mute/unmute) from the SettingsContext.
 * It uses node cloning to allow overlapping playback of the same sound (e.g., rapid button clicks).
 *
 * @param {string} url - The URL of the sound file to play.
 * @returns {() => void} A function that plays the sound when called.
 */
export const useSound = (url: string) => {
    const isSoundEnabled = useSettingsStore(state => state.isSoundEnabled);
    
    // Create the audio element only when the URL changes
    const audio = useMemo(() => {
        if (typeof Audio === "undefined") return null;
        const a = new Audio(url);
        a.preload = 'auto';
        return a;
    }, [url]);

    // Preload the audio
    useEffect(() => {
        if (audio) {
            audio.load();
        }
    }, [audio]);
    
    /**
     * Plays the sound effect if sound is enabled globally.
     */
    const play = () => {
        if (isSoundEnabled && audio) {
            // Clone node allows overlapping sounds (fast clicking)
            const soundClone = audio.cloneNode() as HTMLAudioElement;
            soundClone.volume = 0.5; // Default volume to 50%
            soundClone.play().catch(e => {
                // Common error: User hasn't interacted with document yet
                console.warn("Sound play failed (likely autoplay policy):", e);
            });
        }
    };
    
    return play;
};
