import React, { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  a: number;
  tw: number;
  ph: number;
  vx: number;
  vy: number;
  tint: "w" | "b" | "p";
};

type Bokeh = {
  x: number;
  y: number;
  r: number;
  a: number;
  vx: number;
  vy: number;
  tint: "c" | "t" | "p";
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function StarfieldHero() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let lastT = 0;

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const stars: Star[] = [];
    const bokeh: Bokeh[] = [];
    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const make = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const starCount = clamp(Math.floor((w * h) / 1200), 180, 520);
      const bokehCount = clamp(Math.floor((w * h) / 52000), 8, 18);

      stars.length = 0;
      bokeh.length = 0;

      for (let i = 0; i < starCount; i++) {
        const tintRand = Math.random();
        const tint: Star["tint"] = tintRand < 0.78 ? "w" : tintRand < 0.90 ? "b" : "p";
        stars.push({
          x: rand(0, w),
          y: rand(0, h),
          r: rand(0.6, 1.7),
          a: rand(0.35, 0.95),
          tw: rand(0.25, 0.9),
          ph: rand(0, Math.PI * 2),
          vx: rand(-0.02, 0.02),
          vy: rand(0.01, 0.05),
          tint
        });
      }

      for (let i = 0; i < bokehCount; i++) {
        const tintRand = Math.random();
        const tint: Bokeh["tint"] = tintRand < 0.5 ? "c" : tintRand < 0.8 ? "t" : "p";
        bokeh.push({
          x: rand(-80, w + 80),
          y: rand(-80, h + 80),
          r: rand(18, 64),
          a: rand(0.04, 0.09),
          vx: rand(-0.03, 0.03),
          vy: rand(-0.02, 0.03),
          tint
        });
      }
    };

    const drawBackground = () => {
      // Deep navy/purple gradient, like the reference.
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#07081f");
      g.addColorStop(0.55, "#070726");
      g.addColorStop(1, "#030616");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      drawBackground();

      // Bokeh first (behind stars).
      for (const b of bokeh) {
        let col = "rgba(56, 189, 248, 1)";
        if (b.tint === "t") col = "rgba(20, 184, 166, 1)";
        if (b.tint === "p") col = "rgba(167, 139, 250, 1)";

        ctx.save();
        ctx.globalAlpha = b.a;
        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Stars.
      for (const s of stars) {
        const tw = (Math.sin(t * 0.0012 * s.tw + s.ph) + 1) * 0.5; // 0..1
        const a = clamp(s.a * (0.55 + 0.65 * tw), 0.08, 1);

        let col = `rgba(255,255,255,${a})`;
        if (s.tint === "b") col = `rgba(147,197,253,${a})`;
        if (s.tint === "p") col = `rgba(196,181,253,${a})`;

        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Subtle vignette.
      const vg = ctx.createRadialGradient(w * 0.5, h * 0.15, 0, w * 0.5, h * 0.25, Math.max(w, h) * 0.8);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
    };

    const step = (t: number) => {
      const dt = lastT ? Math.min(60, t - lastT) : 16;
      lastT = t;
      const f = dt / 16;

      // Move bokeh slowly.
      for (const b of bokeh) {
        b.x += b.vx * f * 3;
        b.y += b.vy * f * 3;
        if (b.x < -120) b.x = w + 120;
        if (b.x > w + 120) b.x = -120;
        if (b.y < -120) b.y = h + 120;
        if (b.y > h + 120) b.y = -120;
      }

      // Drift stars.
      for (const s of stars) {
        s.x += s.vx * f * 4;
        s.y += s.vy * f * 6;
        if (s.x < -10) s.x = w + 10;
        if (s.x > w + 10) s.x = -10;
        if (s.y < -10) s.y = h + 10;
        if (s.y > h + 10) s.y = -10;
      }

      draw(t);
      raf = window.requestAnimationFrame(step);
    };

    const onResize = () => {
      make();
      draw(0);
    };

    window.addEventListener("resize", onResize);
    make();
    draw(0);

    if (!prefersReducedMotion) raf = window.requestAnimationFrame(step);

    return () => {
      window.removeEventListener("resize", onResize);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
