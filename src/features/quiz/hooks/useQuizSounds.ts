import { useCallback, useContext, useRef, useEffect } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';

/**
 * Custom hook to generate synthesized sound effects for quiz interactions.
 *
 * Instead of loading external audio files, this hook uses the Web Audio API to
 * generate sounds procedurally (Correct, Wrong, Tick). This reduces network requests
 * and allows for dynamic sound manipulation.
 *
 * @returns {object} An object containing the play functions:
 * - `playCorrect` {() => void}: Plays a cheerful "ding" sound.
 * - `playWrong` {() => void}: Plays a harsh "buzzer" sound.
 * - `playTick` {() => void}: Plays a sharp "tick" sound (useful for timers).
 */
export const useQuizSounds = () => {
  const isSoundEnabled = useSettingsStore(state => state.isSoundEnabled);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext lazily to comply with browser autoplay policies
  const getContext = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        audioCtxRef.current = new AudioContext();
      }
    }
    // Resume context if suspended (common browser policy requirement)
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  /**
   * Plays the "Correct Answer" sound (Sine wave sweep up).
   */
  const playCorrect = useCallback(() => {
    if (!isSoundEnabled) return;
    const ctx = getContext();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Start at 800Hz, ramp up to 1200Hz for a "cheerful" lift
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

    // Fade out smoothly
    gain.gain.setValueAtTime(0.1, ctx.currentTime); // Moderate volume
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }, [isSoundEnabled]);

  /**
   * Plays the "Wrong Answer" sound (Sawtooth wave sweep down).
   */
  const playWrong = useCallback(() => {
    if (!isSoundEnabled) return;
    const ctx = getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth'; // Harsh sound
    // Start low (150Hz) and drop to 50Hz (sad trombone effect)
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }, [isSoundEnabled]);

  /**
   * Plays the "Tick" sound (Square wave chirp).
   */
  const playTick = useCallback(() => {
    if (!isSoundEnabled) return;
    const ctx = getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Square wave gives a crisp "digital" click
    osc.type = 'square'; 
    
    // High pitch (1000Hz) for a sharp click
    osc.frequency.setValueAtTime(1000, ctx.currentTime);

    // Very short duration (0.05s)
    gain.gain.setValueAtTime(0.05, ctx.currentTime); // Quiet tick
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }, [isSoundEnabled]);

  return { playCorrect, playWrong, playTick };
};
