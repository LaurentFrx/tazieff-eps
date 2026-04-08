"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type RestTimerProps = {
  /** Raw rest string from dosage, e.g. "60 s", "30-60 s", "1-2 min" */
  restRaw: string | null;
};

function parseRestSeconds(raw: string | null): number {
  if (!raw) return 90;
  const cleaned = raw.trim().replace(/\.$/, "");

  // "60-120 s" or "30-60s" → take the higher value
  const rangeSecMatch = cleaned.match(/(\d+)\s*[-–]\s*(\d+)\s*s/i);
  if (rangeSecMatch) return parseInt(rangeSecMatch[2], 10);

  // "1-2 min" or "1-2min" → take the higher value × 60
  const rangeMinMatch = cleaned.match(/(\d+)\s*[-–]\s*(\d+)\s*min/i);
  if (rangeMinMatch) return parseInt(rangeMinMatch[2], 10) * 60;

  // "90 s" or "90s" or "90sec"
  const secMatch = cleaned.match(/(\d+)\s*(?:s|sec|')/i);
  if (secMatch) return parseInt(secMatch[1], 10);

  // "2 min" or "2min" or "2mn"
  const minMatch = cleaned.match(/(\d+)\s*(?:min|mn)/i);
  if (minMatch) return parseInt(minMatch[1], 10) * 60;

  // Just a number
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

export function RestTimer({ restRaw }: RestTimerProps) {
  const totalSeconds = parseRestSeconds(restRaw);
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  useEffect(() => {
    if (!running) {
      cleanup();
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          cleanup();
          setRunning(false);
          setFinished(true);
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate(200);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return cleanup;
  }, [running, cleanup]);

  const handleTap = () => {
    if (finished) {
      // Reset
      setFinished(false);
      setTimeLeft(totalSeconds);
      return;
    }
    if (running) {
      // Pause
      setRunning(false);
    } else {
      // Start
      setRunning(true);
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    cleanup();
    setRunning(false);
    setFinished(false);
    setTimeLeft(totalSeconds);
  };

  const isActive = running || finished;
  const progress = running || finished ? 1 - timeLeft / totalSeconds : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div
      onClick={handleTap}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleTap(); }}
      className="flex items-center gap-4 rounded-2xl px-4 py-3 cursor-pointer select-none transition-all duration-300"
      style={{
        background: isActive ? "rgba(255,140,0,0.12)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${isActive ? "rgba(255,140,0,0.3)" : "rgba(255,255,255,0.06)"}`,
      }}
    >
      {/* SVG ring */}
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} style={{ transform: "rotate(-90deg)" }}>
          {/* Background circle */}
          <circle
            cx={RADIUS + STROKE}
            cy={RADIUS + STROKE}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={STROKE}
          />
          {/* Progress circle */}
          <circle
            cx={RADIUS + STROKE}
            cy={RADIUS + STROKE}
            r={RADIUS}
            fill="none"
            stroke={finished ? "#00E676" : "#FF8C00"}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className={!running && !finished && timeLeft < totalSeconds ? "timer-ring-pulse" : ""}
            style={{
              transition: running
                ? "stroke-dashoffset 1s linear, stroke 0.3s ease"
                : finished
                  ? "stroke 0.3s ease"
                  : "stroke-dashoffset 0.3s ease",
            }}
            opacity={isActive || timeLeft < totalSeconds ? 1 : 0}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-sm font-bold text-white"
            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          >
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Labels */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-bold"
          style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            color: isActive ? "#FF8C00" : "rgba(255,255,255,0.45)",
          }}
        >
          {finished ? <span className="timer-finished-text" style={{ display: "inline-block" }}>Terminé !</span> : "Timer repos"}
        </p>
        <p
          className="text-[11px]"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          {running ? "Tap pour pause" : finished ? "Tap pour reset" : "Tap pour démarrer"}
        </p>
      </div>

      {/* Reset button (visible during countdown or pause) */}
      {(running || (timeLeft < totalSeconds && !finished)) && (
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center justify-center w-[30px] h-[30px] rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors shrink-0"
          aria-label="Reset"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  );
}
