import React from 'react';
import { motion } from 'framer-motion';

// 1. Chat with AI (Blue)
export const ChatWithAISVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="chatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
      <linearGradient id="chatGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>

    {/* Main Chat Bubble */}
    <motion.path
      d="M20 30 C20 20, 30 15, 50 15 C70 15, 80 20, 80 30 C80 40, 70 45, 50 45 C40 45, 30 48, 20 55 C23 48, 20 40, 20 30 Z"
      fill="url(#chatGrad)"
      opacity="0.9"
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Smaller Secondary Bubble */}
    <motion.path
      d="M50 55 C50 45, 60 40, 80 40 C100 40, 110 45, 110 55 C110 65, 100 70, 80 70 C70 70, 60 73, 50 80 C53 73, 50 65, 50 55 Z"
      fill="url(#chatGradDark)"
      opacity="0.7"
      animate={{ y: [0, -3, 0], x: [-15, -15, -15] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
    />

    {/* Dots in main bubble */}
    {[
      { cx: 35, delay: 0 },
      { cx: 50, delay: 0.2 },
      { cx: 65, delay: 0.4 },
    ].map((dot, i) => (
      <motion.circle
        key={i}
        cx={dot.cx}
        cy="30"
        r="4"
        fill="white"
        animate={{ y: [0, -3, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: dot.delay }}
      />
    ))}
  </svg>
);

// 2. Talk to AI (Emerald)
export const TalkToAISVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="talkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>

    {/* Microphone Body */}
    <motion.rect
      x="40" y="20" width="20" height="35" rx="10"
      fill="url(#talkGrad)"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Microphone Base/Stand */}
    <motion.path
      d="M30 45 A 20 20 0 0 0 70 45 M50 65 L50 80 M35 80 L65 80"
      fill="none" stroke="#10B981" strokeWidth="4" strokeLinecap="round"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Sound Waves */}
    {[
      { x: 20, y: 35, h: 10, d: 0 },
      { x: 10, y: 25, h: 30, d: 0.2 },
      { x: 80, y: 35, h: 10, d: 0.4 },
      { x: 90, y: 25, h: 30, d: 0.6 },
    ].map((wave, i) => (
      <motion.rect
        key={i}
        x={wave.x} y={wave.y} width="4" height={wave.h} rx="2"
        fill="#34D399"
        animate={{ height: [wave.h, wave.h * 1.5, wave.h], y: [wave.y, wave.y - (wave.h * 0.25), wave.y] }}
        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: wave.d }}
      />
    ))}
  </svg>
);

// 3. Generate Quiz with AI (Purple)
export const GenerateQuizAISVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="quizGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
    </defs>

    {/* Magic Wand Wand */}
    <motion.rect
      x="45" y="45" width="8" height="40" rx="4"
      fill="url(#quizGrad)"
      transform="rotate(45 50 50)"
      animate={{ rotate: [45, 55, 45] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Wand Tip Star */}
    <motion.path
      d="M70 20 L73 28 L81 30 L74 35 L76 43 L70 38 L64 43 L66 35 L59 30 L67 28 Z"
      fill="#FCD34D"
      animate={{
        scale: [1, 1.2, 1],
        rotate: [0, 90, 180],
        opacity: [0.8, 1, 0.8]
      }}
      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
    />

    {/* Sparkles */}
    {[
      { cx: 85, cy: 15, r: 3, d: 0 },
      { cx: 95, cy: 35, r: 4, d: 0.5 },
      { cx: 60, cy: 10, r: 2, d: 1 },
      { cx: 55, cy: 25, r: 3, d: 1.5 },
    ].map((sparkle, i) => (
      <motion.circle
        key={i}
        cx={sparkle.cx} cy={sparkle.cy} r={sparkle.r}
        fill="#C4B5FD"
        animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: sparkle.d }}
      />
    ))}
  </svg>
);

// 4. AI Study Planner (Amber)
export const AIStudyPlannerSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="plannerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>

    {/* Calendar Body */}
    <motion.rect
      x="25" y="30" width="50" height="50" rx="6"
      fill="url(#plannerGrad)"
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Calendar Header/Rings */}
    <motion.path
      d="M25 45 L75 45 M35 25 L35 35 M65 25 L65 35"
      stroke="#FDE68A" strokeWidth="4" strokeLinecap="round"
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Checkmarks / Tasks */}
    {[
      { x1: 35, y1: 55, x2: 45, y2: 65, x3: 65, y3: 45, d: 0 },
      { x1: 35, y1: 70, x2: 45, y2: 70, x3: 65, y3: 70, d: 0.5, line: true },
    ].map((task, i) => (
      task.line ? (
        <motion.line
           key={i}
           x1={task.x1} y1={task.y1} x2={task.x3} y2={task.y3}
           stroke="white" strokeWidth="3" strokeLinecap="round"
           animate={{ y: [0, -3, 0], opacity: [0.5, 1, 0.5] }}
           transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: task.d }}
        />
      ) : (
        <motion.path
          key={i}
          d={`M${task.x1} ${task.y1} L${task.x2} ${task.y2} L${task.x3} ${task.y3}`}
          fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1, y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatType: "reverse", delay: task.d }}
        />
      )
    ))}
  </svg>
);
