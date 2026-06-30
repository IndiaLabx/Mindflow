import React, { useEffect, useRef } from 'react';

/**
 * Interface representing a fireball object in the animation.
 */
interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

// Definition of the 10 specific styles requested
const BALL_STYLES = [
  // #fireball1
  { stops: ['#ffcc00', '#ff6600', '#cc3300', '#660000'], shadow: '#ffcc00' },
  // #fireball2
  { stops: ['#E0BBE4', '#957DAD', '#6A0DAD', '#301934'], shadow: '#E0BBE4' },
  // #fireball3
  { stops: ['#44ccff', '#0088ff', '#0044ee', '#000099'], shadow: '#44ccff' },
  // #fireball4
  { stops: ['#ccff44', '#88ff00', '#44ee00', '#009900'], shadow: '#ccff44' },
  // #fireball5
  { stops: ['#ff44cc', '#ff0088', '#ee0044', '#990000'], shadow: '#ff44cc' },
  // #fireball6
  { stops: ['#ffffff', '#dddddd', '#bbbbbb', '#888888'], shadow: '#ffffff' },
  // #fireball7
  { stops: ['#FFEB99', '#FFD700', '#DAA520', '#B8860B'], shadow: '#FFEB99' },
  // #fireball8
  { stops: ['#626199', '#003cff', '#00e6ee', '#00998c'], shadow: '#44ffc7' },
  // #fireball9
  { stops: ['#FF6347', '#DC143C', '#B22222', '#800000'], shadow: '#FF6347' },
  // #fireball10
  { stops: ['#C19A6B', '#A0522D', '#8B4513', '#5D4037'], shadow: '#C19A6B' },
];

/**
 * Animated background component rendering floating "fireballs" or glowing orbs.
 *
 * This component uses an HTML5 Canvas to render a physics-based simulation of colliding balls.
 * It is positioned as a fixed background layer with `zIndex: -1` to stay behind other content.
 * The simulation handles wall collisions and elastic collisions between balls.
 *
 * @returns {JSX.Element} A Canvas element rendering the animation.
 */
export const Fireballs: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let balls: Ball[] = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Initialize exactly 10 balls with unique styles
    const initBalls = () => {
      balls = [];
      for (let i = 0; i < 10; i++) {
        // Uniform size: Calculated as approx 35% larger than the previous average (~8px -> 11px)
        const radius = 11; 
        balls.push({
          id: i, // Maps directly to BALL_STYLES index
          x: Math.random() * (canvas.width - radius * 2) + radius,
          y: Math.random() * (canvas.height - radius * 2) + radius,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          radius: radius,
        });
      }
    };

    // The specific collision logic provided
    const handleFireballCollision_anim = (ball1: Ball, ball2: Ball) => {
      // Standard implementation based on centers:
      const dx = ball1.x - ball2.x;
      const dy = ball1.y - ball2.y;
      
      const distance = Math.sqrt(dx * dx + dy * dy);
      const sumOfRadii = ball1.radius + ball2.radius;

      if (distance < sumOfRadii && distance !== 0) {
        // Overlap resolution
        const overlap = sumOfRadii - distance;
        const nx = dx / distance;
        const ny = dy / distance;
        
        ball1.x += nx * overlap / 2;
        ball1.y += ny * overlap / 2;
        ball2.x -= nx * overlap / 2;
        ball2.y -= ny * overlap / 2;

        // Velocity exchange logic
        const tx = -ny;
        const ty = nx;
        
        const dpTan1 = ball1.vx * tx + ball1.vy * ty;
        const dpTan2 = ball2.vx * tx + ball2.vy * ty;
        
        const dpNorm1 = ball1.vx * nx + ball1.vy * ny;
        const dpNorm2 = ball2.vx * nx + ball2.vy * ny;
        
        const m1 = dpNorm2;
        const m2 = dpNorm1;
        
        ball1.vx = tx * dpTan1 + nx * m1;
        ball1.vy = ty * dpTan1 + ny * m1;
        ball2.vx = tx * dpTan2 + nx * m2;
        ball2.vy = ty * dpTan2 + ny * m2;
      }
    };

    const drawBall = (ball: Ball) => {
      if (!ctx) return;

      const style = BALL_STYLES[ball.id % BALL_STYLES.length];
      
      const gradient = ctx.createRadialGradient(
        ball.x, ball.y, 0,
        ball.x, ball.y, ball.radius
      );

      // Map the 4 stops
      style.stops.forEach((color, index) => {
        // Distribute stops: 0, 0.33, 0.66, 1
        const stopPos = index / (style.stops.length - 1);
        gradient.addColorStop(stopPos, color);
      });

      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      
      // Apply glow effect based on style
      ctx.shadowColor = style.shadow;
      ctx.shadowBlur = 15;
      
      ctx.fill();
      
      // Reset shadow for performance or next items
      ctx.shadowBlur = 0;
    };

    const update = () => {
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Update positions and wall collisions
      balls.forEach(ball => {
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Wall collision
        if (ball.x - ball.radius < 0) {
          ball.x = ball.radius;
          ball.vx = -ball.vx;
        }
        if (ball.x + ball.radius > canvas.width) {
          ball.x = canvas.width - ball.radius;
          ball.vx = -ball.vx;
        }
        if (ball.y - ball.radius < 0) {
          ball.y = ball.radius;
          ball.vy = -ball.vy;
        }
        if (ball.y + ball.radius > canvas.height) {
          ball.y = canvas.height - ball.radius;
          ball.vy = -ball.vy;
        }
      });

      // 2. Check Ball-to-Ball Collisions
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          handleFireballCollision_anim(balls[i], balls[j]);
        }
      }

      // 3. Draw
      balls.forEach(drawBall);

      animationFrameId = requestAnimationFrame(update);
    };

    resizeCanvas();
    initBalls();
    update();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
};
