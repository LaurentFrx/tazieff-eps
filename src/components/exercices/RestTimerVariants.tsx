"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WheelPicker } from "@/components/tools/WheelPicker";

/* ═══════════════════════════════════════════════════════════════
   SHARED — logique commune à toutes les variantes
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
  return `${s}`;
}

const RADIUS = 28;
const STROKE = 4;
const SIZE = (RADIUS + STROKE) * 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const STEP = 15;
const MIN_TIME = 15;
const MAX_TIME = 300;

function clampTime(val: number): number {
  return Math.min(MAX_TIME, Math.max(MIN_TIME, val));
}

function vibrate() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(15);
  }
}

/* Shared ring component */
function TimerRing({
  timeLeft,
  totalSeconds,
  running,
  finished,
  children,
}: {
  timeLeft: number;
  totalSeconds: number;
  running: boolean;
  finished: boolean;
  children?: React.ReactNode;
}) {
  const isActive = running || finished;
  const progress = running || finished ? 1 - timeLeft / totalSeconds : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  return (
    <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={RADIUS + STROKE} cy={RADIUS + STROKE} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={STROKE} />
        <circle
          cx={RADIUS + STROKE} cy={RADIUS + STROKE} r={RADIUS} fill="none"
          stroke={finished ? "#00E676" : "#FF8C00"} strokeWidth={STROKE} strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset}
          style={{ transition: running ? "stroke-dashoffset 1s linear, stroke 0.3s ease" : finished ? "stroke 0.3s ease" : "stroke-dashoffset 0.3s ease" }}
          opacity={isActive || timeLeft < totalSeconds ? 1 : 0}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children ?? (
          <span className="text-sm font-bold text-white" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
            {formatTime(timeLeft)}
          </span>
        )}
      </div>
    </div>
  );
}

/* Shared timer hook */
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
          if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(200);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return cleanup;
  }, [running, cleanup]);

  const start = () => { if (!finished) setRunning(true); };
  const pause = () => setRunning(false);
  const reset = () => { cleanup(); setRunning(false); setFinished(false); setTimeLeft(total); };
  const tap = () => {
    if (finished) { reset(); return; }
    if (running) pause(); else start();
  };

  const adjustTotal = (newTotal: number) => {
    const clamped = clampTime(newTotal);
    setTotal(clamped);
    if (!running && !finished) setTimeLeft(clamped);
  };

  return { total, timeLeft, running, finished, tap, reset, start, pause, adjustTotal, setTimeLeft };
}

/* Shared wrapper with variant label */
function VariantWrapper({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF8C00]/60" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
          {label}
        </span>
        <div className="flex-1 h-px bg-white/5" />
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VARIANTE 1 — Boutons ± 15s
   ═══════════════════════════════════════════════════════════════ */

function V1_PlusMinus({ restRaw }: { restRaw: string | null }) {
  const initial = parseRestSeconds(restRaw);
  const timer = useTimer(initial);

  return (
    <VariantWrapper label="V1 — Boutons ± 15s">
      <div
        onClick={timer.tap}
        role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") timer.tap(); }}
        className="flex items-center gap-3 rounded-2xl px-4 py-3 cursor-pointer select-none transition-all duration-300"
        style={{
          background: timer.running || timer.finished ? "rgba(255,140,0,0.12)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${timer.running || timer.finished ? "rgba(255,140,0,0.3)" : "rgba(255,255,255,0.06)"}`,
        }}
      >
        {/* Minus button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); timer.adjustTotal(timer.total - STEP); vibrate(); }}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 active:scale-90 transition-all shrink-0"
          aria-label="-15s"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="8" x2="12" y2="8" /></svg>
        </button>

        <TimerRing timeLeft={timer.timeLeft} totalSeconds={timer.total} running={timer.running} finished={timer.finished} />

        {/* Plus button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); timer.adjustTotal(timer.total + STEP); vibrate(); }}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 active:scale-90 transition-all shrink-0"
          aria-label="+15s"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="8" x2="12" y2="8" /><line x1="8" y1="4" x2="8" y2="12" /></svg>
        </button>

        {/* Labels */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold" style={{ fontFamily: "var(--font-dm-sans), sans-serif", color: timer.running || timer.finished ? "#FF8C00" : "rgba(255,255,255,0.45)" }}>
            {timer.finished ? "Terminé !" : `Timer repos — ${formatTime(timer.total)}`}
          </p>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            {timer.running ? "Tap pour pause" : timer.finished ? "Tap pour reset" : "Tap pour démarrer"}
          </p>
        </div>

        {(timer.running || (timer.timeLeft < timer.total && !timer.finished)) && (
          <button type="button" onClick={(e) => { e.stopPropagation(); timer.reset(); }}
            className="flex items-center justify-center w-[30px] h-[30px] rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors shrink-0" aria-label="Reset">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>
    </VariantWrapper>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VARIANTE 2 — Swipe horizontal sur le composant
   ═══════════════════════════════════════════════════════════════ */

function V2_SwipeHorizontal({ restRaw }: { restRaw: string | null }) {
  const initial = parseRestSeconds(restRaw);
  const timer = useTimer(initial);
  const touchStartX = useRef<number | null>(null);
  const touchStartTotal = useRef(initial);
  const [swiping, setSwiping] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (timer.running || timer.finished) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartTotal.current = timer.total;
    setSwiping(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || timer.running || timer.finished) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 10) setSwiping(true);
    const steps = Math.round(dx / 30);
    const newTotal = clampTime(touchStartTotal.current + steps * STEP);
    timer.adjustTotal(newTotal);
  };

  const handleTouchEnd = () => {
    if (swiping) {
      vibrate();
      setSwiping(false);
      touchStartX.current = null;
      return;
    }
    touchStartX.current = null;
    setSwiping(false);
    timer.tap();
  };

  return (
    <VariantWrapper label="V2 — Swipe horizontal">
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => { if (!swiping) timer.tap(); }}
        role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") timer.tap(); }}
        className="flex items-center gap-4 rounded-2xl px-4 py-3 cursor-pointer select-none transition-all duration-300"
        style={{
          background: swiping ? "rgba(255,140,0,0.08)" : timer.running || timer.finished ? "rgba(255,140,0,0.12)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${timer.running || timer.finished ? "rgba(255,140,0,0.3)" : "rgba(255,255,255,0.06)"}`,
        }}
      >
        <TimerRing timeLeft={timer.timeLeft} totalSeconds={timer.total} running={timer.running} finished={timer.finished} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold" style={{ fontFamily: "var(--font-dm-sans), sans-serif", color: timer.running || timer.finished ? "#FF8C00" : "rgba(255,255,255,0.45)" }}>
            {timer.finished ? "Terminé !" : `Timer repos — ${formatTime(timer.total)}`}
          </p>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            {timer.running ? "Tap pour pause" : timer.finished ? "Tap pour reset" : "← Swipe pour ajuster →"}
          </p>
        </div>
        {(timer.running || (timer.timeLeft < timer.total && !timer.finished)) && (
          <button type="button" onClick={(e) => { e.stopPropagation(); timer.reset(); }}
            className="flex items-center justify-center w-[30px] h-[30px] rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors shrink-0" aria-label="Reset">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>
    </VariantWrapper>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VARIANTE 3 — Tap chiffre → Wheel Picker
   ═══════════════════════════════════════════════════════════════ */

const WHEEL_VALUES = [15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240, 300];

function V3_WheelPicker({ restRaw }: { restRaw: string | null }) {
  const initial = parseRestSeconds(restRaw);
  const timer = useTimer(initial);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleNumberTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!timer.running && !timer.finished) {
      setPickerOpen(!pickerOpen);
    }
  };

  return (
    <VariantWrapper label="V3 — Wheel Picker">
      <div
        onClick={timer.tap}
        role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") timer.tap(); }}
        className="flex items-center gap-4 rounded-2xl px-4 py-3 cursor-pointer select-none transition-all duration-300"
        style={{
          background: timer.running || timer.finished ? "rgba(255,140,0,0.12)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${timer.running || timer.finished ? "rgba(255,140,0,0.3)" : "rgba(255,255,255,0.06)"}`,
        }}
      >
        <TimerRing timeLeft={timer.timeLeft} totalSeconds={timer.total} running={timer.running} finished={timer.finished}>
          <button
            type="button"
            onClick={handleNumberTap}
            className="text-sm font-bold text-white hover:text-[#FF8C00] transition-colors"
            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          >
            {formatTime(timer.timeLeft)}
          </button>
        </TimerRing>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold" style={{ fontFamily: "var(--font-dm-sans), sans-serif", color: timer.running || timer.finished ? "#FF8C00" : "rgba(255,255,255,0.45)" }}>
            {timer.finished ? "Terminé !" : `Timer repos — ${formatTime(timer.total)}`}
          </p>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            {pickerOpen ? "Scrolle pour choisir" : timer.running ? "Tap pour pause" : timer.finished ? "Tap pour reset" : "Tap le chiffre pour ajuster"}
          </p>
        </div>
        {(timer.running || (timer.timeLeft < timer.total && !timer.finished)) && (
          <button type="button" onClick={(e) => { e.stopPropagation(); timer.reset(); }}
            className="flex items-center justify-center w-[30px] h-[30px] rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors shrink-0" aria-label="Reset">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* Wheel picker drawer */}
      {pickerOpen && (
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-md p-4"
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <WheelPicker
                values={WHEEL_VALUES}
                defaultValue={WHEEL_VALUES.includes(timer.total) ? timer.total : 90}
                unit="s"
                color="#FF8C00"
                onChange={(val) => timer.adjustTotal(val)}
                height={140}
                itemHeight={44}
                formatLabel={(v) => {
                  if (v >= 60) return { main: `${Math.floor(v / 60)}:${(v % 60).toString().padStart(2, "0")}`, unit: "min" };
                  return { main: String(v), unit: "s" };
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => { setPickerOpen(false); vibrate(); }}
              className="px-4 py-2 rounded-xl bg-[#FF8C00] text-white text-sm font-bold active:scale-95 transition-transform"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </VariantWrapper>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VARIANTE 4 — Presets chips
   ═══════════════════════════════════════════════════════════════ */

const PRESETS = [
  { label: "30s", value: 30 },
  { label: "45s", value: 45 },
  { label: "1:00", value: 60 },
  { label: "1:30", value: 90 },
  { label: "2:00", value: 120 },
  { label: "3:00", value: 180 },
];

function V4_Presets({ restRaw }: { restRaw: string | null }) {
  const initial = parseRestSeconds(restRaw);
  const timer = useTimer(initial);

  return (
    <VariantWrapper label="V4 — Presets chips">
      <div
        onClick={timer.tap}
        role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") timer.tap(); }}
        className="flex items-center gap-4 rounded-2xl px-4 py-3 cursor-pointer select-none transition-all duration-300"
        style={{
          background: timer.running || timer.finished ? "rgba(255,140,0,0.12)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${timer.running || timer.finished ? "rgba(255,140,0,0.3)" : "rgba(255,255,255,0.06)"}`,
        }}
      >
        <TimerRing timeLeft={timer.timeLeft} totalSeconds={timer.total} running={timer.running} finished={timer.finished} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold" style={{ fontFamily: "var(--font-dm-sans), sans-serif", color: timer.running || timer.finished ? "#FF8C00" : "rgba(255,255,255,0.45)" }}>
            {timer.finished ? "Terminé !" : "Timer repos"}
          </p>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            {timer.running ? "Tap pour pause" : timer.finished ? "Tap pour reset" : "Tap pour démarrer"}
          </p>
        </div>
        {(timer.running || (timer.timeLeft < timer.total && !timer.finished)) && (
          <button type="button" onClick={(e) => { e.stopPropagation(); timer.reset(); }}
            className="flex items-center justify-center w-[30px] h-[30px] rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors shrink-0" aria-label="Reset">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>
      {/* Preset chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mt-1 px-1 no-scrollbar">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => { timer.adjustTotal(p.value); vibrate(); }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-90 ${
              timer.total === p.value
                ? "bg-[#FF8C00] text-white shadow-[0_0_12px_rgba(255,140,0,0.3)]"
                : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
            }`}
            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </VariantWrapper>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VARIANTE 5 — Drag circulaire sur l'anneau
   ═══════════════════════════════════════════════════════════════ */

function V5_CircularDrag({ restRaw }: { restRaw: string | null }) {
  const initial = parseRestSeconds(restRaw);
  const timer = useTimer(initial);
  const ringRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startAngle = useRef(0);
  const startTotal = useRef(initial);

  const getAngle = (clientX: number, clientY: number) => {
    const el = ringRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (timer.running || timer.finished) return;
    e.stopPropagation();
    dragging.current = true;
    startAngle.current = getAngle(e.touches[0].clientX, e.touches[0].clientY);
    startTotal.current = timer.total;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    e.stopPropagation();
    const angle = getAngle(e.touches[0].clientX, e.touches[0].clientY);
    let delta = angle - startAngle.current;
    // Normalize to -180..180
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    // Each 30° = 15s
    const steps = Math.round(delta / 30);
    timer.adjustTotal(startTotal.current + steps * STEP);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragging.current) {
      e.stopPropagation();
      dragging.current = false;
      vibrate();
      return;
    }
  };

  return (
    <VariantWrapper label="V5 — Drag circulaire">
      <div
        onClick={timer.tap}
        role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") timer.tap(); }}
        className="flex items-center gap-4 rounded-2xl px-4 py-3 cursor-pointer select-none transition-all duration-300"
        style={{
          background: timer.running || timer.finished ? "rgba(255,140,0,0.12)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${timer.running || timer.finished ? "rgba(255,140,0,0.3)" : "rgba(255,255,255,0.06)"}`,
        }}
      >
        <div
          ref={ringRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: "none" }}
        >
          <TimerRing timeLeft={timer.timeLeft} totalSeconds={timer.total} running={timer.running} finished={timer.finished} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold" style={{ fontFamily: "var(--font-dm-sans), sans-serif", color: timer.running || timer.finished ? "#FF8C00" : "rgba(255,255,255,0.45)" }}>
            {timer.finished ? "Terminé !" : `Timer repos — ${formatTime(timer.total)}`}
          </p>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            {timer.running ? "Tap pour pause" : timer.finished ? "Tap pour reset" : "Tourne l'anneau pour ajuster"}
          </p>
        </div>
        {(timer.running || (timer.timeLeft < timer.total && !timer.finished)) && (
          <button type="button" onClick={(e) => { e.stopPropagation(); timer.reset(); }}
            className="flex items-center justify-center w-[30px] h-[30px] rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors shrink-0" aria-label="Reset">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>
    </VariantWrapper>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VARIANTE 6 — Double-tap pour incrémenter
   ═══════════════════════════════════════════════════════════════ */

function V6_DoubleTap({ restRaw }: { restRaw: string | null }) {
  const initial = parseRestSeconds(restRaw);
  const timer = useTimer(initial);
  const lastTapTime = useRef(0);
  const tapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTap = () => {
    const now = Date.now();
    const delta = now - lastTapTime.current;
    lastTapTime.current = now;

    if (delta < 300) {
      // Double tap → +15s
      if (tapTimeout.current) clearTimeout(tapTimeout.current);
      timer.adjustTotal(timer.total + STEP);
      vibrate();
      return;
    }

    // Single tap → wait to confirm it's not a double tap
    tapTimeout.current = setTimeout(() => {
      timer.tap();
    }, 300);
  };

  const handleLabelTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    timer.adjustTotal(timer.total - STEP);
    vibrate();
  };

  return (
    <VariantWrapper label="V6 — Double-tap +15s / tap label -15s">
      <div
        onClick={handleTap}
        role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") timer.tap(); }}
        className="flex items-center gap-4 rounded-2xl px-4 py-3 cursor-pointer select-none transition-all duration-300"
        style={{
          background: timer.running || timer.finished ? "rgba(255,140,0,0.12)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${timer.running || timer.finished ? "rgba(255,140,0,0.3)" : "rgba(255,255,255,0.06)"}`,
        }}
      >
        <TimerRing timeLeft={timer.timeLeft} totalSeconds={timer.total} running={timer.running} finished={timer.finished} />
        <div className="flex-1 min-w-0">
          <p
            className="text-[13px] font-bold"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif", color: timer.running || timer.finished ? "#FF8C00" : "rgba(255,255,255,0.45)" }}
            onClick={handleLabelTap}
          >
            {timer.finished ? "Terminé !" : `Timer repos — ${formatTime(timer.total)}`}
          </p>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            {timer.running ? "Tap pause · 2× tap +15s" : timer.finished ? "Tap pour reset" : "Tap start · 2× tap +15s · tap label -15s"}
          </p>
        </div>
        {(timer.running || (timer.timeLeft < timer.total && !timer.finished)) && (
          <button type="button" onClick={(e) => { e.stopPropagation(); timer.reset(); }}
            className="flex items-center justify-center w-[30px] h-[30px] rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors shrink-0" aria-label="Reset">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>
    </VariantWrapper>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VARIANTE 7 — Stepper intégré au chiffre central
   ═══════════════════════════════════════════════════════════════ */

function V7_CenterStepper({ restRaw }: { restRaw: string | null }) {
  const initial = parseRestSeconds(restRaw);
  const timer = useTimer(initial);

  const handleCenterTap = (e: React.MouseEvent) => {
    if (timer.running || timer.finished) return;
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const half = rect.width / 2;
    if (x < half) {
      timer.adjustTotal(timer.total - STEP);
    } else {
      timer.adjustTotal(timer.total + STEP);
    }
    vibrate();
  };

  const handleCenterTouch = (e: React.TouchEvent) => {
    if (timer.running || timer.finished) return;
    e.stopPropagation();
    const touch = e.touches[0];
    if (!touch) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const half = rect.width / 2;
    if (x < half) {
      timer.adjustTotal(timer.total - STEP);
    } else {
      timer.adjustTotal(timer.total + STEP);
    }
    vibrate();
  };

  return (
    <VariantWrapper label="V7 — Stepper dans le chiffre (gauche -15s / droite +15s)">
      <div
        onClick={timer.tap}
        role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") timer.tap(); }}
        className="flex items-center gap-4 rounded-2xl px-4 py-3 cursor-pointer select-none transition-all duration-300"
        style={{
          background: timer.running || timer.finished ? "rgba(255,140,0,0.12)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${timer.running || timer.finished ? "rgba(255,140,0,0.3)" : "rgba(255,255,255,0.06)"}`,
        }}
      >
        <TimerRing timeLeft={timer.timeLeft} totalSeconds={timer.total} running={timer.running} finished={timer.finished}>
          <div
            onClick={handleCenterTap}
            onTouchStart={handleCenterTouch}
            className="relative w-full h-full flex items-center justify-center cursor-pointer"
          >
            {/* Visual separator */}
            {!timer.running && !timer.finished && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-4 bg-white/10" />
            )}
            {/* Minus hint */}
            {!timer.running && !timer.finished && (
              <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[7px] text-white/20">−</span>
            )}
            {/* Plus hint */}
            {!timer.running && !timer.finished && (
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[7px] text-white/20">+</span>
            )}
            <span className="text-sm font-bold text-white" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
              {formatTime(timer.timeLeft)}
            </span>
          </div>
        </TimerRing>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold" style={{ fontFamily: "var(--font-dm-sans), sans-serif", color: timer.running || timer.finished ? "#FF8C00" : "rgba(255,255,255,0.45)" }}>
            {timer.finished ? "Terminé !" : `Timer repos — ${formatTime(timer.total)}`}
          </p>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            {timer.running ? "Tap pour pause" : timer.finished ? "Tap pour reset" : "Tap gauche -15s · droite +15s"}
          </p>
        </div>
        {(timer.running || (timer.timeLeft < timer.total && !timer.finished)) && (
          <button type="button" onClick={(e) => { e.stopPropagation(); timer.reset(); }}
            className="flex items-center justify-center w-[30px] h-[30px] rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors shrink-0" aria-label="Reset">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>
    </VariantWrapper>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EXPORT — Composant qui affiche les 7 variantes empilées
   ═══════════════════════════════════════════════════════════════ */

export function RestTimerShowcase({ restRaw }: { restRaw: string | null }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="text-xs font-bold uppercase tracking-widest text-white/20 text-center">
        — Timer repos — 7 variantes à tester —
      </div>
      <V1_PlusMinus restRaw={restRaw} />
      <V2_SwipeHorizontal restRaw={restRaw} />
      <V3_WheelPicker restRaw={restRaw} />
      <V4_Presets restRaw={restRaw} />
      <V5_CircularDrag restRaw={restRaw} />
      <V6_DoubleTap restRaw={restRaw} />
      <V7_CenterStepper restRaw={restRaw} />
    </div>
  );
}
