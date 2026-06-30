import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedLogo } from './AnimatedLogo';

interface WelcomeIntroProps {
  onComplete: () => void;
}

export const WelcomeIntro: React.FC<WelcomeIntroProps> = ({ onComplete }) => {
  useEffect(() => {
    // Play synthetic welcome sound using AudioContext
    const playWelcomeSound = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();

        // Main synth (chime/pad sound)
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // Add a filter for a "swoosh" effect (like a filter opening up as lines draw)
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';

        // Routing
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        const now = ctx.currentTime;

        // A gentle, warm synth tone
        osc.type = 'sine';

        // Envelope for Volume (smooth slow fade in and out - longer duration)
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.4, now + 1.0); // Slow fade in over 1s
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 4.5); // Slow fade out

        // Envelope for Filter (the "swoosh" opening up over 2.5s to match drawing lines)
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.exponentialRampToValueAtTime(3000, now + 2.5); // Open up the sound

        // Pitch bend effect (futuristic start up)
        osc.frequency.setValueAtTime(220, now); // Start lower
        osc.frequency.exponentialRampToValueAtTime(440, now + 1.5); // Glide up

        osc.start(now);
        osc.stop(now + 5);

        // Add a sparkle / bell layer for magic feel, timed to the synapses appearing
        // The synapses appear starting at delay 1.8s + 0.2s * i
        // So let's start a bright chime at ~2.0s
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(880, now + 2.0); // High pitch (A5)

        gain2.gain.setValueAtTime(0, now);
        gain2.gain.setValueAtTime(0, now + 1.9); // keep silent until 1.9s
        gain2.gain.linearRampToValueAtTime(0.15, now + 2.1); // Quick attack at 2.1s
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 4.0); // Ring out

        osc2.start(now + 2.0);
        osc2.stop(now + 4.5);

      } catch (e) {
        console.warn('AudioContext playback failed', e);
      }
    };

    playWelcomeSound();

    // 5s total display time, giving the animation and sound room to breathe
    const timer = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Animated Background Rays/Glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 dark:opacity-20">
           <motion.div
             className="w-[800px] h-[800px] rounded-full bg-indigo-500/20 blur-[100px]"
             animate={{ scale: [0.8, 1.2, 0.9], opacity: [0, 0.5, 0] }}
             transition={{ duration: 4.5, ease: "easeInOut" }}
           />
        </div>

        <AnimatedLogo className="w-48 h-48 sm:w-64 sm:h-64 z-10" />

        <motion.div
          className="mt-8 z-10 flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1.2 }}
        >
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400 dark:from-indigo-400 dark:to-indigo-300">MindFlow</span>
          </h1>
          <motion.p
             className="text-indigo-600 dark:text-indigo-300 mt-2 font-bold tracking-widest uppercase text-xs sm:text-sm"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 2.0, duration: 1.0 }}
          >
            Igniting Your Curiosity
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
