import React, { useEffect, useRef, useState } from 'react';

const TOTAL_WORDS = 1345;
const CX = 400;
const CY = 225;
const CIRCLE_RADIUS = 110;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

const nodeWords = [
    "eloquent", "profound", "articulate", "nuanced", "evocative",
    "authentic", "genuine", "ethereal", "vivid", "original",
    "intricate", "poignant", "sublime", "elaborate", "sophisticated",
    "illuminate", "corroborate", "substantiate", "resonate",
    "optimize", "enhance", "refine", "perfect", "transcend"
];

const centralHooks = [
    "Weaving", "Refining", "Curating", "Polishing", "Enriching", "Crafting"
];

class SynonymNode {
    angle: number;
    targetRadius: number;
    radius: number;
    speed: number;
    word: string;
    life: number;
    decay: number;
    line: SVGLineElement;
    textGroup: SVGGElement;
    dot: SVGCircleElement;
    text: SVGTextElement;

    constructor(connectionsLayer: SVGGElement, nodesLayer: SVGGElement) {
        this.angle = Math.random() * Math.PI * 2;
        this.targetRadius = 160 + Math.random() * 80;
        this.radius = CIRCLE_RADIUS + 5;
        this.speed = 1 + Math.random() * 1.5;
        this.word = nodeWords[Math.floor(Math.random() * nodeWords.length)];
        this.life = 1.0;
        this.decay = 0.004 + Math.random() * 0.006;

        this.line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        this.line.setAttribute("stroke-width", "1.5");
        this.line.setAttribute("stroke-dasharray", "2 4");
        // We'll use CSS classes to handle color for dark/light mode
        this.line.setAttribute("class", "stroke-violet-400/40 dark:stroke-violet-400/50");
        connectionsLayer.appendChild(this.line);

        this.textGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

        this.dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        this.dot.setAttribute("r", "3.5");
        this.dot.setAttribute("class", "fill-cyan-500 dark:fill-cyan-400");

        this.text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        this.text.textContent = this.word;
        this.text.setAttribute("class", "font-sans text-sm font-medium fill-violet-900 dark:fill-violet-200 transition-opacity duration-400");

        const isLeftSide = Math.cos(this.angle) < 0;
        this.text.setAttribute("text-anchor", isLeftSide ? "end" : "start");
        this.text.setAttribute("dx", isLeftSide ? "-10" : "10");
        this.text.setAttribute("dy", "4");

        this.textGroup.appendChild(this.dot);
        this.textGroup.appendChild(this.text);
        nodesLayer.appendChild(this.textGroup);
    }

    update() {
        const time = Date.now() * 0.001;
        const wobble = Math.sin(time + this.angle) * 5;

        if (this.radius < this.targetRadius) {
            this.radius += (this.targetRadius - this.radius) * 0.04;
        }

        this.life -= this.decay;

        const currentDist = this.radius + wobble;
        const x = CX + Math.cos(this.angle) * currentDist;
        const y = CY + Math.sin(this.angle) * currentDist;

        const startX = CX + Math.cos(this.angle) * (CIRCLE_RADIUS + 2);
        const startY = CY + Math.sin(this.angle) * (CIRCLE_RADIUS + 2);

        this.line.setAttribute("x1", startX.toFixed(2));
        this.line.setAttribute("y1", startY.toFixed(2));
        this.line.setAttribute("x2", x.toFixed(2));
        this.line.setAttribute("y2", y.toFixed(2));
        this.line.style.opacity = (this.life * 0.6).toString();

        this.textGroup.setAttribute("transform", `translate(${x.toFixed(2)}, ${y.toFixed(2)})`);
        this.textGroup.style.opacity = this.life.toString();

        return this.life > 0;
    }

    destroy() {
        this.line.remove();
        this.textGroup.remove();
    }
}

export const SynapticLoader: React.FC = () => {
    const connectionsRef = useRef<SVGGElement>(null);
    const nodesRef = useRef<SVGGElement>(null);
    const progressCircleRef = useRef<SVGCircleElement>(null);

    const [centerWord, setCenterWord] = useState(centralHooks[0]);
    const [isWordVisible, setIsWordVisible] = useState(true);


    // Animation frame and intervals refs
    const requestRef = useRef<number>(0);
    const activeNodes = useRef<SynonymNode[]>([]);
    const hookIndex = useRef(0);
    const currentLoadedRef = useRef(0);

    // Render loop for nodes
    const renderLoop = () => {
        if (!connectionsRef.current || !nodesRef.current) return;

        activeNodes.current = activeNodes.current.filter(node => {
            if (!node.update()) {
                node.destroy();
                return false;
            }
            return true;
        });

        // We use a continuous loop for loading state, so we just check if it's less than TOTAL_WORDS (which it won't exceed since it resets or we don't care about total words limit in indeterminate mode)
        // Let's cap currentLoaded for node generation logic at TOTAL_WORDS just in case
        if (activeNodes.current.length < 12 && Math.random() > 0.6) {
            activeNodes.current.push(new SynonymNode(connectionsRef.current, nodesRef.current));
        }

        requestRef.current = requestAnimationFrame(renderLoop);
    };

    // Cycle center word
    useEffect(() => {
        const wordInterval = setInterval(() => {
            setIsWordVisible(false);
            setTimeout(() => {
                hookIndex.current = (hookIndex.current + 1) % centralHooks.length;
                setCenterWord(centralHooks[hookIndex.current]);
                setIsWordVisible(true);
            }, 400); // Wait for fade out
        }, 2500);

        return () => clearInterval(wordInterval);
    }, []);

    // Loop indeterminate progress
    useEffect(() => {
        let isCancelled = false;

        const simulateProgress = () => {
            if (isCancelled) return;

            // Loop from 0 to TOTAL_WORDS repeatedly
            if (currentLoadedRef.current >= TOTAL_WORDS) {
                currentLoadedRef.current = 0;
            }

            const chunk = Math.floor(Math.random() * 80) + 20;
            currentLoadedRef.current += chunk;
            if (currentLoadedRef.current > TOTAL_WORDS) {
                currentLoadedRef.current = TOTAL_WORDS;
            }



            if (progressCircleRef.current) {
                const percentComplete = currentLoadedRef.current / TOTAL_WORDS;
                const offset = CIRCUMFERENCE - (percentComplete * CIRCUMFERENCE);
                progressCircleRef.current.style.strokeDashoffset = offset.toString();
            }

            setTimeout(simulateProgress, Math.random() * 350 + 200);
        };

        const initTimer = setTimeout(() => {
            requestRef.current = requestAnimationFrame(renderLoop);
            simulateProgress();
        }, 600);

        return () => {
            isCancelled = true;
            clearTimeout(initTimer);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            // Cleanup nodes
            activeNodes.current.forEach(node => node.destroy());
            activeNodes.current = [];
        };
    }, []);

    return (
        <div className="flex flex-col h-full bg-indigo-50 dark:bg-zinc-950 text-indigo-950 dark:text-indigo-100 p-4 md:p-8 items-center justify-center transition-colors duration-500 overflow-hidden relative">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-violet-500/5 dark:bg-violet-400/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-cyan-500/5 dark:bg-cyan-400/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="bg-white/85 dark:bg-[#0f0c29]/65 backdrop-blur-2xl border border-indigo-600/10 dark:border-indigo-500/15 shadow-[0_25px_50px_-12px_rgba(79,70,229,0.15)] dark:shadow-[0_30px_60px_-10px_rgba(0,0,0,0.9)] rounded-[32px] w-full max-w-[800px] relative p-8 md:p-12 z-10 flex flex-col mx-4">

                {/* Header HUD */}
                <div className="flex justify-between items-start mb-2 relative z-10">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-indigo-600 dark:text-indigo-500">
                            Curating Lexicon
                        </h1>
                        <p className="text-sm mt-1 flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
                            <span className="inline-block w-2 h-2 rounded-full animate-pulse bg-indigo-600 dark:bg-indigo-500"></span>
                            <span>Discovering nuances</span>
                        </p>
                    </div>
                </div>

                {/* Dynamic SVG Canvas */}
                <div className="w-full h-[500px] md:h-[600px] relative z-10">
                    <svg viewBox="0 0 800 450" className="w-full h-full absolute inset-0 overflow-visible">
                        <defs>
                            <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="currentColor" className="text-cyan-500 dark:text-cyan-400" />
                                <stop offset="50%" stopColor="currentColor" className="text-indigo-600 dark:text-indigo-500" />
                                <stop offset="100%" stopColor="currentColor" className="text-violet-500 dark:text-violet-400" />
                            </linearGradient>
                            <linearGradient id="successGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="currentColor" className="text-emerald-500 dark:text-emerald-400" />
                                <stop offset="100%" stopColor="#059669" />
                            </linearGradient>

                            <filter id="core-glow-filter" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="20" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>

                        {/* Ambient Orbital Rings */}
                        <circle cx="400" cy="225" r="160" fill="none" className="stroke-indigo-600/10 dark:stroke-indigo-500/15 animate-[spin_25s_linear_infinite]" strokeWidth="1" strokeDasharray="4 12" style={{ transformOrigin: '400px 225px', transform: 'scale(1.8)' }} />
                        <circle cx="400" cy="225" r="220" fill="none" className="stroke-indigo-600/10 dark:stroke-indigo-500/15 animate-[spin_40s_linear_infinite_reverse]" strokeWidth="1.5" strokeDasharray="20 20" style={{ transformOrigin: '400px 225px', transform: 'scale(1.8)' }} />

                        {/* Dynamic Connections and Nodes Layer */}
                        <g ref={connectionsRef} style={{ transformOrigin: '400px 225px', transform: 'scale(1.8)' }}></g>
                        <g ref={nodesRef} style={{ transformOrigin: '400px 225px', transform: 'scale(1.8)' }}></g>

                        {/* THE CENTRAL HUB */}
                        <g style={{ filter: 'drop-shadow(0 0 40px rgba(99, 102, 241, 0.2))', transformOrigin: '400px 225px', transform: 'scale(1.8)' }}>
                            {/* Background Circle */}
                            <circle cx="400" cy="225" r="110" className="fill-white/85 dark:fill-[#0f0c29]/65 stroke-indigo-600/10 dark:stroke-indigo-500/15" strokeWidth="1" />

                            {/* CIRCULAR PROGRESS BAR (Track) */}
                            <circle cx="400" cy="225" r="110" fill="none" className="stroke-indigo-600/10 dark:stroke-indigo-500/15" strokeWidth="8" />

                            {/* CIRCULAR PROGRESS BAR (Fill) */}
                            <circle
                                ref={progressCircleRef}
                                cx="400" cy="225" r="110" fill="none"
                                stroke="url(#progressGrad)" strokeWidth="8" strokeLinecap="round"
                                strokeDasharray={CIRCUMFERENCE}
                                strokeDashoffset={CIRCUMFERENCE}
                                className="transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                style={{ transform: 'rotate(-90deg)', transformOrigin: '400px 225px' }}
                            />

                            {/* 3x Sized Dynamic Center Word */}
                            <text
                                x="400" y="215"
                                className={`font-serif text-[46px] italic font-semibold fill-indigo-950 dark:fill-indigo-100 transition-opacity duration-400 ${isWordVisible ? 'opacity-100' : 'opacity-0'}`}
                                dominantBaseline="middle" textAnchor="middle"
                            >
                                {centerWord}
                            </text>

                            {/* Subtext Counter directly inside the circle */}
                            <text
                                x="400" y="255"
                                className="font-sans text-sm font-medium fill-indigo-500 dark:fill-indigo-400 tracking-[1px]"
                                dominantBaseline="middle" textAnchor="middle"
                            >
                                <tspan className="animate-pulse">Loading...</tspan>
                            </text>
                        </g>
                    </svg>
                </div>
            </div>
        </div>
    );
};
