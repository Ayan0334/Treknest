import React, { useEffect, useRef } from 'react';

export default function SnowEffect() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const particleCount = 100;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 3 + 1.5, // radius 1.5px - 4.5px
        d: Math.random() * 50 + 10,
        speed: Math.random() * 1.5 + 0.5,
        wind: Math.random() * 0.8 - 0.4
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();

      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        ctx.moveTo(p.x, p.y);
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, true);

        // Movement
        p.y += p.speed;
        p.x += p.wind;

        // Reset if offscreen
        if (p.y > canvas.height) {
          particles[i] = {
            x: Math.random() * canvas.width,
            y: -10,
            r: p.r,
            d: p.d,
            speed: p.speed,
            wind: p.wind
          };
        }
        if (p.x > canvas.width) {
          p.x = 0;
        } else if (p.x < 0) {
          p.x = canvas.width;
        }
      }

      ctx.fill();
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
