import React from 'react';
import { cn } from '../../../../utils/cn';
import './ClaymorphismSwitch.css'; // Extracting styles to a CSS file to avoid clutter

interface ClaymorphismSwitchProps {
    checked: boolean;
    onChange: () => void;
    className?: string;
}

export function ClaymorphismSwitch({ checked, onChange, className }: ClaymorphismSwitchProps) {
    return (
        <div
            role="switch"
            aria-checked={checked}
            tabIndex={0}
            onClick={onChange}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onChange();
                }
            }}
            aria-label="Toggle between light and dark theme"
            className={cn("clay-switch focus:outline-none focus:ring-2 focus:ring-blue-400/50", className)}
        >
            {/* Background Rings */}
            <div className="sky-layer layer-2"></div>
            <div className="sky-layer layer-1"></div>

            {/* Stars (SVG) */}
            <svg className="stars-container" viewBox="0 0 200 90" xmlns="http://www.w3.org/2000/svg">
                {/* Mathematical 4-point stars */}
                <path className="star" d="M 40 25 Q 45 25 45 20 Q 45 25 50 25 Q 45 25 45 30 Q 45 25 40 25 Z" fill="#ffffff" />
                <path className="star" d="M 70 35 Q 73 35 73 32 Q 73 35 76 35 Q 73 35 73 38 Q 73 35 70 35 Z" fill="#ffffff" opacity="0.8"/>
                <path className="star" d="M 55 55 Q 57 55 57 53 Q 57 55 59 55 Q 57 55 57 57 Q 57 55 55 55 Z" fill="#ffffff" />
                <path className="star" d="M 85 20 Q 87 20 87 18 Q 87 20 89 20 Q 87 20 87 22 Q 87 20 85 20 Z" fill="#ffffff" opacity="0.6"/>
            </svg>

            {/* Clouds (SVG Layered) */}
            <svg className="clouds-container" viewBox="0 0 200 90" xmlns="http://www.w3.org/2000/svg">
                {/* Back layer (Adjusted to contrast well with bright sky) */}
                <path d="M 90 90 A 20 20 0 0 1 115 75 A 25 25 0 0 1 155 70 A 22 22 0 0 1 185 85 A 20 20 0 0 1 200 90 Z" fill="#e0f2fe" />
                {/* Front layer (White) */}
                <path d="M 70 95 A 22 22 0 0 1 105 80 A 26 26 0 0 1 150 78 A 24 24 0 0 1 190 85 A 20 20 0 0 1 210 95 Z" fill="#ffffff" />
            </svg>

            {/* The Thumb */}
            <div className="clay-thumb">
                {/* Craters */}
                <div className="crater crater-1"></div>
                <div className="crater crater-2"></div>
                <div className="crater crater-3"></div>
            </div>
        </div>
    );
}
