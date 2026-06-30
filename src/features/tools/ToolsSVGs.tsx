import React from 'react';
import { motion } from 'framer-motion';

// 1. Flashcard Image Maker (Indigo)
export const FlashcardMakerSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ perspective: '800px' }}>
    <defs>
      <linearGradient id="flashcardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#818CF8" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
      <linearGradient id="imageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C7D2FE" />
        <stop offset="100%" stopColor="#A5B4FC" />
      </linearGradient>
    </defs>

    {/* Background Card */}
    <motion.rect
      x="20" y="25" width="60" height="50" rx="6"
      fill="url(#flashcardGrad)" opacity="0.4"
      animate={{ rotateZ: [-2, 2, -2], y: [0, -2, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Foreground Card */}
    <motion.rect
      x="25" y="20" width="60" height="50" rx="6"
      fill="url(#flashcardGrad)" opacity="0.9"
      animate={{ rotateZ: [2, -2, 2], y: [0, 2, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
    />

    {/* Abstract Image Details inside foreground card */}
    <motion.circle
      cx="45" cy="40" r="8" fill="url(#imageGrad)"
      animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.path
      d="M30 60 L45 45 L55 55 L75 35 L80 60 Z"
      fill="url(#imageGrad)" opacity="0.7"
      animate={{ y: [0, 1, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />
  </svg>
);

// 2. Bilingual PDF Generator (Purple)
export const BilingualPdfSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ perspective: '800px' }}>
    <defs>
      <linearGradient id="pdfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C084FC" />
        <stop offset="100%" stopColor="#A855F7" />
      </linearGradient>
      <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E9D5FF" />
        <stop offset="100%" stopColor="#D8B4FE" />
      </linearGradient>
    </defs>

    {/* Back Document (Language 2) */}
    <motion.rect
      x="35" y="15" width="45" height="60" rx="4"
      fill="url(#pdfGrad)" opacity="0.5"
      animate={{ x: [0, 2, 0], rotateZ: [5, 3, 5] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Front Document (Language 1) */}
    <motion.rect
      x="20" y="25" width="45" height="60" rx="4"
      fill="url(#pdfGrad)" opacity="0.9"
      animate={{ x: [0, -2, 0], rotateZ: [-2, 0, -2] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
    />

    {/* Text Lines */}
    <motion.rect x="28" y="35" width="20" height="4" rx="2" fill="url(#docGrad)"
      animate={{ width: [20, 25, 20] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
    <motion.rect x="28" y="45" width="30" height="4" rx="2" fill="url(#docGrad)"
      animate={{ width: [30, 25, 30] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} />
    <motion.rect x="28" y="55" width="25" height="4" rx="2" fill="url(#docGrad)"
      animate={{ width: [25, 30, 25] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} />

    {/* Translation Arrows Loop */}
    <motion.path
      d="M50 80 Q60 90 70 80 T90 80"
      fill="none" stroke="url(#docGrad)" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 4"
      animate={{ strokeDashoffset: [20, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    />
  </svg>
);

// 3. GK PDF/PPT Generator (Gray/Slate)
export const PptGeneratorSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ perspective: '800px' }}>
    <defs>
      <linearGradient id="pptGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#64748B" />
      </linearGradient>
      <linearGradient id="chartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#CBD5E1" />
        <stop offset="100%" stopColor="#94A3B8" />
      </linearGradient>
    </defs>

    {/* Presentation Board */}
    <motion.rect
      x="15" y="25" width="70" height="50" rx="4"
      fill="url(#pptGrad)" opacity="0.9"
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Stand Base */}
    <motion.path
      d="M45 75 L55 75 L60 90 L40 90 Z"
      fill="url(#chartGrad)" opacity="0.8"
    />

    {/* Chart Bars */}
    <motion.rect x="25" y="45" width="10" height="20" rx="2" fill="url(#chartGrad)"
      animate={{ height: [20, 15, 20], y: [0, 5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
    <motion.rect x="45" y="35" width="10" height="30" rx="2" fill="url(#chartGrad)"
      animate={{ height: [30, 25, 30], y: [0, 5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} />
    <motion.rect x="65" y="25" width="10" height="40" rx="2" fill="url(#chartGrad)"
      animate={{ height: [40, 35, 40], y: [0, 5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} />

    {/* Sparkles/Stars */}
    <motion.circle cx="80" cy="20" r="3" fill="#E2E8F0"
      animate={{ scale: [0.5, 1.5, 0.5], opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 2, repeat: Infinity }} />
    <motion.circle cx="20" cy="15" r="2" fill="#E2E8F0"
      animate={{ scale: [0.5, 1.5, 0.5], opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }} />
  </svg>
);

// 4. Text Exporter (Rose)
export const TextExporterSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ perspective: '800px' }}>
    <defs>
      <linearGradient id="textExporterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="100%" stopColor="#E11D48" />
      </linearGradient>
      <linearGradient id="textDocGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FECDD3" />
        <stop offset="100%" stopColor="#FDA4AF" />
      </linearGradient>
    </defs>

    {/* Background Document */}
    <motion.rect
      x="30" y="15" width="50" height="65" rx="4"
      fill="url(#textExporterGrad)" opacity="0.4"
      animate={{ y: [0, -2, 0], rotateZ: [2, 0, 2] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Foreground Document */}
    <motion.rect
      x="20" y="20" width="50" height="65" rx="4"
      fill="url(#textExporterGrad)" opacity="0.9"
      animate={{ y: [0, 2, 0], rotateZ: [-2, 0, -2] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
    />

    {/* Code Brackets & Markdown Syntax */}
    <motion.path
      d="M30 40 L25 45 L30 50"
      fill="none" stroke="url(#textDocGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
      animate={{ x: [0, -1, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.path
      d="M60 40 L65 45 L60 50"
      fill="none" stroke="url(#textDocGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
      animate={{ x: [0, 1, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />

    <motion.path
      d="M48 35 L42 55"
      fill="none" stroke="url(#textDocGrad)" strokeWidth="3" strokeLinecap="round"
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Abstract text lines below code block */}
    <motion.rect x="30" y="60" width="30" height="3" rx="1.5" fill="url(#textDocGrad)"
      animate={{ width: [30, 25, 30] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
    <motion.rect x="30" y="68" width="20" height="3" rx="1.5" fill="url(#textDocGrad)"
      animate={{ width: [20, 25, 20] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} />
    <motion.rect x="30" y="76" width="25" height="3" rx="1.5" fill="url(#textDocGrad)"
      animate={{ width: [25, 20, 25] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} />

  </svg>
);
