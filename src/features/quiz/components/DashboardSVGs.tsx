import React from 'react';
import { motion } from 'framer-motion';

// 1. Create Quiz (Indigo)
export const CreateQuizSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ perspective: '800px' }}>
    <defs>
      <linearGradient id="createGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#818CF8" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
    </defs>
    {/* Floating Building Blocks */}
    {[
      { x: 30, y: 50, w: 20, h: 20, rx: 4, d: 0 },
      { x: 55, y: 30, w: 25, h: 20, rx: 4, d: 0.3 },
      { x: 40, y: 20, w: 15, h: 15, rx: 4, d: 0.6 },
    ].map((block, i) => (
      <motion.rect
        key={i}
        x={block.x} y={block.y} width={block.w} height={block.h} rx={block.rx}
        fill="url(#createGrad)" opacity="0.8"
        animate={{ y: [block.y, block.y - 10, block.y], rotateZ: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: block.d }}
      />
    ))}
    {/* Dynamic Connecting Lines */}
    <motion.path
      d="M20 70 Q40 50 60 70 T80 50"
      fill="none" stroke="#C7D2FE" strokeWidth="3" strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" }}
    />
    {/* Plus Icon Center */}
    <motion.g animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
      <circle cx="70" cy="70" r="12" fill="#4F46E5" />
      <path d="M70 64 L70 76 M64 70 L76 70" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </motion.g>
  </svg>
);

// 2. Created Quizzes (Emerald)
export const SavedQuizzesSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="savedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Background Papers */}
    <motion.rect x="30" y="25" width="40" height="50" rx="4" fill="#A7F3D0" opacity="0.5" animate={{ y: [25, 23, 25], rotateZ: [-5, -7, -5] }} transition={{ duration: 3, repeat: Infinity }} />
    <motion.rect x="30" y="30" width="40" height="50" rx="4" fill="#6EE7B7" opacity="0.8" animate={{ y: [30, 28, 30], rotateZ: [5, 7, 5] }} transition={{ duration: 3, repeat: Infinity, delay: 0.2 }} />

    {/* Foreground Paper with Checkmark */}
    <motion.g animate={{ y: [35, 30, 35] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
      <rect x="30" y="35" width="40" height="50" rx="4" fill="url(#savedGrad)" />
      {/* Animated Checkmark */}
      <motion.path
        d="M40 55 L47 62 L60 45"
        fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
      />
    </motion.g>
  </svg>
);

// 3. English Zone (Rose)
export const EnglishZoneSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="englishGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="100%" stopColor="#E11D48" />
      </linearGradient>
    </defs>
    {/* Pulsing Speech Bubbles */}
    <motion.path
      d="M20 50 C20 30, 45 30, 45 50 C45 70, 20 70, 20 50 Z"
      fill="#FECDD3" opacity="0.6"
      animate={{ scale: [1, 1.1, 1], x: [0, -5, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.path
      d="M50 40 C50 20, 80 20, 80 40 C80 60, 50 60, 50 40 Z"
      fill="url(#englishGrad)"
      animate={{ scale: [1, 1.05, 1], x: [0, 5, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
    />
    {/* Floating Letters */}
    <motion.text x="58" y="48" fill="white" fontSize="18" fontWeight="bold" animate={{ y: [48, 45, 48] }} transition={{ duration: 2, repeat: Infinity }}>A</motion.text>
    <motion.text x="30" y="55" fill="#BE185D" fontSize="14" fontWeight="bold" animate={{ y: [55, 52, 55] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}>Z</motion.text>

    {/* Connection lines */}
    <motion.path d="M45 45 L50 40" stroke="#F43F5E" strokeWidth="2" strokeDasharray="2 2" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
  </svg>
);

// 4. Tools (Amber)
export const ToolsSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="toolsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    {/* Rotating Gears */}
    <motion.g animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: '35px 35px' }}>
      <circle cx="35" cy="35" r="15" fill="#FDE68A" />
      <circle cx="35" cy="35" r="5" fill="white" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
         <rect key={deg} x="32" y="15" width="6" height="5" fill="#FDE68A" transform={`rotate(${deg} 35 35)`} />
      ))}
    </motion.g>

    <motion.g animate={{ rotate: -360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: '65px 65px' }}>
      <circle cx="65" cy="65" r="20" fill="url(#toolsGrad)" />
      <circle cx="65" cy="65" r="8" fill="white" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
         <rect key={deg} x="61" y="40" width="8" height="6" fill="url(#toolsGrad)" transform={`rotate(${deg} 65 65)`} />
      ))}
    </motion.g>

    {/* Floating Wrench/Spanner */}
    <motion.path
      d="M20 80 L40 60 A10 10 0 1 1 50 50 L30 70 A10 10 0 1 1 20 80 Z"
      fill="#F59E0B" opacity="0.8"
      animate={{ x: [-2, 2, -2], y: [2, -2, 2] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
  </svg>
);

// 5. Analytics (Blue)
export const AnalyticsSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="analyticsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="100%" stopColor="#2563EB" />
      </linearGradient>
      <linearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#93C5FD" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
    {/* Grid Lines */}
    {[20, 40, 60, 80].map(y => (
      <line key={y} x1="10" y1={y} x2="90" y2={y} stroke="#DBEAFE" strokeWidth="1" strokeDasharray="4 4" />
    ))}
    {/* Growing Bars */}
    {[
      { x: 20, h: 30, d: 0 },
      { x: 40, h: 50, d: 0.2 },
      { x: 60, h: 20, d: 0.4 },
      { x: 80, h: 65, d: 0.6 }
    ].map((bar, i) => (
      <motion.rect
        key={i}
        x={bar.x} y={80 - bar.h} width="12" rx="3"
        fill="url(#barGrad)"
        initial={{ height: 0, y: 80 }}
        animate={{ height: bar.h, y: 80 - bar.h }}
        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", delay: bar.d }}
      />
    ))}
    {/* Rising Line Graph */}
    <motion.path
      d="M26 50 L46 30 L66 60 L86 15"
      fill="none" stroke="url(#analyticsGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.circle cx="86" cy="15" r="5" fill="#1D4ED8" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity }} />
  </svg>
);

// 6. Bookmarks (Violet)
export const BookmarksSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="bookmarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
    </defs>
    {/* Glowing Aura Rings */}
    {[1, 2].map(ring => (
      <motion.circle
        key={ring} cx="50" cy="45" r="20" fill="none" stroke="#DDD6FE" strokeWidth="2"
        initial={{ scale: 1, opacity: 0.8 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 2.5, repeat: Infinity, delay: ring * 1.2, ease: "easeOut" }}
      />
    ))}
    {/* Floating Bookmark Ribbon */}
    <motion.path
      d="M35 20 L65 20 L65 80 L50 65 L35 80 Z"
      fill="url(#bookmarkGrad)"
      animate={{ y: [-5, 5, -5] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />
    {/* Star center */}
    <motion.g animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ rotate: { duration: 10, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }} style={{ transformOrigin: '50px 40px' }}>
      <path d="M50 30 L53 38 L62 38 L55 43 L58 51 L50 46 L42 51 L45 43 L38 38 L47 38 Z" fill="#FDE047" />
    </motion.g>
  </svg>
);

// 7. About Us (Slate)
export const AboutSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="aboutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
    </defs>
    {/* Expanding Orb */}
    <motion.circle
      cx="50" cy="50" r="30"
      fill="url(#aboutGrad)" opacity="0.8"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    {/* Orbiting particles */}
    {[
      { rx: 40, ry: 20, d: 0 },
      { rx: 20, ry: 40, d: 1 }
    ].map((orbit, i) => (
      <motion.ellipse
        key={i} cx="50" cy="50" rx={orbit.rx} ry={orbit.ry} fill="none" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: orbit.d }}
        style={{ transformOrigin: '50px 50px' }}
      />
    ))}
    {/* Stylized 'i' */}
    <motion.circle cx="50" cy="35" r="5" fill="white" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
    <motion.rect x="46" y="45" width="8" height="25" rx="4" fill="white" animate={{ y: [45, 43, 45] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
  </svg>
);

// --- English Zone SVGs ---

// 1. Vocab Quiz (Emerald)
export const VocabQuizSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="vocabGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Floating Book Pages */}
    {[
      { y: 30, w: 40, h: 50, d: 0, rx: 4, fill: "#A7F3D0", op: 0.5, rz: [-5, -8, -5] },
      { y: 35, w: 40, h: 50, d: 0.2, rx: 4, fill: "#6EE7B7", op: 0.8, rz: [5, 8, 5] },
    ].map((page, i) => (
      <motion.rect
        key={i} x="30" y={page.y} width={page.w} height={page.h} rx={page.rx} fill={page.fill} opacity={page.op}
        animate={{ y: [page.y, page.y - 3, page.y], rotateZ: page.rz }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: page.d }}
      />
    ))}
    {/* Foreground Book Cover */}
    <motion.g animate={{ y: [40, 35, 40] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
      <rect x="30" y="40" width="40" height="50" rx="4" fill="url(#vocabGrad)" />
      {/* 'A' Text pulsing */}
      <motion.text x="40" y="70" fill="white" fontSize="24" fontWeight="bold" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>A</motion.text>
    </motion.g>
  </svg>
);

// 2. Grammar Quiz (Violet)
export const GrammarQuizSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="grammarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
    </defs>
    {/* Drawing path */}
    <motion.path
      d="M20 70 Q 40 40 60 60 T 80 30"
      fill="none" stroke="#DDD6FE" strokeWidth="4" strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" }}
    />
    {/* Floating Pen */}
    <motion.g animate={{ x: [-5, 5, -5], y: [5, -5, 5], rotateZ: [-10, 10, -10] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
      <path d="M70 20 L80 30 L40 70 L30 60 Z" fill="url(#grammarGrad)" />
      <path d="M30 60 L20 70 L40 70 Z" fill="#C4B5FD" />
      <circle cx="23" cy="68" r="2" fill="#4C1D95" />
    </motion.g>
  </svg>
);

// 3. English Mock (Rose)
export const EnglishMockSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="mockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="100%" stopColor="#E11D48" />
      </linearGradient>
    </defs>
    {/* Floating Target / Test Paper */}
    <motion.rect x="25" y="25" width="50" height="60" rx="4" fill="#FECDD3" opacity="0.6" animate={{ y: [25, 20, 25] }} transition={{ duration: 3, repeat: Infinity }} />
    <motion.rect x="30" y="30" width="50" height="60" rx="4" fill="url(#mockGrad)" animate={{ y: [30, 25, 30] }} transition={{ duration: 3, repeat: Infinity, delay: 0.2 }} />

    {/* Checklist items */}
    {[
      { y: 45, w: 25, d: 0.4 },
      { y: 60, w: 15, d: 0.6 },
      { y: 75, w: 20, d: 0.8 },
    ].map((line, i) => (
      <motion.g key={i} animate={{ y: [line.y, line.y - 5, line.y] }} transition={{ duration: 3, repeat: Infinity, delay: 0.2 }}>
        <rect x="50" y={0} width={line.w} height="4" rx="2" fill="white" />
        <circle cx="40" cy="2" r="3" fill="#FFE4E6" />
        {/* Animated Checkmarks inside circles */}
        <motion.path
          d="M38 2 L40 4 L43 0"
          fill="none" stroke="#BE185D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1.5, delay: line.d }}
        />
      </motion.g>
    ))}
    {/* A+ Grade Stamp */}
    <motion.text x="55" y="55" fill="#FFE4E6" fontSize="20" fontWeight="bold" opacity="0.4" animate={{ scale: [1, 1.2, 1], rotate: [-10, 10, -10] }} transition={{ duration: 4, repeat: Infinity }}>A+</motion.text>
  </svg>
);

// --- Vocabulary Master SVGs ---

// 1. Idioms & Phrases (Amber)
export const IdiomsSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="idiomsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    {/* Floating Quote Marks */}
    <motion.path
      d="M30 40 Q40 40 40 50 Q40 60 30 60 Q20 60 20 50 Q20 40 30 40 Z M30 50 L30 65"
      fill="url(#idiomsGrad)" stroke="white" strokeWidth="2"
      animate={{ y: [0, -5, 0], rotateZ: [-5, 5, -5] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.path
      d="M60 30 Q70 30 70 40 Q70 50 60 50 Q50 50 50 40 Q50 30 60 30 Z M60 40 L60 55"
      fill="#FDE68A" stroke="url(#idiomsGrad)" strokeWidth="2"
      animate={{ y: [0, 5, 0], rotateZ: [5, -5, 5] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
    />

    {/* Conversation Bubbles Background */}
    <motion.ellipse
      cx="50" cy="50" rx="35" ry="25"
      fill="none" stroke="#FCD34D" strokeWidth="2" strokeDasharray="4 4"
      animate={{ rotate: 360, scale: [1, 1.05, 1] }}
      transition={{ rotate: { duration: 15, repeat: Infinity, ease: "linear" }, scale: { duration: 3, repeat: Infinity } }}
    />
  </svg>
);

// 2. One Word Substitution (Purple)
export const OwsSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="owsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C084FC" />
        <stop offset="100%" stopColor="#9333EA" />
      </linearGradient>
      <linearGradient id="owsGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E9D5FF" />
        <stop offset="100%" stopColor="#D8B4FE" />
      </linearGradient>
    </defs>
    {/* Background scattered words (represented by lines) shrinking into one */}
    {[
      { x: 20, y: 30, w: 20, d: 0 },
      { x: 60, y: 20, w: 25, d: 0.2 },
      { x: 15, y: 70, w: 30, d: 0.4 },
      { x: 65, y: 75, w: 15, d: 0.6 }
    ].map((line, i) => (
      <motion.rect
        key={i} x={line.x} y={line.y} width={line.w} height="6" rx="3"
        fill="url(#owsGradLight)" opacity="0.6"
        animate={{ x: [line.x, 40, line.x], y: [line.y, 45, line.y], opacity: [0.6, 0, 0.6], scale: [1, 0.5, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: line.d }}
      />
    ))}

    {/* Center Target / Diamond (The 'One Word') */}
    <motion.g animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
      <rect x="40" y="40" width="20" height="20" rx="4" fill="url(#owsGrad)" transform="rotate(45 50 50)" />
      <circle cx="50" cy="50" r="4" fill="white" />
    </motion.g>

    {/* Impact Rings */}
    <motion.circle
      cx="50" cy="50" r="15" fill="none" stroke="#A855F7" strokeWidth="2"
      initial={{ scale: 1, opacity: 0.8 }}
      animate={{ scale: 3, opacity: 0 }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
    />
  </svg>
);

// 3. Synonyms & Antonyms (Emerald)
export const SynonymsSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="synGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="antGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>
    {/* Rotating Arrows showing relationship */}
    <motion.g animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: '50px 50px' }}>
      {/* Arrow Up-Right (Synonym) */}
      <path d="M40 20 L60 20 L60 40" fill="none" stroke="url(#synGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M60 20 L35 45" fill="none" stroke="url(#synGrad)" strokeWidth="6" strokeLinecap="round" />

      {/* Arrow Down-Left (Antonym) */}
      <path d="M60 80 L40 80 L40 60" fill="none" stroke="url(#antGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M40 80 L65 55" fill="none" stroke="url(#antGrad)" strokeWidth="6" strokeLinecap="round" />
    </motion.g>

    {/* Center Nodes */}
    <motion.circle cx="35" cy="45" r="8" fill="#A7F3D0" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} />
    <motion.circle cx="65" cy="55" r="8" fill="#6EE7B7" animate={{ scale: [1.2, 1, 1.2] }} transition={{ duration: 2, repeat: Infinity }} />
    <motion.line x1="35" y1="45" x2="65" y2="55" stroke="#34D399" strokeWidth="2" strokeDasharray="3 3" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
  </svg>
);

// 8. Download (Cyan/Teal)
export const DownloadSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="downloadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2DD4BF" />
        <stop offset="100%" stopColor="#0D9488" />
      </linearGradient>
    </defs>
    {/* Floating Cloud */}
    <motion.path
      d="M25 60 A15 15 0 0 1 25 30 A20 20 0 0 1 65 30 A15 15 0 0 1 75 60 Z"
      fill="#CCFBF1" opacity="0.6"
      animate={{ y: [-2, 2, -2] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.path
      d="M30 65 A15 15 0 0 1 30 35 A20 20 0 0 1 70 35 A15 15 0 0 1 80 65 Z"
      fill="url(#downloadGrad)"
      animate={{ y: [2, -2, 2] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
    />
    {/* Animated Arrow Down */}
    <motion.g animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
      <line x1="55" y1="35" x2="55" y2="55" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <path d="M45 45 L55 55 L65 45" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </motion.g>
    {/* Receiving Tray/Drive */}
    <motion.path
      d="M35 75 L75 75"
      stroke="#14B8A6" strokeWidth="4" strokeLinecap="round"
      animate={{ opacity: [0.5, 1, 0.5], scaleX: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      style={{ transformOrigin: "55px 75px" }}
    />
  </svg>
);

// 9. God Mode (Rose/Pink/Red)
export const GodModeSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="godModeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F43F5E" />
        <stop offset="100%" stopColor="#BE123C" />
      </linearGradient>
    </defs>
    {/* Floating Elements (representing nodes) */}
    <motion.circle cx="30" cy="30" r="8" fill="#FDA4AF" animate={{ y: [0, -5, 0], scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }} />
    <motion.circle cx="70" cy="40" r="10" fill="url(#godModeGrad)" animate={{ y: [0, 5, 0], scale: [1, 1.2, 1] }} transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }} />
    <motion.circle cx="50" cy="70" r="12" fill="#FB7185" animate={{ y: [0, -5, 0], scale: [1, 1.15, 1] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }} />

    {/* Connecting lines */}
    <motion.path
      d="M30 30 L50 70 L70 40 Z"
      fill="none"
      stroke="#F43F5E"
      strokeWidth="2"
      strokeDasharray="4 4"
      animate={{ opacity: [0.3, 0.8, 0.3] }}
      transition={{ duration: 2, repeat: Infinity }}
    />

    {/* Blueprint Compass/Ruler Center */}
    <motion.g animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: '50px 50px' }}>
      <path d="M50 20 L50 80 M20 50 L80 50" stroke="#FFE4E6" strokeWidth="1" opacity="0.5" />
      <circle cx="50" cy="50" r="20" fill="none" stroke="url(#godModeGrad)" strokeWidth="3" strokeDasharray="10 5" />
      <circle cx="50" cy="50" r="5" fill="#E11D48" />
    </motion.g>
  </svg>
);


// MCQs Quiz (Fuchsia)
export const McqsQuizSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ perspective: '800px' }}>
    <defs>
      <linearGradient id="mcqsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E879F9" />
        <stop offset="100%" stopColor="#C026D3" />
      </linearGradient>
    </defs>
    {/* Animated checkmarks representing MCQs */}
    {[
      { x: 30, y: 30, delay: 0 },
      { x: 30, y: 50, delay: 0.3 },
      { x: 30, y: 70, delay: 0.6 },
    ].map((item, i) => (
      <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 3, repeat: Infinity, delay: item.delay }}>
        <rect x={item.x} y={item.y - 8} width="40" height="16" rx="8" fill="url(#mcqsGrad)" opacity="0.3" />
        <circle cx={item.x + 8} cy={item.y} r="4" fill="#F0ABFC" />
        <path d={`M ${item.x + 18} ${item.y} L ${item.x + 22} ${item.y + 4} L ${item.x + 30} ${item.y - 4}`} fill="none" stroke="#FDF4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>
    ))}

    {/* Floating elements */}
    <motion.circle cx="75" cy="25" r="8" fill="url(#mcqsGrad)" animate={{ y: [0, -5, 0], scale: [1, 1.1, 1] }} transition={{ duration: 4, repeat: Infinity }} />
    <motion.rect x="15" y="80" width="10" height="10" rx="2" fill="url(#mcqsGrad)" opacity="0.8" animate={{ rotate: [0, 90, 180, 270, 360] }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} />
  </svg>
);

// Attempted Quizzes (Amber)
export const AttemptedQuizzesSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <linearGradient id="attemptedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    {/* Base Document */}
    <motion.path
      d="M30 20 h30 a10 10 0 0 1 10 10 v40 a10 10 0 0 1 -10 10 h-40 a10 10 0 0 1 -10 -10 v-30 l20 -20 z"
      fill="url(#attemptedGrad)" opacity="0.8"
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    {/* Folded Corner */}
    <path d="M30 20 v20 h-20 l20 -20 z" fill="#FDE68A" opacity="0.5" />

    {/* Progress Checkmarks */}
    {[
      { d: "M35 45 l5 5 l15 -15", delay: 0 },
      { d: "M35 60 l5 5 l15 -15", delay: 0.5 },
      { d: "M35 75 l5 5 l15 -15", delay: 1.0 },
    ].map((mark, i) => (
      <motion.path
        key={i}
        d={mark.d}
        fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, delay: mark.delay, repeatType: "reverse" }}
      />
    ))}
    {/* Score badge */}
    <motion.g animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
      <circle cx="75" cy="75" r="15" fill="#B45309" />
      <text x="75" y="80" fill="white" fontSize="12" fontWeight="bold" textAnchor="middle">A+</text>
    </motion.g>
  </svg>
);
