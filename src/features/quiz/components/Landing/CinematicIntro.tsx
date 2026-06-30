import React, { useEffect, useState, useRef } from 'react';
import './CinematicIntro.css';

interface CinematicIntroProps {
  onReveal: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onReveal }) => {
  const [phase, setPhase] = useState<'initial' | 'pre-zoom' | 'expanding' | 'vanishing' | 'done'>('initial');
  const hasRunRef = useRef(false);

  useEffect(() => {
    // Prevent the animation from running multiple times due to re-renders or StrictMode
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    // Check if intro was already played this session
    const hasSeenIntro = sessionStorage.getItem('mindflow_intro_seen');

    // If they already saw the intro, jump straight to the content
    if (hasSeenIntro) {
      onReveal();
      setPhase('done');
      return;
    }

    // Mark intro as seen for this session
    sessionStorage.setItem('mindflow_intro_seen', 'true');

    // Phase 1: Let the logo breathe for 2s
    const preZoomTimer = setTimeout(() => {
      setPhase('pre-zoom');

      // Phase 2: Grow the overlay circle from logo center
      // Tiny tick so the browser registers the initial clip-path first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase('expanding');
        });
      });

      // Phase 3: While it's still covering everything, reveal page
      // 1.4 s = duration of the clip-path transition
      const revealTimer = setTimeout(() => {
        onReveal(); // Signal parent to show actual content

        // Phase 4: Fade the gradient overlay out
        setPhase('vanishing');

        // Phase 5: Clean up
        const doneTimer = setTimeout(() => {
          setPhase('done');
        }, 650); // slightly after vanish completes

        return () => clearTimeout(doneTimer);
      }, 1400);

      return () => clearTimeout(revealTimer);
    }, 2000); // initial logo display time

    return () => {
      clearTimeout(preZoomTimer);
    };
  }, [onReveal]);

  if (phase === 'done') return null;

  const isFadeEarly = phase === 'pre-zoom' || phase === 'expanding' || phase === 'vanishing';
  const isExpanding = phase === 'expanding' || phase === 'vanishing';
  const isVanishing = phase === 'vanishing';

  return (
    <>
      {/* ZOOM OVERLAY - pure gradient div, expands via clip-path */}
      <div
        className={`zoom-overlay ${isExpanding ? 'expanding' : ''} ${isVanishing ? 'vanishing' : ''}`}
        style={{ zIndex: 9999 }}
      />

      {/* SPLASH SCREEN */}
      <div
        className={`pwa-splash-screen ${isVanishing ? 'final-vanish' : ''}`}
        style={{ zIndex: 9000 }}
      >
        <div className="mf-orbital-system">
          <div className={`mf-halo-ring ${isFadeEarly ? 'fade-early' : ''}`}></div>
          <div className="mf-core-logo">
            <svg className="mf-brain-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path className="mf-brain-path" d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
              <path className="mf-brain-path" style={{ animationDelay: '0.3s' }} d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
            </svg>
          </div>
        </div>
        <div className={`mf-brand-name ${isFadeEarly ? 'fade-early' : ''}`}>
          MindFlow
        </div>
      </div>
    </>
  );
};
