import React from 'react';
import { motion } from 'framer-motion';

export function AnimatedLogo({ className = "w-48 h-48" }: { className?: string }) {
  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: i * 0.15, type: "spring" as const, duration: 2, bounce: 0 },
        opacity: { delay: i * 0.15, duration: 0.1 }
      }
    })
  };

  const circleVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: 1.8 + i * 0.2,
        type: "spring" as const,
        stiffness: 300,
        damping: 15
      }
    })
  };

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      initial="hidden"
      animate="visible"
    >
      {/* Brain/Circuit Icon - We use currentColor to inherit Tailwind text colors for easy dark mode support */}
      <g
        transform="translate(106, 106) scale(0.6)"
        fill="none"
        stroke="currentColor"
        strokeWidth="40"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-indigo-600 dark:text-indigo-400"
      >
        {/* Left Hemisphere */}
        <motion.path custom={1} variants={pathVariants} d="M125 200c0-50 30-90 80-90s80 40 80 90c0 20-10 40-25 55" />
        <motion.path custom={2} variants={pathVariants} d="M100 280c-30 0-60-20-60-70 0-40 30-80 70-80" />
        <motion.path custom={3} variants={pathVariants} d="M120 350c-40 0-70-30-70-70" />
        <motion.path custom={4} variants={pathVariants} d="M205 380c-50 0-85-30-85-80" />

        {/* Right Hemisphere */}
        <motion.path custom={1} variants={pathVariants} d="M375 200c0-50-30-90-80-90s-80 40-80 90c0 20 10 40 25 55" />
        <motion.path custom={2} variants={pathVariants} d="M400 280c30 0 60-20 60-70 0-40-30-80-70-80" />
        <motion.path custom={3} variants={pathVariants} d="M380 350c40 0 70-30 70-70" />
        <motion.path custom={4} variants={pathVariants} d="M295 380c50 0 85-30 85-80" />

        {/* Central Connections (Synapses) - Fill uses currentColor */}
        <motion.circle custom={1} variants={circleVariants} cx="250" cy="150" r="20" fill="currentColor" stroke="none" />
        <motion.circle custom={2} variants={circleVariants} cx="250" cy="250" r="20" fill="currentColor" stroke="none" />
        <motion.circle custom={3} variants={circleVariants} cx="250" cy="350" r="20" fill="currentColor" stroke="none" />

        {/* Electric Spark Details */}
        <motion.path custom={5} variants={pathVariants} d="M250 150 L250 100" strokeWidth="30" />
        <motion.path custom={6} variants={pathVariants} d="M250 380 L250 420" strokeWidth="30" />
      </g>
    </motion.svg>
  );
}
