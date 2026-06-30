import React from 'react';
import { motion, Variants } from 'framer-motion';

const iconVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

const gVariants: Variants = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.3 }
  }
};

export const DeveloperProfileSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor">
    <motion.g variants={gVariants} initial="hidden" animate="visible" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400">
      <motion.circle cx="50" cy="35" r="18" variants={iconVariants} />
      <motion.path d="M 20 85 C 20 65 30 58 50 58 C 70 58 80 65 80 85" variants={iconVariants} />
      <motion.path d="M 50 58 L 50 85" variants={iconVariants} strokeDasharray="2 4" strokeWidth="2" className="text-indigo-400 dark:text-indigo-300" opacity="0.5" />
    </motion.g>
  </svg>
);

export const PrivacyPolicySVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor">
    <motion.g variants={gVariants} initial="hidden" animate="visible" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
      <motion.path d="M 50 15 L 20 30 L 20 60 C 20 75 35 85 50 95 C 65 85 80 75 80 60 L 80 30 Z" variants={iconVariants} />
      <motion.path d="M 35 55 L 45 65 L 65 45" variants={iconVariants} />
    </motion.g>
  </svg>
);

export const TermsOfUseSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor">
    <motion.g variants={gVariants} initial="hidden" animate="visible" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
      <motion.rect x="25" y="15" width="50" height="70" rx="8" variants={iconVariants} />
      <motion.path d="M 40 35 L 75 35 M 40 50 L 75 50 M 40 65 L 60 65" variants={iconVariants} />
      <motion.path d="M 25 35 L 30 35 M 25 50 L 30 50 M 25 65 L 30 65" variants={iconVariants} strokeWidth="6" />
    </motion.g>
  </svg>
);

export const OwnerSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor">
    <motion.g variants={gVariants} initial="hidden" animate="visible" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 dark:text-purple-400">
      <motion.path d="M 50 15 L 85 35 L 50 55 L 15 35 Z" variants={iconVariants} />
      <motion.path d="M 15 55 L 50 75 L 85 55 M 15 75 L 50 95 L 85 75" variants={iconVariants} />
    </motion.g>
  </svg>
);

export const CEOSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor">
    <motion.g variants={gVariants} initial="hidden" animate="visible" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
      <motion.circle cx="50" cy="50" r="40" variants={iconVariants} />
      <motion.path d="M 35 50 L 50 35 L 65 50 M 50 35 L 50 70" variants={iconVariants} />
    </motion.g>
  </svg>
);

export const BackendSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor">
    <motion.g variants={gVariants} initial="hidden" animate="visible" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-600 dark:text-cyan-400">
      <motion.rect x="20" y="20" width="60" height="20" rx="4" variants={iconVariants} />
      <motion.rect x="20" y="60" width="60" height="20" rx="4" variants={iconVariants} />
      <motion.path d="M 30 30 L 30 30.01 M 40 30 L 40 30.01 M 30 70 L 30 70.01 M 40 70 L 40 70.01" variants={iconVariants} strokeWidth="6" />
      <motion.path d="M 50 40 L 50 60" variants={iconVariants} strokeDasharray="4 4" />
    </motion.g>
  </svg>
);

export const MarketingSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor">
    <motion.g variants={gVariants} initial="hidden" animate="visible" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600 dark:text-rose-400">
      <motion.path d="M 20 80 L 80 80" variants={iconVariants} />
      <motion.path d="M 30 80 L 30 50 M 50 80 L 50 30 M 70 80 L 70 15" variants={iconVariants} />
      <motion.circle cx="70" cy="15" r="4" variants={iconVariants} className="fill-rose-600 dark:fill-rose-400" />
      <motion.path d="M 30 50 L 50 30 L 70 15" variants={iconVariants} strokeDasharray="4 4" className="text-rose-400 dark:text-rose-300" opacity="0.6" />
    </motion.g>
  </svg>
);
