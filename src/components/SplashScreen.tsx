"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./SplashScreen.css";

/* ── Constants ────────────────────────────────────────────────────────── */

const TOTAL_DUR = 8000;
const STAR_COUNT = 350;
const TRAIL_LEN = 6;
const MANNEQUIN_HW_RATIO = 0.33;

/* ── Helpers ──────────────────────────────────────────────────────────── */

function clamp01(t: number) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}
function easeOutExpo(t: number) {
  return 1 - Math.pow(2, -10 * clamp01(t));
}
function easeInOutCubic(t: number) {
  const c = clamp01(t);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function rgba(r: number, g: number, b: number, a: number) {
  return `rgba(${r},${g},${b},${clamp01(a).toFixed(4)})`;
}

/* ── Types ────────────────────────────────────────────────────────────── */

type Star = { x: number; y: number; r: number; phase: number; speed: number };

type Particle = {
  sx: number; sy: number;   // start (near ship)
  ex: number; ey: number;   // earth area
  cx: number; cy: number;   // center (convergence)
  tx: number; ty: number;   // target (mannequin)
  x: number; y: number;     // current
  color: string;
  size: number;
  delay: number;
  trailX: Float64Array;
  trailY: Float64Array;
};

type Scene = {
  W: number; H: number;
  shipX: number; shipY: number;
  earthX0: number; earthY0: number;
  centerX: number; centerY: number;
  mannequinBottom: number;
  stars: Star[];
  particles: Particle[];
};

/* ── Scene creation ───────────────────────────────────────────────────── */

function createScene(W: number, H: number, targets: number[][]): Scene {
  const shipX = W * 0.73;
  const shipY = H * 0.17;
  const earthX0 = W * 0.25;
  const earthY0 = H * 0.75;

  const mH = H * 0.55;
  const mW = mH * MANNEQUIN_HW_RATIO;
  const mLeft = (W - mW) / 2;
  const mTop = H * 0.12;
  const centerX = W / 2;
  const centerY = mTop + mH / 2;

  const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 0.4 + Math.random() * 1.4,
    phase: Math.random() * Math.PI * 2,
    speed: 0.5 + Math.random() * 2,
  }));

  const particles: Particle[] = targets.map(([nx, ny]) => {
    const tx = mLeft + nx * mW;
    const ty = mTop + ny * mH;
    return {
      sx: shipX + (Math.random() - 0.5) * 30,
      sy: shipY + (Math.random() - 0.5) * 30,
      ex: earthX0 + (Math.random() - 0.5) * 40,
      ey: earthY0 + (Math.random() - 0.5) * 40,
      cx: centerX + (Math.random() - 0.5) * 20,
      cy: centerY + (Math.random() - 0.5) * 20,
      tx, ty,
      x: shipX, y: shipY,
      color: Math.random() < 0.7 ? "#fbbf24" : "#f59e0b",
      size: 0.8 + Math.random() * 1.7,
      delay: Math.random() * 500,
      trailX: new Float64Array(TRAIL_LEN).fill(shipX),
      trailY: new Float64Array(TRAIL_LEN).fill(shipY),
    };
  });

  return {
    W, H, shipX, shipY, earthX0, earthY0, centerX, centerY,
    mannequinBottom: mTop + mH,
    stars, particles,
  };
}

/* ── Drawing: stars ───────────────────────────────────────────────────── */

function drawStars(ctx: CanvasRenderingContext2D, stars: Star[], elapsed: number, alpha: number) {
  if (alpha < 0.01) return;
  for (const s of stars) {
    const b = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(elapsed * 0.001 * s.speed + s.phase));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = rgba(255, 255, 255, b * alpha);
    ctx.fill();
  }
}

/* ── Drawing: ship (Imperial-style, 3/4 rear) ─────────────────────────── */

function drawShip(ctx: CanvasRenderingContext2D, x: number, y: number, sc: number, alpha: number) {
  if (alpha < 0.005) return;
  ctx.save();
  ctx.translate(x, y);

  // Halo
  const hg = ctx.createRadialGradient(0, 0, 4 * sc, 0, 0, 95 * sc);
  hg.addColorStop(0, rgba(100, 150, 255, alpha * 0.1));
  hg.addColorStop(1, rgba(100, 150, 255, 0));
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(0, 0, 95 * sc, 0, Math.PI * 2);
  ctx.fill();

  // Hull
  ctx.beginPath();
  ctx.moveTo(-80 * sc, -10 * sc);
  ctx.lineTo(40 * sc, -30 * sc);
  ctx.lineTo(50 * sc, 10 * sc);
  ctx.lineTo(30 * sc, 40 * sc);
  ctx.lineTo(-40 * sc, 20 * sc);
  ctx.closePath();
  ctx.fillStyle = rgba(45, 50, 65, alpha);
  ctx.fill();

  // Panel lines
  ctx.strokeStyle = rgba(75, 80, 100, alpha * 0.6);
  ctx.lineWidth = 0.5 * sc;
  ctx.beginPath();
  ctx.moveTo(-60 * sc, -5 * sc); ctx.lineTo(35 * sc, -20 * sc);
  ctx.moveTo(-50 * sc, 5 * sc); ctx.lineTo(40 * sc, -5 * sc);
  ctx.moveTo(-30 * sc, 12 * sc); ctx.lineTo(35 * sc, 15 * sc);
  ctx.moveTo(-70 * sc, 0); ctx.lineTo(-20 * sc, -8 * sc);
  ctx.stroke();

  // Bridge
  ctx.beginPath();
  ctx.moveTo(5 * sc, -15 * sc);
  ctx.lineTo(22 * sc, -20 * sc);
  ctx.lineTo(24 * sc, -10 * sc);
  ctx.lineTo(3 * sc, -5 * sc);
  ctx.closePath();
  ctx.fillStyle = rgba(55, 60, 78, alpha);
  ctx.fill();
  ctx.strokeStyle = rgba(90, 95, 110, alpha * 0.5);
  ctx.lineWidth = 0.4 * sc;
  ctx.stroke();

  // Nav lights
  ctx.beginPath();
  ctx.arc(-72 * sc, -8 * sc, 1.8 * sc, 0, Math.PI * 2);
  ctx.fillStyle = rgba(255, 60, 60, alpha);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-72 * sc, -8 * sc, 5 * sc, 0, Math.PI * 2);
  ctx.fillStyle = rgba(255, 60, 60, alpha * 0.15);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(43 * sc, -27 * sc, 1.5 * sc, 0, Math.PI * 2);
  ctx.fillStyle = rgba(60, 120, 255, alpha);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(43 * sc, -27 * sc, 4 * sc, 0, Math.PI * 2);
  ctx.fillStyle = rgba(60, 120, 255, alpha * 0.12);
  ctx.fill();

  ctx.restore();
}

/* ── Drawing: Earth ───────────────────────────────────────────────────── */

function drawEarth(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, radius: number, alpha: number,
) {
  if (alpha < 0.005 || radius < 1) return;

  // Atmosphere glow
  const ag = ctx.createRadialGradient(x, y, radius * 0.9, x, y, radius * 1.3);
  ag.addColorStop(0, rgba(100, 180, 255, alpha * 0.3));
  ag.addColorStop(1, rgba(100, 180, 255, 0));
  ctx.fillStyle = ag;
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.3, 0, Math.PI * 2);
  ctx.fill();

  // Ocean
  const og = ctx.createRadialGradient(
    x - radius * 0.3, y - radius * 0.3, radius * 0.05,
    x, y, radius,
  );
  og.addColorStop(0, rgba(70, 160, 255, alpha));
  og.addColorStop(0.6, rgba(30, 100, 220, alpha));
  og.addColorStop(1, rgba(10, 50, 150, alpha));
  ctx.fillStyle = og;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Continents
  ctx.fillStyle = rgba(34, 140, 80, alpha * 0.55);
  ctx.beginPath();
  ctx.arc(x + radius * 0.1, y - radius * 0.2, radius * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + radius * 0.05, y + radius * 0.15, radius * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - radius * 0.35, y - radius * 0.1, radius * 0.18, 0, Math.PI * 2);
  ctx.fill();
}

/* ── Drawing: France satellite view ───────────────────────────────────── */

function drawFrance(ctx: CanvasRenderingContext2D, W: number, H: number, progress: number, elapsed: number) {
  const a = easeInOutCubic(progress);
  if (a < 0.005) return;

  // Green terrain
  ctx.fillStyle = rgba(25, 60, 20, a);
  ctx.fillRect(0, 0, W, H);

  // Field patches
  ctx.fillStyle = rgba(38, 85, 32, a * 0.7);
  for (let i = 0; i < 12; i++) {
    ctx.fillRect(
      W * (0.15 + i * 0.06),
      H * (0.25 + (i % 4) * 0.13),
      W * 0.07, H * 0.05,
    );
  }

  // Roads
  ctx.strokeStyle = rgba(200, 180, 140, a * 0.4);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W * 0.08, H * 0.4); ctx.lineTo(W * 0.92, H * 0.45);
  ctx.moveTo(W * 0.3, H * 0.18); ctx.lineTo(W * 0.34, H * 0.82);
  ctx.moveTo(W * 0.62, H * 0.14); ctx.lineTo(W * 0.57, H * 0.86);
  ctx.stroke();

  // Adour river
  ctx.strokeStyle = rgba(60, 130, 200, a * 0.6);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W * 0.12, H * 0.55);
  ctx.quadraticCurveTo(W * 0.38, H * 0.48, W * 0.5, H * 0.57);
  ctx.quadraticCurveTo(W * 0.62, H * 0.63, W * 0.88, H * 0.6);
  ctx.stroke();

  // Dax point + radar
  const daxX = W * 0.5;
  const daxY = H * 0.55;
  const daxA = clamp01((progress - 0.25) / 0.3);

  if (daxA > 0.01) {
    for (let ring = 0; ring < 3; ring++) {
      const rp = ((elapsed * 0.0008 + ring * 0.33) % 1);
      const rr = 10 + rp * 55;
      ctx.beginPath();
      ctx.arc(daxX, daxY, rr, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(249, 115, 22, (1 - rp) * daxA * 0.5);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(daxX, daxY, 4, 0, Math.PI * 2);
    ctx.fillStyle = rgba(249, 115, 22, daxA);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(daxX, daxY, 9, 0, Math.PI * 2);
    ctx.fillStyle = rgba(249, 115, 22, daxA * 0.25);
    ctx.fill();

    const la = clamp01((progress - 0.5) / 0.25);
    if (la > 0.01) {
      ctx.font = "bold 13px sans-serif";
      ctx.fillStyle = rgba(255, 255, 255, la * 0.9);
      ctx.textAlign = "left";
      ctx.fillText("Dax", daxX + 14, daxY + 5);
    }
  }
}

/* ── Drawing: ground scene ────────────────────────────────────────────── */

function drawGround(ctx: CanvasRenderingContext2D, W: number, H: number, progress: number) {
  const a = easeInOutCubic(progress);
  if (a < 0.005) return;

  // Sky
  const sg = ctx.createLinearGradient(0, 0, 0, H * 0.55);
  sg.addColorStop(0, rgba(8, 12, 25, a));
  sg.addColorStop(1, rgba(15, 25, 40, a));
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, W, H * 0.55);

  // Ground
  ctx.fillStyle = rgba(20, 50, 15, a);
  ctx.fillRect(0, H * 0.55, W, H * 0.45);

  // Road
  ctx.strokeStyle = rgba(80, 80, 70, a * 0.5);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.62);
  ctx.lineTo(W, H * 0.6);
  ctx.stroke();

  // Buildings (deterministic windows)
  const blds = [
    [0.15, 0.38, 0.08, 0.17],
    [0.28, 0.40, 0.12, 0.15],
    [0.55, 0.36, 0.10, 0.19],
    [0.75, 0.42, 0.09, 0.13],
  ];
  for (let bi = 0; bi < blds.length; bi++) {
    const [bx, by, bw, bh] = blds[bi];
    ctx.fillStyle = rgba(20, 22, 30, a);
    ctx.fillRect(W * bx, H * by, W * bw, H * bh);

    const cols = Math.floor((W * bw - 8) / 8);
    const rows = Math.floor((H * bh - 8) / 10);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lit = ((r * 7 + c * 13 + bi * 37) & 7) < 3;
        if (!lit) continue;
        ctx.fillStyle = rgba(255, 220, 120, a * (0.25 + ((r + c + bi) % 3) * 0.1));
        ctx.fillRect(W * bx + 4 + c * 8, H * by + 4 + r * 10, 4, 5);
      }
    }
  }

  // Trees
  const treesX = [0.12, 0.24, 0.42, 0.52, 0.68, 0.82, 0.9];
  ctx.fillStyle = rgba(15, 38, 15, a * 0.8);
  for (const tx of treesX) {
    ctx.beginPath();
    ctx.arc(W * tx, H * 0.53, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Lycee text
  const la = clamp01((progress - 0.15) / 0.35);
  if (la > 0.01) {
    const fs = Math.max(10, W * 0.012);
    ctx.font = `500 ${fs}px sans-serif`;
    ctx.fillStyle = rgba(255, 255, 255, la * 0.22);
    ctx.textAlign = "center";
    ctx.fillText("Lycée Haroun Tazieff — Saint-Paul-lès-Dax", W / 2, H * 0.72);
  }
}

/* ── Drawing: particles (batched) ─────────────────────────────────────── */

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], trailAlpha: number) {
  // Trails batched by depth
  if (trailAlpha > 0.01) {
    for (let t = TRAIL_LEN - 1; t >= 0; t--) {
      const tA = ((TRAIL_LEN - t) / TRAIL_LEN) * 0.25 * trailAlpha;
      ctx.fillStyle = rgba(251, 191, 36, tA);
      ctx.beginPath();
      for (const p of particles) {
        const s = p.size * (0.3 + 0.5 * ((TRAIL_LEN - t) / TRAIL_LEN));
        ctx.moveTo(p.trailX[t] + s, p.trailY[t]);
        ctx.arc(p.trailX[t], p.trailY[t], s, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  }

  // Main dots batched by color
  const byColor = new Map<string, Particle[]>();
  for (const p of particles) {
    let arr = byColor.get(p.color);
    if (!arr) { arr = []; byColor.set(p.color, arr); }
    arr.push(p);
  }
  for (const [color, group] of byColor) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (const p of group) {
      ctx.moveTo(p.x + p.size, p.y);
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    }
    ctx.fill();
  }
}

/* ── Drawing: title text ──────────────────────────────────────────────── */

function drawTitle(ctx: CanvasRenderingContext2D, W: number, baseY: number, alpha: number) {
  if (alpha < 0.01) return;
  const fs = Math.max(28, Math.min(36, W * 0.04));
  ctx.font = `900 ${fs}px sans-serif`;
  ctx.textAlign = "left";

  // Measure parts for centered rendering
  const parts: { text: string; color: string }[] = [
    { text: "Tazieff", color: rgba(255, 255, 255, alpha) },
    { text: "\u2019", color: rgba(240, 90, 43, alpha) },
    { text: "EPS", color: rgba(255, 255, 255, alpha) },
  ];
  let total = 0;
  for (const p of parts) total += ctx.measureText(p.text).width;

  let px = (W - total) / 2;
  for (const p of parts) {
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, px, baseY);
    px += ctx.measureText(p.text).width;
  }

  // Subtitle
  const subFs = Math.max(10, Math.min(12, W * 0.013));
  ctx.font = `600 ${subFs}px sans-serif`;
  ctx.textAlign = "center";
  ctx.letterSpacing = "3px";
  ctx.fillStyle = rgba(113, 113, 122, alpha);
  ctx.fillText("MUSCULATION AU LYCÉE", W / 2, baseY + fs * 0.9);
  ctx.letterSpacing = "0px";
}

/* ── Particle position update ─────────────────────────────────────────── */

function updateParticles(scene: Scene, elapsed: number) {
  for (const p of scene.particles) {
    // Shift trail
    for (let t = TRAIL_LEN - 1; t > 0; t--) {
      p.trailX[t] = p.trailX[t - 1];
      p.trailY[t] = p.trailY[t - 1];
    }
    p.trailX[0] = p.x;
    p.trailY[0] = p.y;

    const e = elapsed - p.delay;

    if (elapsed < 2000) {
      // Act 1: ship → earth
      const t = easeOutExpo(e / 2000);
      p.x = lerp(p.sx, p.ex, t);
      p.y = lerp(p.sy, p.ey, t);
    } else if (elapsed < 3800) {
      // Act 2: earth → center
      const t = easeInOutCubic((elapsed - 2000) / 1800);
      p.x = lerp(p.ex, p.cx, t);
      p.y = lerp(p.ey, p.cy, t);
    } else if (elapsed < 6000) {
      // Act 3: drift at center
      p.x = p.cx + Math.sin(elapsed * 0.002 + p.delay) * 3;
      p.y = p.cy + Math.cos(elapsed * 0.0015 + p.delay * 2) * 3;
    } else {
      // Act 4: center → mannequin
      const t = easeInOutCubic((elapsed - 6000) / 1500);
      p.x = lerp(p.cx, p.tx, t);
      p.y = lerp(p.cy, p.ty, t);

      // Breathing after ~7.5s
      if (elapsed > 7500) {
        const b = Math.sin(elapsed * 0.003 + p.delay) * 1.5;
        p.x += b * 0.3;
        p.y += b;
      }
    }
  }
}

/* ── Main frame renderer ──────────────────────────────────────────────── */

function drawFrame(ctx: CanvasRenderingContext2D, scene: Scene, elapsed: number) {
  const { W, H, shipX, shipY, earthX0, earthY0, centerX, centerY, mannequinBottom, stars, particles } = scene;

  // Act progress (0-1)
  const a2 = clamp01((elapsed - 2000) / 1800);
  const a3 = clamp01((elapsed - 3800) / 2200);
  const a4 = clamp01((elapsed - 6000) / 2000);

  // ── Background ─────────────────────────────────────────────
  ctx.fillStyle = "#030305";
  ctx.fillRect(0, 0, W, H);

  // Stars (fade out during act 2)
  if (elapsed < 3800) {
    const sa = elapsed < 2000 ? 1 : 1 - easeInOutCubic(a2);
    drawStars(ctx, stars, elapsed, sa);
  }

  // France map (act 3 with fade-out at end)
  if (elapsed >= 3800 && elapsed < 6200) {
    const fadeOut = elapsed < 5600 ? 1 : 1 - clamp01((elapsed - 5600) / 600);
    drawFrance(ctx, W, H, a3 * fadeOut, elapsed);
  }

  // Ground scene (act 4 with early fade-in)
  if (elapsed >= 5800) {
    const fadeIn = clamp01((elapsed - 5800) / 500);
    drawGround(ctx, W, H, a4 * fadeIn);
  }

  // Earth (acts 1-2, grows + moves, fades out near end of act 2)
  if (elapsed < 3800) {
    const baseR = Math.min(W, H) * 0.03;
    let eR: number, eX: number, eY: number, eA: number;
    if (elapsed < 2000) {
      eR = baseR;
      eX = earthX0;
      eY = earthY0;
      eA = 1;
    } else {
      const t = easeInOutCubic(a2);
      eR = lerp(baseR, Math.min(W, H) * 0.4, t);
      eX = lerp(earthX0, W / 2, t);
      eY = lerp(earthY0, H / 2, t);
      eA = elapsed < 3400 ? 1 : 1 - clamp01((elapsed - 3400) / 400);
    }
    drawEarth(ctx, eX, eY, eR, eA);
  }

  // Ship (act 1, fades in act 2)
  if (elapsed < 3800) {
    const shipAlpha = elapsed < 2000 ? 1 : 1 - easeOutExpo(a2);
    const shipScale = Math.min(W, H) * 0.003;
    drawShip(ctx, shipX, shipY, shipScale, shipAlpha);
  }

  // Orange flash (act 4 start)
  if (elapsed >= 6000 && elapsed < 6800) {
    const ft = clamp01((elapsed - 6000) / 800);
    const fAlpha = (1 - ft) * 0.3;
    const fR = Math.min(W, H) * 0.35 * ft;
    const fg = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, fR);
    fg.addColorStop(0, rgba(249, 115, 22, fAlpha));
    fg.addColorStop(1, rgba(249, 115, 22, 0));
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(centerX, centerY, fR, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Particles ──────────────────────────────────────────────
  updateParticles(scene, elapsed);

  let trailAlpha: number;
  if (elapsed < 3800) trailAlpha = 1;
  else if (elapsed < 6000) trailAlpha = 0.15;
  else if (elapsed < 7500) trailAlpha = 0.7;
  else trailAlpha = 0;

  drawParticles(ctx, particles, trailAlpha);

  // ── Title text (from 7s) ───────────────────────────────────
  if (elapsed >= 7000) {
    const ta = easeOutExpo((elapsed - 7000) / 500);
    drawTitle(ctx, W, mannequinBottom + 40, ta);
  }
}

/* ── React component ──────────────────────────────────────────────────── */

export function SplashScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const doneRef = useRef(false);
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    cancelAnimationFrame(rafRef.current);
    setFading(true);
    try { sessionStorage.setItem("tazieff-splash-shown", "1"); } catch { /* ignore */ }
    setTimeout(() => setVisible(false), 500);
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("tazieff-splash-shown")) {
        setVisible(false);
        return;
      }
    } catch { /* ignore */ }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    fetch("/data/splash-points.json")
      .then((r) => r.json())
      .then((points: number[][]) => {
        if (doneRef.current) return;
        const scene = createScene(W, H, points);
        const t0 = performance.now();

        const animate = (now: number) => {
          if (doneRef.current) return;
          const elapsed = now - t0;
          if (elapsed >= TOTAL_DUR) {
            drawFrame(ctx, scene, TOTAL_DUR);
            finish();
            return;
          }
          drawFrame(ctx, scene, elapsed);
          rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);
      })
      .catch(() => {
        finish();
      });

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [finish]);

  if (!visible) return null;

  return (
    <div className={`splash-overlay${fading ? " splash-fading" : ""}`}>
      <canvas ref={canvasRef} />
      <button className="splash-skip" onClick={finish} type="button">
        Passer
      </button>
    </div>
  );
}
