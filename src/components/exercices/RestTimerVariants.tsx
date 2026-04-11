"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   SHARED
   ═══════════════════════════════════════════════════════════════ */

function parseRestSeconds(raw: string | null): number {
  if (!raw) return 90;
  const cleaned = raw.trim().replace(/\.$/, "");
  const rangeSecMatch = cleaned.match(/(\d+)\s*[-–]\s*(\d+)\s*s/i);
  if (rangeSecMatch) return parseInt(rangeSecMatch[2], 10);
  const rangeMinMatch = cleaned.match(/(\d+)\s*[-–]\s*(\d+)\s*min/i);
  if (rangeMinMatch) return parseInt(rangeMinMatch[2], 10) * 60;
  const secMatch = cleaned.match(/(\d+)\s*(?:s|sec|')/i);
  if (secMatch) return parseInt(secMatch[1], 10);
  const minMatch = cleaned.match(/(\d+)\s*(?:min|mn)/i);
  if (minMatch) return parseInt(minMatch[1], 10) * 60;
  const numMatch = cleaned.match(/^(\d+)$/);
  if (numMatch) return parseInt(numMatch[1], 10);
  return 90;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}:${s.toString().padStart(2, "0")}`;
  return `${s}s`;
}

function vibrate(ms = 15) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
}

const WHEEL_VALUES = [15, 30, 45, 60, 90, 120];

function snapToWheel(seconds: number): number {
  let best = WHEEL_VALUES[0];
  let bestDist = Infinity;
  for (const v of WHEEL_VALUES) {
    const d = Math.abs(v - seconds);
    if (d < bestDist) { bestDist = d; best = v; }
  }
  return best;
}

const WHEEL_FORMAT = (v: number) => {
  if (v >= 60) return { main: `${Math.floor(v / 60)}:${(v % 60).toString().padStart(2, "0")}`, unit: "min" };
  return { main: String(v), unit: "s" };
};

/* Timer hook */
function useTimer(initialSeconds: number) {
  const [total, setTotal] = useState(initialSeconds);
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  useEffect(() => {
    if (!running) { cleanup(); return; }
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          cleanup(); setRunning(false); setFinished(true);
          vibrate(200);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return cleanup;
  }, [running, cleanup]);

  const reset = () => { cleanup(); setRunning(false); setFinished(false); setTimeLeft(total); };
  const tap = () => {
    if (finished) { reset(); return; }
    if (running) setRunning(false); else setRunning(true);
  };
  const adjustTotal = (newTotal: number) => {
    setTotal(newTotal);
    if (!running && !finished) setTimeLeft(newTotal);
  };

  return { total, timeLeft, running, finished, tap, reset, adjustTotal };
}

/* ═══════════════════════════════════════════════════════════════
   Countdown ring — 60px, compact
   ═══════════════════════════════════════════════════════════════ */

const RING_R = 27;
const RING_STROKE = 3;
const RING_SIZE = (RING_R + RING_STROKE) * 2;
const RING_CIRC = 2 * Math.PI * RING_R;

function CountdownRing({
  timeLeft, total, running, finished, onTap,
}: {
  timeLeft: number; total: number; running: boolean; finished: boolean; onTap: () => void;
}) {
  const isActive = running || finished;
  const progress = isActive ? 1 - timeLeft / total : 0;
  const dashOffset = RING_CIRC * (1 - progress);
  const pulse = running && timeLeft <= 3 && timeLeft > 0;

  return (
    <button
      type="button"
      onClick={onTap}
      className="relative shrink-0 flex items-center justify-center"
      style={{ width: 60, height: 60 }}
      aria-label={running ? "Pause" : finished ? "Reset" : "Démarrer le timer"}
    >
      <svg width={RING_SIZE} height={RING_SIZE} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={RING_R + RING_STROKE} cy={RING_R + RING_STROKE} r={RING_R}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={RING_STROKE}
        />
        {isActive && (
          <circle
            cx={RING_R + RING_STROKE} cy={RING_R + RING_STROKE} r={RING_R}
            fill="none"
            stroke={finished ? "#00E676" : "#FF8C00"}
            strokeWidth={RING_STROKE} strokeLinecap="round"
            strokeDasharray={RING_CIRC} strokeDashoffset={dashOffset}
            style={{
              transition: running
                ? "stroke-dashoffset 1s linear, stroke 0.3s ease"
                : "stroke-dashoffset 0.3s ease, stroke 0.3s ease",
            }}
          />
        )}
      </svg>
      <span
        className="absolute font-bold leading-none"
        style={{
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: finished ? 10 : 15,
          color: finished ? "#00E676" : running ? "#FF8C00" : "rgba(255,255,255,0.7)",
          animation: pulse ? "pulse 1s ease-in-out infinite" : undefined,
        }}
      >
        {finished ? "Terminé" : formatTime(timeLeft)}
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Horizontal bracelet picker — 3D cylinder effect
   ═══════════════════════════════════════════════════════════════ */

const ITEM_W = 44;
const CYLINDER_R = 110;

function HorizontalBraceletPicker({
  values, defaultValue, onChange, formatLabel: fmt,
}: {
  values: number[];
  defaultValue: number;
  onChange: (value: number) => void;
  formatLabel: (v: number) => { main: string; unit?: string };
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafId = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const lastIdx = useRef(-1);
  const didInit = useRef(false);

  const initIdx = Math.max(0, values.indexOf(defaultValue));

  const applyVisuals = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollCenter = el.scrollLeft + el.clientWidth / 2;
    let closestIdx = 0;
    let closestDist = Infinity;

    for (let i = 0; i < itemRefs.current.length; i++) {
      const item = itemRefs.current[i];
      if (!item) continue;
      const itemCenter = item.offsetLeft + ITEM_W / 2;
      const dist = Math.abs(scrollCenter - itemCenter);
      if (dist < closestDist) { closestDist = dist; closestIdx = i; }

      const maxAngle = (80 * Math.PI) / 180;
      const rawAngle = (scrollCenter - itemCenter) / CYLINDER_R;
      const angle = Math.min(Math.max(rawAngle, -maxAngle), maxAngle);
      const absAngle = Math.abs(angle);

      const cosA = Math.cos(absAngle);
      const scale = cosA ** 1.5;
      const opacity = Math.max(0.04, cosA ** 3);
      const translateZ = (1 - cosA) * -100;
      const rotateY = angle * (180 / Math.PI) * 0.9;
      const translateX = Math.sin(angle) * -8;

      item.style.transform = `perspective(250px) translateX(${translateX}px) rotateY(${rotateY}deg) scale(${scale}) translateZ(${translateZ}px)`;
      item.style.opacity = String(opacity);
    }

    if (closestIdx !== lastIdx.current) {
      lastIdx.current = closestIdx;
      onChangeRef.current(values[closestIdx]);
      vibrate();
    }
  }, [values]);

  const onScroll = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(applyVisuals);
  }, [applyVisuals]);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = initIdx * ITEM_W - (el.clientWidth / 2 - ITEM_W / 2);
    applyVisuals();
  }, [initIdx, applyVisuals]);

  useEffect(() => () => cancelAnimationFrame(rafId.current), []);

  const padW = `calc(50% - ${ITEM_W / 2}px)`;

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="flex items-center overflow-x-scroll outline-none"
      style={{
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        height: 44,
        maskImage: "linear-gradient(to right, transparent 0%, black 25%, black 75%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 25%, black 75%, transparent 100%)",
      }}
    >
      <div className="shrink-0" style={{ width: padW }} aria-hidden="true" />
      {values.map((v, i) => {
        const lbl = fmt(v);
        return (
          <div
            key={v}
            ref={(el) => { itemRefs.current[i] = el; }}
            className="shrink-0 flex flex-col items-center justify-center"
            style={{
              width: ITEM_W,
              scrollSnapAlign: "center",
              transition: "transform .1s ease-out, opacity .1s ease-out",
              willChange: "transform, opacity",
            }}
          >
            <span className="font-mono text-[15px] font-bold text-white leading-none">
              {lbl.main}
            </span>
            {lbl.unit && (
              <span className="text-[8px] text-white/30 mt-px">{lbl.unit}</span>
            )}
          </div>
        );
      })}
      <div className="shrink-0" style={{ width: padW }} aria-hidden="true" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EXPORT — Timer repos compact (une seule ligne)
   ═══════════════════════════════════════════════════════════════ */

export function RestTimerShowcase({ restRaw }: { restRaw: string | null }) {
  const initial = snapToWheel(parseRestSeconds(restRaw));
  const timer = useTimer(initial);
  const isActive = timer.running || timer.finished;
  const resetRef = useRef(timer.reset);
  resetRef.current = timer.reset;

  /* Auto-reset 3s après la fin */
  useEffect(() => {
    if (!timer.finished) return;
    const id = setTimeout(() => resetRef.current(), 3000);
    return () => clearTimeout(id);
  }, [timer.finished]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 select-none">
      <div className="flex items-center gap-3">
        {/* Label */}
        <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40 shrink-0 leading-tight">
          Timer<br />repos
        </div>

        {/* Zone centrale : bracelet (repos) ou statut (actif) */}
        <div className="flex-1 min-w-0 flex items-center justify-center">
          {!isActive ? (
            <HorizontalBraceletPicker
              values={WHEEL_VALUES}
              defaultValue={WHEEL_VALUES.includes(timer.total) ? timer.total : 90}
              onChange={timer.adjustTotal}
              formatLabel={WHEEL_FORMAT}
            />
          ) : (
            <p className="text-[11px] text-white/25 text-center">
              {timer.finished ? "Terminé !" : "Tap pour pause"}
            </p>
          )}
        </div>

        {/* Anneau countdown — toujours visible */}
        <CountdownRing
          timeLeft={timer.timeLeft}
          total={timer.total}
          running={timer.running}
          finished={timer.finished}
          onTap={timer.tap}
        />
      </div>
    </div>
  );
}
