import React, { useCallback } from 'react';
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

export default function ParticlesBackground({ variant = 'default' }) {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const isInteractive = variant === 'home' || variant === 'login';

  const options = {
    background: {
      color: { value: "#0d1117" },
    },
    fpsLimit: 144,
    particles: {
      color: { value: "#475569" }, // More subtle slate
      links: {
        color: "#94a3b8", // Subdued slate-blue link
        distance: 150,
        enable: isInteractive,
        opacity: 0.6,
        width: 1,
      },
      move: {
        direction: "none",
        enable: true,
        outModes: { default: "bounce" },
        random: false,
        speed: variant === 'home' ? 1 : (variant === 'login' ? 0.7 : 0.3),
        straight: false,
      },
      number: {
        density: { enable: true, area: 800 },
        value: variant === 'home' ? 80 : (variant === 'login' ? 60 : 30),
      },
      opacity: {
        value: variant === 'home' ? 0.2 : (variant === 'login' ? 0.3 : 0.1),
      },
      shape: { type: "circle" },
      size: {
        value: { min: 1, max: isInteractive ? 3 : 2 }
      },
    },
    detectRetina: true,
  };

  if (isInteractive) {
    options.interactivity = {
      events: {
        onHover: { enable: true, mode: "repulse" },
        resize: true,
      },
      modes: {
        repulse: { distance: 100, duration: 0.4 },
      },
    }
  }

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
      <Particles
        id={`tsparticles-${variant}`}
        init={particlesInit}
        options={options}
      />

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '60%',
        background: 'linear-gradient(to top, rgba(59, 130, 246, 0.12) 0%, rgba(13, 17, 23, 0) 100%)', // Subtle slate blue bottom glow for Dashboard
        pointerEvents: 'none'
      }} />
    </div>
  );
}