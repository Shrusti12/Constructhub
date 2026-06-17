import React, { useEffect, useRef } from "react";

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;

    const particles: Array<{ x: number; y: number; vx: number; vy: number }> = [];

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetCount = Math.max(24, Math.min(90, Math.floor((w * h) / 28000)));
      particles.length = 0;
      for (let i = 0; i < targetCount; i++) {
        particles.push({
          x: rand(0, w),
          y: rand(0, h),
          vx: rand(-0.22, 0.22),
          vy: rand(-0.18, 0.18)
        });
      }
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      // Subtle particles and connection lines (blueprint vibe).
      const maxDist = Math.max(140, Math.min(220, Math.floor(Math.min(w, h) * 0.22)));

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
      }

      // Lines
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > maxDist) continue;
          const alpha = (1 - dist / maxDist) * 0.20;
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // Points
      for (const p of particles) {
        ctx.fillStyle = "rgba(20, 184, 166, 0.35)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = window.requestAnimationFrame(tick);
    };

    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    resize();
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", onResize);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="animated-bg pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="animated-bg__gradient absolute inset-0" />
      <div className="animated-bg__grid absolute inset-0" />
      <canvas ref={canvasRef} className="animated-bg__canvas absolute inset-0" />
      <div className="animated-bg__scan absolute inset-0" />
      <div className="animated-bg__vignette absolute inset-0" />
    </div>
  );
}
