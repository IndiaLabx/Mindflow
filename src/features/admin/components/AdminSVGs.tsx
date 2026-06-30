import React from 'react';
import { motion } from 'framer-motion';

export const AdminSVG: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "w-full h-full"}>
            {/* Background Glow */}
            <circle cx="50" cy="50" r="45" fill="url(#bg-gradient-admin)" opacity="0.3" />

            {/* Shield Base */}
            <motion.path
                d="M 50 10 L 20 25 L 20 50 C 20 75 40 90 50 95 C 60 90 80 75 80 50 L 80 25 Z"
                fill="url(#shield-gradient)"
                opacity="0.8"
                initial={{ scale: 0.9 }}
                animate={{ scale: [0.9, 1.05, 1] }}
                transition={{ duration: 1, ease: "easeOut" }}
            />
            <path d="M 50 10 L 20 25 L 20 50 C 20 75 40 90 50 95 C 60 90 80 75 80 50 L 80 25 Z" stroke="url(#stroke-gradient-admin)" strokeWidth="2" />

            {/* Glowing Gear Center */}
            <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                style={{ originX: "50px", originY: "50px" }}
            >
                <path d="M 55 40 L 60 40 L 62 45 L 67 47 L 70 43 L 75 46 L 72 50 L 73 55 L 78 58 L 75 63 L 70 60 L 65 64 L 63 69 L 58 68 L 55 64 L 50 67 L 45 64 L 42 68 L 37 69 L 35 64 L 30 60 L 25 63 L 22 58 L 27 55 L 28 50 L 25 46 L 30 43 L 33 47 L 38 45 L 40 40 L 45 40 L 47 44 L 52 44 Z" fill="url(#gear-gradient)" />
                <circle cx="50" cy="54" r="8" fill="#1e293b" />
            </motion.g>

            {/* Inner Star/Crown */}
            <motion.path
                d="M 50 48 L 53 58 L 62 55 L 56 63 L 60 72 L 50 67 L 40 72 L 44 63 L 38 55 L 47 58 Z"
                fill="#f59e0b"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
            />

            <defs>
                <linearGradient id="bg-gradient-admin" x1="0" y1="0" x2="100" y2="100">
                    <stop offset="0%" stopColor="#b91c1c" />
                    <stop offset="100%" stopColor="#450a0a" />
                </linearGradient>
                <linearGradient id="shield-gradient" x1="20" y1="10" x2="80" y2="95">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="gear-gradient" x1="25" y1="40" x2="75" y2="70">
                    <stop offset="0%" stopColor="#fca5a5" />
                    <stop offset="100%" stopColor="#b91c1c" />
                </linearGradient>
                <linearGradient id="stroke-gradient-admin" x1="0" y1="0" x2="100" y2="100">
                    <stop offset="0%" stopColor="#fca5a5" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.5" />
                </linearGradient>
            </defs>
        </svg>
    );
};
