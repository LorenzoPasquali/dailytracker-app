import React, { useRef, useEffect, useCallback } from 'react';

const PARTICLE_COUNT = 60;
const CONNECT_DISTANCE = 120;
const MOUSE_RADIUS = 140;
const BASE_SPEED = 0.3;

function createParticle(w, h) {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * BASE_SPEED,
    vy: (Math.random() - 0.5) * BASE_SPEED,
    r: Math.random() * 2 + 1.2,
    opacity: Math.random() * 0.35 + 0.25,
  };
}

export default function CssParticles() {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const particles = useRef([]);
  const raf = useRef(null);

  const init = useCallback((canvas) => {
    const w = canvas.width = canvas.offsetWidth;
    const h = canvas.height = canvas.offsetHeight;
    particles.current = Array.from({ length: PARTICLE_COUNT }, () => createParticle(w, h));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    init(canvas);

    const handleResize = () => init(canvas);
    window.addEventListener('resize', handleResize);

    const handleMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleMouseLeave = () => {
      mouse.current = { x: -9999, y: -9999 };
    };
    window.addEventListener('mousemove', handleMouse);
    window.addEventListener('mouseleave', handleMouseLeave);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const pts = particles.current;
      const mx = mouse.current.x;
      const my = mouse.current.y;

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];

        // Mouse repulse
        const dmx = p.x - mx;
        const dmy = p.y - my;
        const distMouse = Math.sqrt(dmx * dmx + dmy * dmy);
        if (distMouse < MOUSE_RADIUS && distMouse > 0) {
          const force = (MOUSE_RADIUS - distMouse) / MOUSE_RADIUS;
          const pushStrength = force * 1.2;
          p.vx += (dmx / distMouse) * pushStrength * 0.15;
          p.vy += (dmy / distMouse) * pushStrength * 0.15;
        }

        // Damping
        p.vx *= 0.985;
        p.vy *= 0.985;

        // Ensure minimum drift
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed < BASE_SPEED * 0.3) {
          p.vx += (Math.random() - 0.5) * 0.02;
          p.vy += (Math.random() - 0.5) * 0.02;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, 185, 129, ${p.opacity})`;
        ctx.fill();

        // Mouse proximity glow
        if (distMouse < MOUSE_RADIUS) {
          const glowOpacity = ((MOUSE_RADIUS - distMouse) / MOUSE_RADIUS) * 0.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r + 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(16, 185, 129, ${glowOpacity})`;
          ctx.fill();
        }

        // Connect nearby particles
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DISTANCE) {
            const lineOpacity = (1 - dist / CONNECT_DISTANCE) * 0.18;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${lineOpacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      raf.current = requestAnimationFrame(draw);
    };

    raf.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
