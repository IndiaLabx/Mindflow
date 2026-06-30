import React from 'react';
import { motion } from 'framer-motion';

// 1. Daily Challenge (Sky)
export const DailyChallengeSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
    </defs>
    {/* Target Rings */}
    {[
      { r: 40, op: 0.2 },
      { r: 30, op: 0.4 },
      { r: 20, op: 0.6 }
    ].map((ring, i) => (
      <motion.circle
        key={i} cx="50" cy="50" r={ring.r} fill="none" stroke="#7DD3FC" strokeWidth="4" opacity={ring.op}
        animate={{ scale: [1, 1.05, 1], opacity: [ring.op, ring.op + 0.2, ring.op] }}
        transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
      />
    ))}
    {/* Center Bullseye */}
    <motion.circle cx="50" cy="50" r="10" fill="url(#skyGrad)" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} />
    {/* Arrow */}
    <motion.path
      d="M70 30 L55 45"
      stroke="#0369A1" strokeWidth="4" strokeLinecap="round"
      initial={{ x: 20, y: -20, opacity: 0 }}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
    />
    <motion.path
      d="M70 30 L65 30 L70 35 Z"
      fill="#0369A1"
      initial={{ x: 20, y: -20, opacity: 0 }}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
    />
  </svg>
);

// 2. Guided Exploration (Amber)
export const GuidedExplorationSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    {/* Glowing Book Base */}
    <motion.rect x="30" y="45" width="40" height="30" rx="4" fill="#FDE68A" opacity="0.6" animate={{ y: [45, 43, 45] }} transition={{ duration: 4, repeat: Infinity }} />
    <motion.rect x="35" y="40" width="30" height="35" rx="4" fill="url(#amberGrad)" animate={{ y: [40, 38, 40] }} transition={{ duration: 4, repeat: Infinity, delay: 0.2 }} />

    {/* Floating Discovery Nodes (Meaning, Hindi, Audio) */}
    {[
      { x: 30, y: 25, r: 5, fill: "#F59E0B", d: 0 },
      { x: 50, y: 15, r: 7, fill: "#FCD34D", d: 0.5 },
      { x: 70, y: 25, r: 4, fill: "#D97706", d: 1 }
    ].map((node, i) => (
      <motion.g key={i} animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, delay: node.d }}>
        <circle cx={node.x} cy={node.y} r={node.r} fill={node.fill} />
        <path d={`M${node.x} ${node.y + node.r} L${node.x > 50 ? 55 : 45} 40`} stroke="#FDE68A" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
      </motion.g>
    ))}
    {/* Book Ribbon */}
    <motion.rect x="45" y="40" width="5" height="15" fill="#B45309" animate={{ height: [15, 20, 15] }} transition={{ duration: 4, repeat: Infinity }} />
  </svg>
);

// 3. Smart Flashcards (Blue)
export const SmartFlashcardsSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="100%" stopColor="#2563EB" />
      </linearGradient>
    </defs>
    {/* Background Cards */}
    <motion.rect x="25" y="25" width="35" height="45" rx="6" fill="#DBEAFE" opacity="0.5" transform="rotate(-10 40 45)" animate={{ rotate: [-10, -15, -10] }} transition={{ duration: 4, repeat: Infinity }} />
    <motion.rect x="40" y="20" width="35" height="45" rx="6" fill="#BFDBFE" opacity="0.7" transform="rotate(5 55 40)" animate={{ rotate: [5, 10, 5] }} transition={{ duration: 4, repeat: Infinity, delay: 0.5 }} />

    {/* Main Foreground Card Swiping */}
    <motion.g
      animate={{
        x: [0, 50, 0],
        y: [0, -20, 0],
        rotateZ: [0, 20, 0],
        opacity: [1, 0, 1]
      }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <rect x="32" y="30" width="35" height="45" rx="6" fill="url(#blueGrad)" />
      {/* Card Details */}
      <rect x="38" y="40" width="23" height="4" rx="2" fill="white" opacity="0.8" />
      <rect x="38" y="50" width="15" height="3" rx="1.5" fill="white" opacity="0.5" />
      <rect x="38" y="58" width="20" height="3" rx="1.5" fill="white" opacity="0.5" />
    </motion.g>

    {/* Incoming New Card */}
    <motion.g
      initial={{ x: -50, y: 20, opacity: 0, rotateZ: -20 }}
      animate={{ x: [ -50, 0, 0], y: [20, 0, 0], opacity: [0, 1, 1], rotateZ: [-20, 0, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
        <rect x="32" y="30" width="35" height="45" rx="6" fill="url(#blueGrad)" />
        <rect x="38" y="40" width="23" height="4" rx="2" fill="white" opacity="0.8" />
    </motion.g>
  </svg>
);

// 4. Word Families (Emerald)
export const WordFamiliesSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Connection Lines */}
    <motion.path d="M50 30 L30 60" stroke="#6EE7B7" strokeWidth="2" strokeDasharray="3 3" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
    <motion.path d="M50 30 L70 60" stroke="#6EE7B7" strokeWidth="2" strokeDasharray="3 3" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
    <motion.path d="M30 60 L70 60" stroke="#6EE7B7" strokeWidth="2" strokeDasharray="3 3" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }} />

    {/* Nodes */}
    <motion.g animate={{ y: [-3, 3, -3] }} transition={{ duration: 4, repeat: Infinity }}>
      <circle cx="50" cy="30" r="12" fill="url(#emeraldGrad)" />
      <circle cx="50" cy="30" r="4" fill="white" />
    </motion.g>

    <motion.g animate={{ x: [-2, 2, -2], y: [2, -2, 2] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}>
      <circle cx="30" cy="60" r="9" fill="#10B981" />
      <circle cx="30" cy="60" r="3" fill="white" />
    </motion.g>

    <motion.g animate={{ x: [2, -2, 2], y: [2, -2, 2] }} transition={{ duration: 3.5, repeat: Infinity, delay: 0.2 }}>
      <circle cx="70" cy="60" r="9" fill="#059669" />
      <circle cx="70" cy="60" r="3" fill="white" />
    </motion.g>

    {/* Hot Flame Icon on main node */}
    <motion.path d="M55 20 Q58 15 55 10 Q60 15 55 20 Z" fill="#FCD34D" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }} />
  </svg>
);

// 5. Imposter Trap (Violet)
export const ImposterTrapSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="violetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
    </defs>
    {/* Grid of Nodes */}
    {[
      { x: 30, y: 30, d: 0 }, { x: 50, y: 30, d: 0.2 }, { x: 70, y: 30, d: 0.4 },
      { x: 30, y: 50, d: 0.6 }, /* Center is imposter */ { x: 70, y: 50, d: 0.8 },
      { x: 30, y: 70, d: 1.0 }, { x: 50, y: 70, d: 1.2 }, { x: 70, y: 70, d: 1.4 }
    ].map((node, i) => (
      <motion.circle
        key={i} cx={node.x} cy={node.y} r="6" fill="#C4B5FD"
        animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, delay: node.d }}
      />
    ))}

    {/* The Imposter (Center) */}
    <motion.g animate={{ scale: [1, 1.3, 1], rotateZ: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
      <circle cx="50" cy="50" r="8" fill="url(#violetGrad)" />
      {/* Magnifying Glass highlighting it */}
      <motion.circle cx="50" cy="50" r="12" fill="none" stroke="#FCD34D" strokeWidth="2" />
      <motion.line x1="58" y1="58" x2="65" y2="65" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" />
    </motion.g>
  </svg>
);

// 6. Tap & Connect (Rose)
export const TapConnectSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="roseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="100%" stopColor="#E11D48" />
      </linearGradient>
    </defs>
    {/* Left Column Blocks */}
    {[30, 50, 70].map((y, i) => (
      <rect key={`l-${i}`} x="20" y={y-5} width="20" height="10" rx="3" fill="#FECDD3" />
    ))}
    {/* Right Column Blocks */}
    {[30, 50, 70].map((y, i) => (
      <rect key={`r-${i}`} x="60" y={y-5} width="20" height="10" rx="3" fill="#FECDD3" />
    ))}

    {/* Active Linking Animation */}
    <motion.rect x="20" y="25" width="20" height="10" rx="3" fill="url(#roseGrad)" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
    <motion.rect x="60" y="65" width="20" height="10" rx="3" fill="url(#roseGrad)" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }} />

    <motion.path
      d="M40 30 C 50 30, 50 70, 60 70"
      fill="none" stroke="#BE185D" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 4"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    />
    {/* Sparkle on connection */}
    <motion.circle cx="50" cy="50" r="2" fill="#FDE047" animate={{ scale: [1, 3, 0], opacity: [1, 0, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
  </svg>
);

// 7. Lightning Review (Indigo)
export const LightningReviewSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#818CF8" />
        <stop offset="100%" stopColor="#4F46E5" />
      </linearGradient>
    </defs>
    {/* Timer Dial Background */}
    <circle cx="50" cy="50" r="35" fill="none" stroke="#C7D2FE" strokeWidth="4" />
    {/* Animated Timer Progress */}
    <motion.path
      d="M50 15 A 35 35 0 1 1 15 50"
      fill="none" stroke="#818CF8" strokeWidth="4" strokeLinecap="round"
      initial={{ pathLength: 1 }}
      animate={{ pathLength: 0 }}
      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
    />

    {/* Lightning Bolt */}
    <motion.path
      d="M55 25 L40 50 L50 50 L45 75 L60 45 L50 45 Z"
      fill="url(#indigoGrad)"
      animate={{
        scale: [1, 1.1, 1],
        filter: ["drop-shadow(0 0 0px rgba(79,70,229,0))", "drop-shadow(0 0 10px rgba(79,70,229,0.8))", "drop-shadow(0 0 0px rgba(79,70,229,0))"]
      }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />

    {/* Sparks */}
    {[
      { x: 35, y: 35, d: 0 }, { x: 65, y: 35, d: 0.3 }, { x: 35, y: 65, d: 0.6 }, { x: 65, y: 65, d: 0.9 }
    ].map((spark, i) => (
      <motion.circle
        key={i} cx={spark.x} cy={spark.y} r="2" fill="#E0E7FF"
        animate={{ scale: [0, 2, 0], opacity: [1, 0, 1] }}
        transition={{ duration: 1, repeat: Infinity, delay: spark.d }}
      />
    ))}
  </svg>
);
