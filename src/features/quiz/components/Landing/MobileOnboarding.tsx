import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Download, Play, SkipForward } from 'lucide-react';
import founderImage from '../../../../assets/aalok.jpg';

interface MobileOnboardingProps {
  onComplete: () => void;
  onInstallClick?: () => void;
  shouldShowInstallButton?: boolean;
}

// ----------------------------------------------------------------------
// Custom Animated SVG Components for Slides
// ----------------------------------------------------------------------

const BrainNetworkSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="brainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#818CF8" />
        <stop offset="100%" stopColor="#C084FC" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <motion.path
      d="M50 85 C30 85, 15 65, 20 45 C25 25, 40 15, 50 20 C60 15, 75 25, 80 45 C85 65, 70 85, 50 85 Z"
      fill="none"
      stroke="url(#brainGrad)"
      strokeWidth="2"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: [0, 1, 0], opacity: [0, 1, 0] }}
      transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
      filter="url(#glow)"
    />
    {/* Nodes */}
    {[
      { cx: 30, cy: 40 }, { cx: 70, cy: 40 }, { cx: 50, cy: 25 },
      { cx: 25, cy: 60 }, { cx: 75, cy: 60 }, { cx: 50, cy: 75 },
      { cx: 40, cy: 50 }, { cx: 60, cy: 50 }
    ].map((node, i) => (
      <motion.circle
        key={i}
        cx={node.cx}
        cy={node.cy}
        r="3"
        fill="#E0E7FF"
        initial={{ scale: 0.5, opacity: 0.5 }}
        animate={{ scale: [0.5, 1.2, 0.5], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
        filter="url(#glow)"
      />
    ))}
    {/* Connections */}
    <motion.path
      d="M30 40 L50 25 L70 40 L60 50 L75 60 L50 75 L25 60 L40 50 Z M40 50 L60 50 M30 40 L40 50 M70 40 L60 50"
      fill="none"
      stroke="#A5B4FC"
      strokeWidth="1"
      strokeDasharray="4 4"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: [0, 1, 0], opacity: [0, 1, 0] }}
      transition={{ duration: 6, ease: "linear", repeat: Infinity }}
    />
  </svg>
);

const FlashcardsStackSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ perspective: '800px' }}>
    <defs>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#14B8A6" />
      </linearGradient>
    </defs>
    {/* Background Cards */}
    <motion.rect
      x="25" y="20" width="50" height="60" rx="6"
      fill="#A7F3D0" opacity="0.4"
      animate={{ y: [20, 18, 20], rotateZ: [-5, -7, -5] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.rect
      x="25" y="25" width="50" height="60" rx="6"
      fill="#6EE7B7" opacity="0.6"
      animate={{ y: [25, 23, 25], rotateZ: [5, 7, 5] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
    />
    {/* Foreground Card */}
    <motion.g
      animate={{ y: [30, 25, 30], rotateY: [0, 10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: 'center' }}
    >
      <rect x="25" y="30" width="50" height="60" rx="6" fill="url(#cardGrad)" />
      <path d="M40 50 L50 60 L65 40" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </motion.g>
  </svg>
);

const AIChatOrbSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="orbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#F97316" />
      </linearGradient>
    </defs>
    {/* Sound waves / Rings */}
    {[1, 2, 3].map((ring) => (
      <motion.circle
        key={ring}
        cx="50" cy="50" r="20"
        fill="none"
        stroke="#FDE68A"
        strokeWidth="2"
        initial={{ scale: 1, opacity: 0.8 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 2, repeat: Infinity, delay: ring * 0.6, ease: "easeOut" }}
      />
    ))}
    {/* Inner Orb */}
    <motion.circle
      cx="50" cy="50" r="22"
      fill="url(#orbGrad)"
      animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    {/* Dynamic Core */}
    <motion.path
      d="M40 50 Q50 30 60 50 T40 50"
      fill="white"
      opacity="0.8"
      animate={{ d: ["M40 50 Q50 35 60 50 T40 50", "M40 50 Q50 65 60 50 T40 50", "M40 50 Q50 35 60 50 T40 50"] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
  </svg>
);

const RocketTakeoffSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="rocketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F472B6" />
        <stop offset="100%" stopColor="#E11D48" />
      </linearGradient>
    </defs>
    {/* Stars / Particles */}
    {[
      { x: 20, y: 30, r: 1.5 }, { x: 80, y: 20, r: 1 }, { x: 70, y: 50, r: 2 },
      { x: 30, y: 70, r: 1.5 }, { x: 85, y: 80, r: 1 }
    ].map((star, i) => (
      <motion.circle
        key={i} cx={star.x} cy={star.y} r={star.r} fill="#FFF"
        animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1] }}
        transition={{ duration: 1.5 + i * 0.5, repeat: Infinity }}
      />
    ))}
    {/* Rocket Body */}
    <motion.g animate={{ y: [-2, 2, -2] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
      <path d="M50 20 C60 35, 65 55, 60 70 L40 70 C35 55, 40 35, 50 20 Z" fill="url(#rocketGrad)" />
      {/* Window */}
      <circle cx="50" cy="45" r="5" fill="#FFF" opacity="0.9" />
      <circle cx="50" cy="45" r="3" fill="#BE185D" opacity="0.5" />
      {/* Fins */}
      <path d="M40 60 L30 75 L40 70 Z" fill="#BE185D" />
      <path d="M60 60 L70 75 L60 70 Z" fill="#BE185D" />
      {/* Flame */}
      <motion.path
        d="M45 70 Q50 90 55 70 Z"
        fill="#FBBF24"
        animate={{ d: ["M45 70 Q50 90 55 70 Z", "M45 70 Q50 100 55 70 Z", "M45 70 Q50 90 55 70 Z"] }}
        transition={{ duration: 0.3, repeat: Infinity }}
      />
    </motion.g>
  </svg>
);


// ----------------------------------------------------------------------
// Constants & Configuration
// ----------------------------------------------------------------------

const slideVariants = {
  enter: (direction: number) => ({
    x: direction === 0 ? 0 : (direction > 0 ? '100%' : '-100%'),
    opacity: 0,
    scale: 0.9,
    rotateY: direction === 0 ? 0 : (direction > 0 ? 15 : -15)
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
    rotateY: 0
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.9,
    rotateY: direction < 0 ? 15 : -15
  })
};

const textRevealVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1 + 0.2, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as any }
  })
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

// Vibrate utility for tactile feedback
const triggerHaptic = (pattern: number | number[] = 15) => {
  if (typeof window !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore
    }
  }
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export const MobileOnboarding: React.FC<MobileOnboardingProps> = ({
  onComplete,
  onInstallClick,
  shouldShowInstallButton
}) => {
  const [[page, direction], setPage] = useState([0, 0]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [ripple, setRipple] = useState<{x: number, y: number, id: number} | null>(null);

  // Background transition colors depending on slide
  const bgGradients = [
    'from-indigo-100 via-purple-50 to-white dark:from-indigo-950 dark:via-slate-900 dark:to-slate-950', // Brain
    'from-emerald-100 via-teal-50 to-white dark:from-emerald-950 dark:via-slate-900 dark:to-slate-950',   // Flashcards
    'from-amber-100 via-orange-50 to-white dark:from-amber-950 dark:via-slate-900 dark:to-slate-950',     // AI
    'from-pink-100 via-rose-50 to-white dark:from-pink-950 dark:via-slate-900 dark:to-slate-950'          // Ready
  ];

  const slides = [
    {
      id: 'welcome',
      SvgComponent: BrainNetworkSVG,
      title: 'Welcome to MindFlow',
      subtitle: 'Your intelligent knowledge engine.',
      description: 'Master complex topics effortlessly with our adaptive learning tools designed just for you.',
      glowColor: 'bg-indigo-500/20 dark:bg-indigo-500/10',
      isFinal: false
    },
    {
      id: 'flashcards',
      SvgComponent: FlashcardsStackSVG,
      title: 'Smart Flashcards',
      subtitle: 'Learn Vocab & Synonyms.',
      description: 'Swipe through interactive flashcards. Track your mastery from New to Mastered with our smart spaced repetition.',
      glowColor: 'bg-emerald-500/20 dark:bg-emerald-500/10',
      isFinal: false
    },
    {
      id: 'ai',
      SvgComponent: AIChatOrbSVG,
      title: 'AI Chat & Live Talk',
      subtitle: 'Ask anything, anytime.',
      description: 'Have real-time voice conversations or deep text chats with our advanced AI to clarify your doubts instantly.',
      glowColor: 'bg-amber-500/20 dark:bg-amber-500/10',
      isFinal: false
    },
    {
      id: 'final',
      SvgComponent: RocketTakeoffSVG,
      title: 'Ready to Explore?',
      subtitle: 'Take quizzes & export PDFs.',
      description: 'Customizable GK quizzes, offline PWA support, and so much more.',
      glowColor: 'bg-pink-500/20 dark:bg-pink-500/10',
      isFinal: true
    }
  ];

  const paginate = (newDirection: number) => {
    const nextIndex = page + newDirection;
    if (nextIndex >= 0 && nextIndex < slides.length) {
      triggerHaptic();
      setPage([nextIndex, newDirection]);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && page < slides.length - 1) {
      paginate(1);
    } else if (isRightSwipe && page > 0) {
      paginate(-1);
    }
    setTouchStart(null);
  };

  const currentSlide = slides[page];

  // Fluid Mesh Gradient Background Style (CSS-based animation for performance)
  useEffect(() => {
     // Injecting simple keyframes for mesh gradient moving if not exists
     if (!document.getElementById('mesh-keyframes')) {
       const style = document.createElement('style');
       style.id = 'mesh-keyframes';
       style.innerHTML = `
         @keyframes flow {
           0% { background-position: 0% 50%; }
           50% { background-position: 100% 50%; }
           100% { background-position: 0% 50%; }
         }
         .animate-flow {
           background-size: 200% 200%;
           animation: flow 15s ease infinite;
         }
       `;
       document.head.appendChild(style);
     }
  }, []);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] overflow-hidden font-sans transition-colors duration-700 bg-gradient-to-br animate-flow ${bgGradients[page]}`}>

      {/* Premium Glass Header Actions */}
      <motion.div
        className="flex justify-between items-center px-6 py-4 z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >


        {page < slides.length - 1 && (
          <button
            onClick={() => { triggerHaptic(); onComplete(); }}
            className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-bold text-slate-700 dark:text-slate-300 bg-white/30 dark:bg-black/20 backdrop-blur-md border border-white/40 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/10 transition-all active:scale-95"
          >
            Skip <SkipForward className="w-4 h-4 ml-1" />
          </button>
        )}
      </motion.div>

      {/* Main Slide Content Area (Parallax enabled via Framer Motion) */}
      <div
        className="flex-1 relative flex items-center justify-center px-4 md:px-8 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ perspective: '1000px' }} // Enhances 3D feel during swipe
      >
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.3 },
              rotateY: { type: "spring", stiffness: 200, damping: 30 }
            }}
            className="absolute inset-0 flex flex-col items-center justify-center w-full"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.8} // Very snappy elastic feel
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold && page < slides.length - 1) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold && page > 0) {
                paginate(-1);
              }
            }}
          >
            {/* Glassmorphic Card Container */}
            <motion.div
              className="w-full max-w-[340px] flex flex-col items-center p-8 rounded-[40px] bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] relative overflow-hidden"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {/* Internal subtle glow matching the slide theme */}
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[200%] rounded-full blur-[80px] -z-10 ${currentSlide.glowColor}`}></div>

              {/* Animated SVG Graphic */}
              <motion.div
                className="w-40 h-40 mb-8 relative z-10"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.6, type: "spring" }}
              >
                <currentSlide.SvgComponent />
              </motion.div>

              {/* Staggered Text Reveal */}
              <div className="text-center z-10 w-full">
                <motion.h2
                  custom={0} variants={textRevealVariants} initial="hidden" animate="visible"
                  className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2 leading-tight"
                >
                  {currentSlide.title}
                </motion.h2>
                <motion.p
                  custom={1} variants={textRevealVariants} initial="hidden" animate="visible"
                  className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-500 dark:from-slate-200 dark:to-slate-400 mb-4"
                >
                  {currentSlide.subtitle}
                </motion.p>
                <motion.p
                  custom={2} variants={textRevealVariants} initial="hidden" animate="visible"
                  className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium"
                >
                  {currentSlide.description}
                </motion.p>
              </div>

              {/* Special Final Slide Additions */}
              {currentSlide.isFinal && (
                <motion.div
                  className="mt-8 flex flex-col w-full gap-4 items-center z-10"
                  custom={3} variants={textRevealVariants} initial="hidden" animate="visible"
                >
                  {shouldShowInstallButton && (
                    <button
                      onClick={() => { triggerHaptic(); onInstallClick?.(); }}
                      className="flex w-full items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/50 dark:bg-black/30 backdrop-blur-md text-slate-800 dark:text-slate-200 font-bold text-sm border border-white/50 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/20 transition-all active:scale-95 shadow-sm"
                    >
                      <Download className="w-4 h-4" /> Install App
                    </button>
                  )}

                  {/* Premium "Created By" Badge */}
                  <motion.div
                    className="relative p-[2px] rounded-2xl w-full group cursor-pointer"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => triggerHaptic([10, 30, 10])}
                  >
                    {/* Animated Aura Glow */}
                    <div className="absolute inset-0 rounded-2xl bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] animate-[spin_3s_linear_infinite] opacity-50 dark:opacity-20 pointer-events-none" />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-md group-hover:opacity-40 transition-opacity duration-300" />

                    <div className="relative flex items-center gap-3 bg-white/60 dark:bg-slate-900/80 backdrop-blur-xl p-3 pr-4 rounded-2xl border border-white/50 dark:border-white/10 shadow-sm w-full text-left">
                      <img src={founderImage} alt="Founder" className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-slate-700 shadow-md" />
                      <div className="flex-1">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-0.5 flex items-center gap-1">
                          Created By <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                        </div>
                        <div className="text-sm font-black text-slate-900 dark:text-white leading-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                          Aalok Kumar Sharma
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="px-6 pb-10 pt-4 flex-shrink-0 z-20 flex flex-col items-center gap-6">
        {/* Relocated Slide Indicator */}
        <div className="flex gap-2 p-2 rounded-full bg-white/30 dark:bg-black/20 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-sm">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${i === page ? 'w-6 bg-slate-800 dark:bg-white' : 'w-2 bg-slate-400/50 dark:bg-slate-600/50'}`}
            />
          ))}
        </div>
        {page === slides.length - 1 ? (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            onClick={() => { triggerHaptic([20, 40, 20]); onComplete(); }}
            className="w-full relative group overflow-hidden rounded-[24px] p-[2px] focus:outline-none transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-[0_0_40px_-10px_rgba(236,72,153,0.5)]"
          >
             {/* Sweeping Shimmer Background Effect */}
             <span className="absolute inset-0 bg-[linear-gradient(110deg,#ec4899,45%,#8b5cf6,55%,#ec4899)] bg-[length:200%_100%] animate-[shimmer_2s_infinite] opacity-80" />

             <span className="relative flex items-center justify-center gap-3 h-full w-full rounded-[22px] bg-slate-900 dark:bg-black px-8 py-4 text-lg font-black text-white transition-all duration-300">
                <span className="flex items-center tracking-wide">
                  Get Started
                </span>
                <Play className="w-5 h-5 fill-current" />
             </span>

          </motion.button>
        ) : (

          <motion.button
            key="continue-btn"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              boxShadow: ['0px 0px 0px rgba(255,255,255,0)', '0px 0px 15px rgba(255,255,255,0.3)', '0px 0px 0px rgba(255,255,255,0)']
            }}
            transition={{
              opacity: { duration: 0.3 },
              y: { duration: 0.3 },
              boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            exit={{ opacity: 0, y: 20 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              setRipple({ x, y, id: Date.now() });
              triggerHaptic([10, 20]);
              setTimeout(() => paginate(1), 150);
            }}
            className="w-full relative overflow-hidden py-4 rounded-[24px] text-lg font-bold flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-xl border border-white/10 group"
          >
            {/* Shimmer Effect */}
            <span className="absolute inset-0 bg-[linear-gradient(110deg,transparent,20%,rgba(255,255,255,0.1),80%,transparent)] dark:bg-[linear-gradient(110deg,transparent,20%,rgba(0,0,0,0.05),80%,transparent)] bg-[length:200%_100%] animate-[shimmer_2s_infinite] pointer-events-none" />

            {/* Ripple Effect */}
            <AnimatePresence>
              {ripple && (
                <motion.span
                  key={ripple.id}
                  initial={{ top: ripple.y, left: ripple.x, scale: 0, opacity: 0.5 }}
                  animate={{ scale: 4, opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute w-20 h-20 bg-white/30 dark:bg-black/20 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
                  onAnimationComplete={() => setRipple(null)}
                />
              )}
            </AnimatePresence>

            <span className="relative z-10 flex items-center gap-2">
              Continue
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronRight className="w-5 h-5" />
              </motion.span>
            </span>
          </motion.button>

        )}
      <style dangerouslySetInnerHTML={{__html: `
               @keyframes shimmer {
                 0% { background-position: 200% 0; }
                 100% { background-position: -200% 0; }
               }
             `}} />
      </div>
    </div>
  );
};
