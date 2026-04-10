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

const WHEEL_VALUES = [15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240, 300];

const WHEEL_FORMAT = (v: number) => {
  if (v >= 60) return { main: `${Math.floor(v / 60)}:${(v % 60).toString().padStart(2, "0")}`, unit: "min" };
  return { main: String(v), unit: "s" };
};

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

  return { total, timeLeft, running, finished, tap, reset, adjustTotal };
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

/* Shared timer bar (ring + labels + reset) */
function TimerBar({
  timer,
  subtitle,
  onTap,
  children,
}: {
  timer: ReturnType<typeof useTimer>;
  subtitle: string;
  onTap?: () => void;
  children?: React.ReactNode;
}) {
  const isActive = timer.running || timer.finished;
  return (
    <div
      onClick={onTap ?? timer.tap}
      role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") (onTap ?? timer.tap)(); }}
      className="flex items-center gap-4 rounded-2xl px-4 py-3 cursor-pointer select-none transition-all duration-300"
      style={{
        background: isActive ? "rgba(255,140,0,0.12)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${isActive ? "rgba(255,140,0,0.3)" : "rgba(255,255,255,0.06)"}`,
      }}
    >
      {children ?? (
        <TimerRing timeLeft={timer.timeLeft} totalSeconds={timer.total} running={timer.running} finished={timer.finished} />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold" style={{ fontFamily: "var(--font-dm-sans), sans-serif", color: isActive ? "#FF8C00" : "rgba(255,255,255,0.45)" }}>
          {timer.finished ? "Terminé !" : `Timer repos — ${formatTime(timer.total)}`}
        </p>
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
          {timer.running ? "Tap pour pause" : timer.finished ? "Tap pour reset" : subtitle}
        </p>
      </div>
      {(timer.running || (timer.timeLeft < timer.total && !timer.finished)) && (
        <button type="button" onClick={(e) => { e.stopPropagation(); timer.reset(); }}
          className="flex items-center justify-center w-[30px] h-[30px] rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors shrink-0" aria-label="Reset">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   WP-A — Tap chiffre → Drawer inline sous le timer
   Le wheel picker s'ouvre en dessous avec bouton OK.
   ═══════════════════════════════════════════════════════════════ */

function WPA_DrawerInline({ restRaw }: { restRaw: string | null }) {
  const initial = parseRestSeconds(restRaw);
  const timer = useTimer(initial);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleNumberTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!timer.running && !timer.finished) setPickerOpen(!pickerOpen);
  };

  return (
    <VariantWrapper label="WP-A — Drawer inline (tap chiffre → roue en dessous)">
      <TimerBar timer={timer} subtitle="Tap le chiffre pour ajuster">
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
      </TimerBar>

      {pickerOpen && (
        <div
          className="rounded-2xl overflow-hidden border border-[#FF8C00]/20 bg-black/60 backdrop-blur-md p-4 animate-in slide-in-from-top-2 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
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
                formatLabel={WHEEL_FORMAT}
              />
            </div>
            <button
              type="button"
              onClick={() => { setPickerOpen(false); vibrate(); }}
              className="px-5 py-2.5 rounded-xl bg-[#FF8C00] text-white text-sm font-bold active:scale-95 transition-transform"
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
   WP-B — Bottom sheet overlay
   Tap chiffre → overlay sombre avec wheel picker centré.
   ═══════════════════════════════════════════════════════════════ */

function WPB_BottomSheet({ restRaw }: { restRaw: string | null }) {
  const initial = parseRestSeconds(restRaw);
  const timer = useTimer(initial);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleNumberTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!timer.running && !timer.finished) setPickerOpen(true);
  };

  return (
    <VariantWrapper label="WP-B — Bottom sheet (tap chiffre → overlay plein écran)">
      <TimerBar timer={timer} subtitle="Tap le chiffre pour ajuster">
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
      </TimerBar>

      {pickerOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center"
          onClick={() => { setPickerOpen(false); vibrate(); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Sheet */}
          <div
            className="relative w-full max-w-md rounded-t-3xl border-t border-white/10 bg-[#0a0a12] p-6 pb-10 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />

            <p className="text-center text-sm font-semibold text-white/60 mb-4">Temps de repos</p>

            <WheelPicker
              values={WHEEL_VALUES}
              defaultValue={WHEEL_VALUES.includes(timer.total) ? timer.total : 90}
              unit="s"
              color="#FF8C00"
              onChange={(val) => timer.adjustTotal(val)}
              height={180}
              itemHeight={48}
              formatLabel={WHEEL_FORMAT}
            />

            <button
              type="button"
              onClick={() => { setPickerOpen(false); vibrate(); }}
              className="mt-5 w-full py-3 rounded-2xl bg-[#FF8C00] text-white text-base font-bold active:scale-[0.97] transition-transform"
            >
              Confirmer
            </button>
          </div>
        </div>
      )}
    </VariantWrapper>
  );
}

/* ═══════════════════════════════════════════════════════════════
   WP-C — Wheel toujours visible
   Le wheel picker est affiché en permanence à droite du timer,
   compact (petite hauteur).
   ═══════════════════════════════════════════════════════════════ */

function WPC_AlwaysVisible({ restRaw }: { restRaw: string | null }) {
  const initial = parseRestSeconds(restRaw);
  const timer = useTimer(initial);
  const isActive = timer.running || timer.finished;

  return (
    <VariantWrapper label="WP-C — Wheel toujours visible (inline à droite)">
      <div
        className="rounded-2xl px-4 py-3 select-none transition-all duration-300"
        style={{
          background: isActive ? "rgba(255,140,0,0.12)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${isActive ? "rgba(255,140,0,0.3)" : "rgba(255,255,255,0.06)"}`,
        }}
      >
        {/* Top row: ring + labels + reset */}
        <div className="flex items-center gap-4">
          <div onClick={timer.tap} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") timer.tap(); }} className="cursor-pointer">
            <TimerRing timeLeft={timer.timeLeft} totalSeconds={timer.total} running={timer.running} finished={timer.finished} />
          </div>
          <div className="cursor-pointer flex-1 min-w-0" onClick={timer.tap} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") timer.tap(); }}>
            <p className="text-[13px] font-bold" style={{ fontFamily: "var(--font-dm-sans), sans-serif", color: isActive ? "#FF8C00" : "rgba(255,255,255,0.45)" }}>
              {timer.finished ? "Terminé !" : "Timer repos"}
            </p>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              {timer.running ? "Tap pour pause" : timer.finished ? "Tap pour reset" : "Tap pour démarrer"}
            </p>
          </div>
          {(timer.running || (timer.timeLeft < timer.total && !timer.finished)) && (
            <button type="button" onClick={timer.reset}
              className="flex items-center justify-center w-[30px] h-[30px] rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors shrink-0" aria-label="Reset">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {/* Wheel picker always visible below */}
        <div className="mt-3 pt-3 border-t border-white/5">
          <WheelPicker
            values={WHEEL_VALUES}
            defaultValue={WHEEL_VALUES.includes(timer.total) ? timer.total : 90}
            unit="s"
            color="#FF8C00"
            onChange={(val) => timer.adjustTotal(val)}
            height={100}
            itemHeight={36}
            formatLabel={WHEEL_FORMAT}
          />
        </div>
      </div>
    </VariantWrapper>
  );
}

/* ═══════════════════════════════════════════════════════════════
   WP-D — Double wheel min:sec façon horloge iOS
   Deux roues côte à côte : minutes (0-5) et secondes (00-45 par 15).
   ═══════════════════════════════════════════════════════════════ */

const MINUTES_VALUES = [0, 1, 2, 3, 4, 5];
const SECONDS_VALUES = [0, 15, 30, 45];

function WPD_DualWheel({ restRaw }: { restRaw: string | null }) {
  const initial = parseRestSeconds(restRaw);
  const timer = useTimer(initial);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerMin = useRef(Math.floor(initial / 60));
  const pickerSec = useRef(initial % 60);

  // Snap seconds to nearest valid value
  const snapSec = (s: number) => {
    const valid = SECONDS_VALUES;
    return valid.reduce((best, v) => Math.abs(v - s) < Math.abs(best - s) ? v : best, valid[0]);
  };

  const handleNumberTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!timer.running && !timer.finished) {
      pickerMin.current = Math.floor(timer.total / 60);
      pickerSec.current = snapSec(timer.total % 60);
      setPickerOpen(true);
    }
  };

  const applyPicker = () => {
    const newTotal = pickerMin.current * 60 + pickerSec.current;
    timer.adjustTotal(newTotal || 15);
    setPickerOpen(false);
    vibrate();
  };

  return (
    <VariantWrapper label="WP-D — Double wheel min:sec (façon horloge iOS)">
      <TimerBar timer={timer} subtitle="Tap le chiffre pour ajuster">
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
      </TimerBar>

      {pickerOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center"
          onClick={applyPicker}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-t-3xl border-t border-white/10 bg-[#0a0a12] p-6 pb-10 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />
            <p className="text-center text-sm font-semibold text-white/60 mb-4">Temps de repos</p>

            <div className="flex items-center gap-2">
              {/* Minutes wheel */}
              <div className="flex-1">
                <WheelPicker
                  values={MINUTES_VALUES}
                  defaultValue={pickerMin.current}
                  unit="min"
                  color="#FF8C00"
                  onChange={(val) => { pickerMin.current = val; }}
                  height={160}
                  itemHeight={48}
                  label="MIN"
                />
              </div>

              {/* Separator */}
              <span className="text-2xl font-bold text-white/30 mb-2">:</span>

              {/* Seconds wheel */}
              <div className="flex-1">
                <WheelPicker
                  values={SECONDS_VALUES}
                  defaultValue={snapSec(pickerSec.current)}
                  unit="s"
                  color="#FF8C00"
                  onChange={(val) => { pickerSec.current = val; }}
                  height={160}
                  itemHeight={48}
                  label="SEC"
                  formatLabel={(v) => ({ main: v.toString().padStart(2, "0") })}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={applyPicker}
              className="mt-5 w-full py-3 rounded-2xl bg-[#FF8C00] text-white text-base font-bold active:scale-[0.97] transition-transform"
            >
              Confirmer
            </button>
          </div>
        </div>
      )}
    </VariantWrapper>
  );
}

/* ═══════════════════════════════════════════════════════════════
   WP-E — Wheel picker horizontal « bracelet »
   Scroll horizontal avec effet 3D cylindrique : les items
   s'éloignent en taille/opacité comme sur un bracelet circulaire.
   ═══════════════════════════════════════════════════════════════ */

const ITEM_WIDTH = 64;
const BRACELET_RADIUS = 200; // rayon virtuel du cylindre en px

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
      const itemCenter = item.offsetLeft + ITEM_WIDTH / 2;
      const dist = Math.abs(scrollCenter - itemCenter);

      if (dist < closestDist) { closestDist = dist; closestIdx = i; }

      // Angle sur le cylindre : dist / rayon (en radians, capped à ±π/2)
      const angle = Math.min(Math.max((scrollCenter - itemCenter) / BRACELET_RADIUS, -Math.PI / 2), Math.PI / 2);
      const absAngle = Math.abs(angle);

      // Projection 3D du cylindre
      const scale = Math.cos(absAngle);              // 1 au centre → 0 aux bords
      const opacity = Math.max(0.1, Math.cos(absAngle) ** 1.5);
      const translateZ = (1 - Math.cos(absAngle)) * -40;  // recule en Z
      const rotateY = angle * (180 / Math.PI) * 0.6;      // légère rotation Y

      item.style.transform = `perspective(400px) rotateY(${rotateY}deg) scale(${scale}) translateZ(${translateZ}px)`;
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
    // Scroll to center the initial value
    const targetLeft = initIdx * ITEM_WIDTH - (el.clientWidth / 2 - ITEM_WIDTH / 2);
    el.scrollLeft = targetLeft;
    applyVisuals();
  }, [initIdx, applyVisuals]);

  useEffect(() => () => cancelAnimationFrame(rafId.current), []);

  const padW = `calc(50% - ${ITEM_WIDTH / 2}px)`;

  return (
    <div className="relative">
      {/* Selection indicator */}
      <div
        className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 rounded-xl border-2 border-[#FF8C00]/40 bg-[#FF8C00]/10 pointer-events-none z-[1]"
        style={{ width: ITEM_WIDTH + 4 }}
      />

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex items-center overflow-x-scroll outline-none"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          height: 56,
          maskImage: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)",
        }}
      >
        {/* Left padding */}
        <div className="shrink-0" style={{ width: padW }} aria-hidden="true" />

        {values.map((v, i) => {
          const lbl = fmt(v);
          return (
            <div
              key={v}
              ref={(el) => { itemRefs.current[i] = el; }}
              className="shrink-0 flex flex-col items-center justify-center"
              style={{
                width: ITEM_WIDTH,
                scrollSnapAlign: "center",
                transition: "transform .12s ease-out, opacity .12s ease-out",
                willChange: "transform, opacity",
              }}
            >
              <span className="font-mono text-lg font-bold text-white leading-none">
                {lbl.main}
              </span>
              {lbl.unit && (
                <span className="text-[9px] text-white/50 mt-0.5">{lbl.unit}</span>
              )}
            </div>
          );
        })}

        {/* Right padding */}
        <div className="shrink-0" style={{ width: padW }} aria-hidden="true" />
      </div>
    </div>
  );
}

function WPE_HorizontalBracelet({ restRaw }: { restRaw: string | null }) {
  const initial = parseRestSeconds(restRaw);
  const timer = useTimer(initial);
  const isActive = timer.running || timer.finished;

  return (
    <VariantWrapper label="WP-E — Horizontal bracelet (scroll 3D cylindrique)">
      <div
        className="rounded-2xl px-4 py-3 select-none transition-all duration-300"
        style={{
          background: isActive ? "rgba(255,140,0,0.12)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${isActive ? "rgba(255,140,0,0.3)" : "rgba(255,255,255,0.06)"}`,
        }}
      >
        {/* Top row: ring + labels + reset */}
        <div className="flex items-center gap-4">
          <div onClick={timer.tap} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") timer.tap(); }} className="cursor-pointer">
            <TimerRing timeLeft={timer.timeLeft} totalSeconds={timer.total} running={timer.running} finished={timer.finished} />
          </div>
          <div className="cursor-pointer flex-1 min-w-0" onClick={timer.tap} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") timer.tap(); }}>
            <p className="text-[13px] font-bold" style={{ fontFamily: "var(--font-dm-sans), sans-serif", color: isActive ? "#FF8C00" : "rgba(255,255,255,0.45)" }}>
              {timer.finished ? "Terminé !" : "Timer repos"}
            </p>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              {timer.running ? "Tap pour pause" : timer.finished ? "Tap pour reset" : "Tap pour démarrer · scroll pour ajuster"}
            </p>
          </div>
          {(timer.running || (timer.timeLeft < timer.total && !timer.finished)) && (
            <button type="button" onClick={timer.reset}
              className="flex items-center justify-center w-[30px] h-[30px] rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors shrink-0" aria-label="Reset">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {/* Horizontal bracelet picker */}
        <div className="mt-3 pt-3 border-t border-white/5">
          <HorizontalBraceletPicker
            values={WHEEL_VALUES}
            defaultValue={WHEEL_VALUES.includes(timer.total) ? timer.total : 90}
            onChange={(val) => timer.adjustTotal(val)}
            formatLabel={WHEEL_FORMAT}
          />
        </div>
      </div>
    </VariantWrapper>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EXPORT — 5 variantes wheel picker empilées
   ═══════════════════════════════════════════════════════════════ */

export function RestTimerShowcase({ restRaw }: { restRaw: string | null }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="text-xs font-bold uppercase tracking-widest text-white/20 text-center">
        — Wheel Picker — 5 variantes —
      </div>
      <WPA_DrawerInline restRaw={restRaw} />
      <WPB_BottomSheet restRaw={restRaw} />
      <WPC_AlwaysVisible restRaw={restRaw} />
      <WPD_DualWheel restRaw={restRaw} />
      <WPE_HorizontalBracelet restRaw={restRaw} />
    </div>
  );
}
