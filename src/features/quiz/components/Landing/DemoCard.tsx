import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, MousePointer2 } from 'lucide-react';
import { useMediaQuery } from '../../../../hooks/useMediaQuery';

/**
 * Stages of the demo animation lifecycle.
 */
type DemoPhase = 'START' | 'CLICK_START' | 'LOADING' | 'QUESTION' | 'SELECT_OPTION' | 'CLICK_SUBMIT' | 'RESULT';

/**
 * Rotating content configuration for the demo card.
 * Includes category, question, options, and color themes.
 */
const DEMO_CONTENT = [
  {
    category: "React",
    question: "What is the primary function of React hooks?",
    // First option is assumed correct for animation simplicity
    options: ["Manage state and side effects", "To style components", "To fetch database records"],
    theme: {
      badge: "bg-indigo-100/50 text-indigo-700 border-indigo-200/30",
      progress: "bg-indigo-500",
      selectedBg: "bg-indigo-600/10",
      selectedBorder: "border-indigo-500/30",
      dot: "bg-indigo-600",
      borderDot: "border-indigo-600",
      startIconBg: "bg-indigo-100",
      startIconText: "text-indigo-600"
    }
  },
  {
    category: "History",
    question: "Who painted the Mona Lisa?",
    options: ["Leonardo da Vinci", "Vincent van Gogh", "Pablo Picasso"],
    theme: {
      badge: "bg-amber-100/50 text-amber-700 border-amber-200/30",
      progress: "bg-amber-500",
      selectedBg: "bg-amber-600/10",
      selectedBorder: "border-amber-500/30",
      dot: "bg-amber-600",
      borderDot: "border-amber-600",
      startIconBg: "bg-amber-100",
      startIconText: "text-amber-600"
    }
  },
  {
    category: "Science",
    question: "Powerhouse of the cell?",
    options: ["Mitochondria", "Nucleus", "Ribosome"],
    theme: {
      badge: "bg-emerald-100/50 text-emerald-700 border-emerald-200/30",
      progress: "bg-emerald-500",
      selectedBg: "bg-emerald-600/10",
      selectedBorder: "border-emerald-500/30",
      dot: "bg-emerald-600",
      borderDot: "border-emerald-600",
      startIconBg: "bg-emerald-100",
      startIconText: "text-emerald-600"
    }
  }
];

/**
 * A highly interactive, self-playing demo card for the Landing Page.
 *
 * Features:
 * - Rotates through different quiz topics (React, History, Science).
 * - Simulates user interaction (mouse movement, clicks, selection).
 * - Adapts to reduced motion preferences and mobile devices (disables animation).
 * - Uses 3D CSS transforms for a "floating" effect.
 *
 * @returns {JSX.Element} The rendered DemoCard component.
 */
export const DemoCard: React.FC = () => {
  const [phase, setPhase] = useState<DemoPhase>('START');
  // Cursor position percentage {x, y} relative to container
  const [cursor, setCursor] = useState({ x: 85, y: 85 });
  const [isClicking, setIsClicking] = useState(false);
  const [topicIndex, setTopicIndex] = useState(0); // Tracks current topic
  
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const isMobile = useMediaQuery('(max-width: 768px)');
  const currentContent = DEMO_CONTENT[topicIndex];

  // Disable heavy animations on mobile or reduced motion preference for accessibility/performance
  const shouldAnimate = !prefersReducedMotion && !isMobile;

  useEffect(() => {
    // If user prefers reduced motion or is on mobile, do not run the cursor simulation loop
    if (!shouldAnimate) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const runSimulation = () => {
      // 0s: Start Phase
      setPhase('START');
      setCursor({ x: 80, y: 80 });

      // 0.5s: Move cursor to Start Button
      timeoutId = setTimeout(() => {
        setCursor({ x: 50, y: 65 });
      }, 500);

      // 1.2s: Click Start
      timeoutId = setTimeout(() => {
        setIsClicking(true);
        setPhase('CLICK_START');
      }, 1200);

      // 1.4s: Release Click & Loading
      timeoutId = setTimeout(() => {
        setIsClicking(false);
        setPhase('LOADING');
      }, 1400);

      // 2.4s: Show Question
      timeoutId = setTimeout(() => {
        setPhase('QUESTION');
        setCursor({ x: 90, y: 80 }); // Move cursor away slightly
      }, 2400);

      // 3.0s: Move Cursor to Option 1
      timeoutId = setTimeout(() => {
        setCursor({ x: 50, y: 42 }); // Coordinates for first option
      }, 3000);

      // 3.6s: Select Option (Click)
      timeoutId = setTimeout(() => {
        setIsClicking(true);
      }, 3600);

      // 3.7s: Selected State
      timeoutId = setTimeout(() => {
        setIsClicking(false);
        setPhase('SELECT_OPTION');
      }, 3700);

      // 4.2s: Move Cursor to Next/Submit
      timeoutId = setTimeout(() => {
        setCursor({ x: 85, y: 85 }); // Coordinates for bottom right button
      }, 4200);

      // 4.8s: Click Submit
      timeoutId = setTimeout(() => {
        setIsClicking(true);
        setPhase('CLICK_SUBMIT');
      }, 4800);

      // 5.0s: Show Result
      timeoutId = setTimeout(() => {
        setIsClicking(false);
        setPhase('RESULT');
      }, 5000);

      // 8.0s: Reset Loop AND Switch Topic
      timeoutId = setTimeout(() => {
        setTopicIndex((prev) => (prev + 1) % DEMO_CONTENT.length);
        runSimulation();
      }, 8000);
    };

    runSimulation();

    return () => clearTimeout(timeoutId);
  }, [shouldAnimate]);

  // Calculate dynamic glare position based on cursor
  // Moves opposite to the cursor to simulate light reflection on tilt
  const glareX = 100 - cursor.x;
  const glareY = 100 - cursor.y;

  return (
    <div 
      className="relative p-[1px] rounded-[2rem] bg-gradient-to-br from-white/80 via-white/20 to-transparent shadow-[0_10px_30px_-10px_rgba(67,56,202,0.1)] md:shadow-[0_30px_60px_-15px_rgba(67,56,202,0.15)] animate-float motion-reduce:animate-none transform-gpu transition-all duration-500 hover:rotate-0 z-20 w-full aspect-[4/3.2] md:aspect-[4/3]"
      style={{ 
        transform: shouldAnimate ? 'rotateY(-10deg) rotateX(5deg)' : 'none', 
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Inner Content Container with Glass Background */}
      <div className="relative w-full h-full bg-white dark:bg-gray-800/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 overflow-hidden flex flex-col border border-white/20 dark:border-slate-800/50">
        
        {/* Glossy Shine Effect (Static Base) */}
        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-white/40 to-transparent pointer-events-none z-0" />

        {/* Dynamic Glare Layer - Desktop Only */}
        {shouldAnimate && (
          <div 
            className="absolute inset-0 rounded-[2rem] pointer-events-none z-0 transition-all duration-700 ease-out opacity-50"
            style={{
              background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 50%)`,
              mixBlendMode: 'overlay'
            }}
          />
        )}

        {/* Header UI (Always Visible) */}
        <div className="relative z-10 flex items-center justify-between mb-6 md:mb-8 opacity-90">
          <div className="flex gap-2.5">
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-rose-400/80 shadow-sm"></div>
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-amber-400/80 shadow-sm"></div>
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-400/80 shadow-sm"></div>
          </div>
          <div className={`px-2.5 py-0.5 md:px-3 md:py-1 rounded-lg text-[10px] font-bold border flex items-center gap-2 transition-colors duration-300 ${currentContent.theme.badge} dark:bg-opacity-20`}>
            {phase === 'RESULT' ? 'COMPLETE' : currentContent.category.toUpperCase()}
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          
          {/* 1. Start View */}
          {(phase === 'START' || phase === 'CLICK_START') && (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-300 ${currentContent.theme.startIconBg} dark:bg-opacity-20 ${currentContent.theme.startIconText}`}>
                <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Ready to Learn?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Topic: {currentContent.category}</p>
              <button className={`
                  bg-slate-900 dark:bg-indigo-600 text-white px-5 py-2 md:px-6 md:py-2 rounded-xl text-xs md:text-sm font-semibold shadow-lg transition-transform duration-100
                  ${phase === 'CLICK_START' ? 'scale-95' : 'scale-100'}
              `}>
                Start Gk Quiz
              </button>
            </div>
          )}

          {/* 2. Loading View */}
          {phase === 'LOADING' && (
            <div className="space-y-4 animate-pulse w-full">
              <div className="h-5 md:h-6 w-3/4 bg-slate-400/20 rounded-lg" />
              <div className="h-3 md:h-4 w-1/2 bg-slate-400/10 rounded-lg mb-6 md:mb-8" />
              <div className="space-y-2.5 md:space-y-3">
                <div className="h-9 md:h-10 w-full bg-white dark:bg-gray-800/50 rounded-xl border border-white/60" />
                <div className="h-9 md:h-10 w-full bg-white dark:bg-gray-800/50 rounded-xl border border-white/60" />
                <div className="h-9 md:h-10 w-full bg-white dark:bg-gray-800/50 rounded-xl border border-white/60" />
              </div>
            </div>
          )}

          {/* 3. Question & Select View */}
          {(phase === 'QUESTION' || phase === 'SELECT_OPTION' || phase === 'CLICK_SUBMIT') && (
            <div className="animate-fade-in w-full flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full w-1/3 transition-colors duration-300 ${currentContent.theme.progress}`}></div>
                </div>
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-4 leading-tight">
                {currentContent.question}
              </h4>
              
              <div className="space-y-2.5 flex-1">
                {/* Option 1 (The Correct One) */}
                <div className={`
                  p-3 rounded-xl border flex items-center gap-3 transition-all duration-300
                  ${(phase === 'SELECT_OPTION' || phase === 'CLICK_SUBMIT') 
                      ? `${currentContent.theme.selectedBg} ${currentContent.theme.selectedBorder} shadow-sm` 
                      : 'bg-white dark:bg-gray-800/40 dark:bg-slate-800/40 border-white/60 dark:border-slate-700/50'}
                `}>
                  <div className={`
                    w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-300
                    ${(phase === 'SELECT_OPTION' || phase === 'CLICK_SUBMIT') ? currentContent.theme.borderDot : 'border-slate-300 dark:border-slate-600'}
                  `}>
                    {(phase === 'SELECT_OPTION' || phase === 'CLICK_SUBMIT') && <div className={`w-2 md:w-2.5 h-2 md:h-2.5 rounded-full ${currentContent.theme.dot}`} />}
                  </div>
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{currentContent.options[0]}</div>
                </div>

                {/* Option 2 */}
                <div className="p-3 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white dark:bg-gray-800/40 dark:bg-slate-800/40 flex items-center gap-3 opacity-60">
                  <div className="w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400">{currentContent.options[1]}</div>
                </div>

                {/* Option 3 */}
                <div className="p-3 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white dark:bg-gray-800/40 dark:bg-slate-800/40 flex items-center gap-3 opacity-60">
                  <div className="w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400">{currentContent.options[2]}</div>
                </div>
              </div>

              {/* Next Button */}
              <div className="mt-auto pt-2 flex justify-end">
                <div className={`
                  bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-bold px-4 py-2 rounded-lg transition-transform duration-100
                  ${phase === 'CLICK_SUBMIT' ? 'scale-90' : 'scale-100'}
                `}>
                  Next
                </div>
              </div>
            </div>
          )}

          {/* 4. Result View */}
          {phase === 'RESULT' && (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-3 animate-bounce">
                <Trophy className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <div className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">Correct!</div>
              <p className="text-xs text-slate-500">You nailed {currentContent.category}.</p>
              <div className="mt-4 flex gap-1">
                {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />)}
              </div>
            </div>
          )}

        </div>

        {/* Simulated Cursor - Hidden on reduced motion or mobile */}
        {shouldAnimate && (
          <div 
            className="absolute pointer-events-none z-50 transition-all duration-500 drop-shadow-lg"
            style={{ 
              left: `${cursor.x}%`, 
              top: `${cursor.y}%`,
              transform: isClicking ? 'scale(0.8)' : 'scale(1)',
              transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)'
            }}
          >
            <MousePointer2 className="w-6 h-6 text-slate-900 fill-white" />
          </div>
        )}

      </div>
    </div>
  );
};
