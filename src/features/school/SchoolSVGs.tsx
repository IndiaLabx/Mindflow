import React from 'react';
import { motion } from 'framer-motion';

export const DownloadSVG: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "w-full h-full"}>
            {/* Background Glow */}
            <circle cx="50" cy="50" r="45" fill="url(#bg-gradient-download)" opacity="0.3" />

            {/* Tray Background */}
            <path d="M 20 70 L 80 70 L 80 80 C 80 85 75 90 70 90 L 30 90 C 25 90 20 85 20 80 Z" fill="url(#tray-gradient)" opacity="0.8" />
            <path d="M 20 70 L 80 70 L 80 80 C 80 85 75 90 70 90 L 30 90 C 25 90 20 85 20 80 Z" stroke="url(#stroke-gradient-download)" strokeWidth="2" />

            {/* Bouncing Arrow Group */}
            <motion.g
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
                {/* Arrow Stem */}
                <rect x="44" y="20" width="12" height="35" rx="4" fill="url(#arrow-gradient)" />

                {/* Arrow Head */}
                <path d="M 35 50 L 50 70 L 65 50 Z" fill="url(#arrow-gradient)" />

                {/* Glow behind arrow */}
                <circle cx="50" cy="65" r="10" fill="#06b6d4" opacity="0.4" filter="blur(4px)" />
            </motion.g>

            {/* Downward swoosh lines */}
            <motion.path
                d="M 25 40 Q 35 60 40 60"
                stroke="#06b6d4"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.6"
                animate={{ pathLength: [0, 1, 0], opacity: [0, 0.6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            />
            <motion.path
                d="M 75 40 Q 65 60 60 60"
                stroke="#06b6d4"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.6"
                animate={{ pathLength: [0, 1, 0], opacity: [0, 0.6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            />

            <defs>
                <linearGradient id="bg-gradient-download" x1="0" y1="0" x2="100" y2="100">
                    <stop offset="0%" stopColor="#0891b2" />
                    <stop offset="100%" stopColor="#164e63" />
                </linearGradient>
                <linearGradient id="tray-gradient" x1="20" y1="70" x2="80" y2="90">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="arrow-gradient" x1="35" y1="20" x2="65" y2="70">
                    <stop offset="0%" stopColor="#a5f3fc" />
                    <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="stroke-gradient-download" x1="0" y1="0" x2="100" y2="100">
                    <stop offset="0%" stopColor="#67e8f9" />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity="0.5" />
                </linearGradient>
            </defs>
        </svg>
    );
};
