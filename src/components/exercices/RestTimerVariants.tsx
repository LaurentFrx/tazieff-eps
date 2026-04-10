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

const MIN_TIME = 15;
const MAX_TIME = 300;
function clampTime(val: number): number {
  return Math.min(MAX_TIME, Math.max(MIN_TIME, val));
}

function vibrate(ms = 15) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
}

const WHEEL_VALUES = [15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240, 300];

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
    const clamped = clampTime(newTotal);
    setTotal(clamped);
    if (!running && !finished) setTimeLeft(clamped);
  };

  return { total, timeLeft, running, finished, tap, reset, adjustTotal };
}

/* ═══════════════════════════════════════════════════════════════
   Countdown ring — compact (overlays the bracelet picker center)
   ═══════════════════════════════════════════════════════════════ */

const RING_R = 26;
const RING_STROKE = 3.5;
const RING_SIZE = (RING_R + RING_STROKE) * 2;
const RING_CIRC = 2 * Math.PI * RING_R;

function CountdownRing({
  timeLeft,
  total,
  running,
  finished,
  onTap,
  onReset,
}: {
  timeLeft: number;
  total: number;
  running: boolean;
  finished: boolean;
  onTap: () => void;
  onReset: () => void;
}) {
  const isActive = running || finished;
  const progress = isActive ? 1 - timeLeft / total : 0;
  const dashOffset = RING_CIRC * (1 - progress);

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onTap(); }}
      onDoubleClick={(e) => { e.stopPropagation(); onReset(); }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[5] flex items-center justify-center rounded-full transition-all duration-300"
      style={{
        width: RING_SIZE + 8,
        height: RING_SIZE + 8,
        background: isActive ? "rgba(4,4,10,0.92)" : "rgba(4,4,10,0.85)",
        boxShadow: isActive
          ? "0 0 20px rgba(255,140,0,0.25), 0 0 40px rgba(255,140,0,0.1)"
          : "0 0 16px rgba(0,0,0,0.6)",
      }}
    >
      <svg width={RING_SIZE} height={RING_SIZE} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={RING_R + RING_STROKE} cy={RING_R + RING_STROKE} r={RING_R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={RING_STROKE} />
        <circle
          cx={RING_R + RING_STROKE} cy={RING_R + RING_STROKE} r={RING_R} fill="none"
          stroke={finished ? "#00E676" : "#FF8C00"} strokeWidth={RING_STROKE} strokeLinecap="round"
          strokeDasharray={RING_CIRC} strokeDashoffset={dashOffset}
          style={{ transition: running ? "stroke-dashoffset 1s linear, stroke 0.3s ease" : "stroke-dashoffset 0.3s ease, stroke 0.3s ease" }}
          opacity={isActive || timeLeft < total ? 1 : 0}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-[13px] font-bold leading-none"
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            color: finished ? "#00E676" : running ? "#FF8C00" : "rgba(255,255,255,0.9)",
          }}
        >
          {formatTime(timeLeft)}
        </span>
        <span className="text-[8px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
          {running ? "pause" : finished ? "reset" : "start"}
        </span>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Horizontal bracelet picker — effets 3D accentués
   ═══════════════════════════════════════════════════════════════ */

const ITEM_W = 58;
const CYLINDER_R = 140; // rayon plus serré = courbe plus forte

function HorizontalBraceletPicker({
  values,
  defaultValue,
  onChange,
  formatLabel: fmt,
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

      // Angle sur le cylindre (radians, capped ±80°)
      const maxAngle = (80 * Math.PI) / 180;
      const rawAngle = (scrollCenter - itemCenter) / CYLINDER_R;
      const angle = Math.min(Math.max(rawAngle, -maxAngle), maxAngle);
      const absAngle = Math.abs(angle);

      // Projections 3D accentuées
      const cosA = Math.cos(absAngle);
      const scale = cosA ** 1.3;                           // rétrécit plus vite
      const opacity = Math.max(0.05, cosA ** 2.5);         // s'efface fortement
      const translateZ = (1 - cosA) * -80;                 // recule plus profond
      const rotateY = angle * (180 / Math.PI) * 0.85;      // rotation Y plus marquée
      const translateX = Math.sin(angle) * -12;            // léger décalage latéral

      item.style.transform = `perspective(300px) translateX(${translateX}px) rotateY(${rotateY}deg) scale(${scale}) translateZ(${translateZ}px)`;
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
        height: 52,
        maskImage: "linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)",
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
            <span className="font-mono text-base font-bold text-white leading-none">
              {lbl.main}
            </span>
            {lbl.unit && (
              <span className="text-[8px] text-white/40 mt-0.5">{lbl.unit}</span>
            )}
          </div>
        );
      })}
      <div className="shrink-0" style={{ width: padW }} aria-hidden="true" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EXPORT — Timer repos compact avec bracelet picker
   Le ring countdown est superposé au centre du bracelet.
   ═══════════════════════════════════════════════════════════════ */

export function RestTimerShowcase({ restRaw }: { restRaw: string | null }) {
  const initial = parseRestSeconds(restRaw);
  const timer = useTimer(initial);
  const isActive = timer.running || timer.finished;

  return (
    <div
      className="relative rounded-2xl select-none transition-all duration-300 overflow-hidden"
      style={{
        background: isActive ? "rgba(255,140,0,0.10)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${isActive ? "rgba(255,140,0,0.25)" : "rgba(255,255,255,0.06)"}`,
      }}
    >
      {/* Bracelet picker behind */}
      <div className="px-2 py-2">
        <HorizontalBraceletPicker
          values={WHEEL_VALUES}
          defaultValue={WHEEL_VALUES.includes(timer.total) ? timer.total : 90}
          onChange={(val) => timer.adjustTotal(val)}
          formatLabel={WHEEL_FORMAT}
        />
      </div>

      {/* Countdown ring overlay — centered on the picker */}
      <CountdownRing
        timeLeft={timer.timeLeft}
        total={timer.total}
        running={timer.running}
        finished={timer.finished}
        onTap={timer.tap}
        onReset={timer.reset}
      />
    </div>
  );
}
