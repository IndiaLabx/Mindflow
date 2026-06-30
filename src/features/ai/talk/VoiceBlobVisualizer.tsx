import React, { useEffect, useRef } from 'react';

interface VoiceBlobVisualizerProps {
    userAnalyser: AnalyserNode | null;
    aiAnalyser: AnalyserNode | null;
    agentState: 'idle' | 'listening' | 'speaking';
    connectionState: 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';
    isMuted: boolean;
}

export const VoiceBlobVisualizer: React.FC<VoiceBlobVisualizerProps> = ({
    userAnalyser,
    aiAnalyser,
    agentState,
    connectionState,
    isMuted
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Blob properties
        let angle = 0;
        let scale = 1;
        const baseRadius = 60;
        const numPoints = 120; // Resolution of the circle

        const animate = () => {
            animationRef.current = requestAnimationFrame(animate);

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            // Determine which analyser to read from
            let activeAnalyser = null;
            let color = 'rgba(16, 185, 129, 0.5)'; // Emerald for listening/idle
            let shadowColor = 'rgba(16, 185, 129, 0.8)';

            // If disconnected/connecting but userAnalyser exists, show pre-connect mic level
            if (connectionState !== 'connected' && connectionState !== 'connecting') {
                activeAnalyser = userAnalyser;
                color = 'rgba(120, 113, 108, 0.3)'; // Stone for idle pre-connect
                shadowColor = 'rgba(120, 113, 108, 0.6)';
            } else if (connectionState === 'connected') {
                if (agentState === 'speaking') {
                    activeAnalyser = aiAnalyser;
                    color = 'rgba(99, 102, 241, 0.6)'; // Indigo for AI speaking
                    shadowColor = 'rgba(99, 102, 241, 0.9)';
                } else {
                    activeAnalyser = isMuted ? null : userAnalyser;
                    if (isMuted) {
                        color = 'rgba(239, 68, 68, 0.3)'; // Red
                        shadowColor = 'rgba(239, 68, 68, 0.6)';
                    }
                }
            } else if (connectionState === 'connecting') {
                color = 'rgba(245, 158, 11, 0.5)'; // Amber
                shadowColor = 'rgba(245, 158, 11, 0.8)';
            }

            let dataArray = new Uint8Array(0);
            if (activeAnalyser) {
                dataArray = new Uint8Array(activeAnalyser.frequencyBinCount);
                // We use TimeDomainData for a smoother wave, but FrequencyData is more reactive.
                // Let's use frequency data to modify the radius
                activeAnalyser.getByteFrequencyData(dataArray);
            }

            ctx.save();
            ctx.translate(centerX, centerY);

            // Slow continuous rotation
            angle += (agentState === 'speaking' ? 0.02 : 0.005);
            ctx.rotate(angle);

            ctx.beginPath();

            for (let i = 0; i < numPoints; i++) {
                // Map i to an angle
                const theta = (i / numPoints) * Math.PI * 2;

                // Get audio displacement
                let displacement = 0;
                if (dataArray.length > 0) {
                    // map the point index to an index in the frequency array
                    const freqIndex = Math.floor((i / numPoints) * (dataArray.length / 2)); // Use lower half of frequencies
                    const value = dataArray[freqIndex] || 0;
                    // Boost displacement
                    displacement = (value / 255) * 40;
                }

                // Add organic noise (sine waves)
                const noise1 = Math.sin(theta * 3 + angle * 2) * 5;
                const noise2 = Math.cos(theta * 5 - angle) * 3;

                const r = baseRadius + displacement + noise1 + noise2;

                const x = Math.cos(theta) * r;
                const y = Math.sin(theta) * r;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    // We could use quadratic curve to smooth, but high numPoints is usually enough
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();

            // Styling
            ctx.fillStyle = color;
            ctx.shadowBlur = 30;
            ctx.shadowColor = shadowColor;
            ctx.fill();

            // Inner Ring
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.stroke();

            ctx.restore();
        };

        animate();

        return () => cancelAnimationFrame(animationRef.current);
    }, [userAnalyser, aiAnalyser, agentState, connectionState, isMuted]);

    return (
        <canvas
            ref={canvasRef}
            width={300}
            height={300}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-80 mix-blend-screen"
        />
    );
};
