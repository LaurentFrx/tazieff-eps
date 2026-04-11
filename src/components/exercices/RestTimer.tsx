"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Picker from "react-mobile-picker";

/* ─── Types ─── */

type RestTimerProps = {
  /** Raw rest string from dosage, e.g. "60 s", "30-60 s", "1-2 min" */
  restRaw: string | null;
};

type Phase = "idle" | "running" | "paused" | "finished";

/* ─── Constants ─── */

// FIX 5 — plage étendue jusqu'à 5 minutes
const VALUES = [15, 30, 45, 60, 90, 120, 150, 180, 210, 240, 270, 300];

// SVG viewBox (fixed, the button scales)
const VB = 90;
const C = VB / 2; // center = 45

// Camembert (pie): thick-stroke trick — stroke fills the circle
const PIE_R = 20;
const PIE_STK = PIE_R * 2; // 40
const PIE_C = 2 * Math.PI * PIE_R; // ≈125.66

// Idle thin ring
const RING_R = 36;
const RING_STK = 3;

// FIX 3 — circle sizes
const SZ_IDLE = 80;
const SZ_ACTIVE = 90;

/* ─── Audio (FIX 6) ─── */

let audioCtx: AudioContext | null = null;

/** Create AudioContext on user gesture (iOS requirement) */
function ensureAudio() {
  try {
    if (!audioCtx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch { /* Web Audio not available */ }
}

function beep(freq: number, ms: number, startAt = 0) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.value = 0.3;
    const t = audioCtx.currentTime + startAt;
    osc.start(t);
    osc.stop(t + ms / 1000);
  } catch { /* noop */ }
}

function beepWarning() { beep(800, 150); }

function beepFinish() {
  beep(800, 150, 0);
  beep(1000, 150, 0.25);
  beep(1200, 200, 0.50);
}

/* ─── Helpers ─── */

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

function snap(seconds: number): number {
  let best = VALUES[0];
  let bestDiff = Math.abs(seconds - VALUES[0]);
  for (const v of VALUES) {
    const d = Math.abs(seconds - v);
    if (d < bestDiff) { bestDiff = d; best = v; }
  }
  return best;
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${String(sec).padStart(2, "0")}` : `${s}`;
}

// FIX 5 — picker labels: 15s, 30s, 45s, 1:00, 1:30, …, 5:00
function fmtLabel(v: number): string {
  if (v < 60) return `${v}s`;
  const m = Math.floor(v / 60);
  const s = v % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ─── Component ─── */

export function RestTimer({ restRaw }: RestTimerProps) {
  const defaultDur = snap(parseRestSeconds(restRaw));
  const [pickerValue, setPickerValue] = useState<{ dur: number }>({ dur: defaultDur });
  const [timeLeft, setTimeLeft] = useState(defaultDur);
  const [phase, setPhase] = useState<Phase>("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const beeped15 = useRef(false);

  const duration = pickerValue.dur;

  /* ── Sync timeLeft with picker when idle ── */
  useEffect(() => {
    if (phase === "idle") setTimeLeft(duration);
  }, [duration, phase]);

  /* ── Interval cleanup ── */
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  /* ── Countdown tick ── */
  useEffect(() => {
    if (phase !== "running") { cleanup(); return; }
    beeped15.current = false;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        // FIX 6 — bip à 15s
        if (prev === 16 && !beeped15.current) {
          beeped15.current = true;
          beepWarning();
        }
        if (prev <= 1) {
          cleanup();
          setPhase("finished");
          beepFinish(); // FIX 6 — triple bip fin
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate(200);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return cleanup;
  }, [phase, cleanup]);

  /* ── Auto-reset 2 s after finished ── */
  useEffect(() => {
    if (phase !== "finished") return;
    const id = setTimeout(() => {
      setPhase("idle");
      setTimeLeft(duration);
    }, 2000);
    return () => clearTimeout(id);
  }, [phase, duration]);

  /* ── Tap circle ── */
  const handleTap = () => {
    if (phase === "idle") {
      ensureAudio(); // FIX 6 — create AudioContext on gesture (iOS)
      setTimeLeft(duration);
      setPhase("running");
    } else if (phase === "running") {
      setPhase("paused");
    } else if (phase === "paused") {
      setPhase("running");
    }
  };

  /* ── Stop (reset) ── */
  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    cleanup();
    setPhase("idle");
    setTimeLeft(duration);
  };

  /* ── Visuals ── */
  const isActive = phase === "running" || phase === "paused";
  const fraction = phase !== "idle" ? (duration - timeLeft) / duration : 0; // 0→1 as time passes
  const isLast3 = phase === "running" && timeLeft > 0 && timeLeft <= 3;
  const circleSize = isActive || phase === "finished" ? SZ_ACTIVE : SZ_IDLE;

  /* ─── Render ─── */

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(24,24,27,0.92)", border: "1px solid rgba(255,255,255,0.06)" }}>

      <style>{`
        @keyframes cdp{0%,100%{transform:scale(1)}40%{transform:scale(1.3)}}
        @keyframes pulse-pause{0%,100%{opacity:1}50%{opacity:.4}}
        .rest-pk > div:last-child {
          background: rgba(249,115,22,0.06) !important;
          border-radius: 6px !important;
        }
        .rest-pk > div:last-child > div {
          background: rgba(249,115,22,0.3) !important;
        }
      `}</style>

      <div className="flex items-center px-3" style={{ height: 94 }}>

        {/* Label */}
        <div className="flex-none text-[11px] font-semibold tracking-wider uppercase leading-tight"
          style={{ color: "#0891b2", minWidth: 48 }}>
          TIMER<br />REPOS
        </div>

        {/* Picker zone — or stop button */}
        <div className="flex-1 relative" style={{ height: 86 }}>
          {phase === "idle" ? (
            <Picker
              className="rest-pk"
              value={pickerValue}
              onChange={(val) => setPickerValue(val)}
              height={86}
              itemHeight={34}
              wheelMode="natural"
              style={{ touchAction: "none" }}  /* FIX 1 — isoler scroll iOS */
            >
              <Picker.Column name="dur">
                {VALUES.map((v) => (
                  <Picker.Item key={v} value={v}>
                    {({ selected }) => (
                      <span
                        className="font-mono font-bold"
                        style={{
                          fontSize: selected ? 20 : 14,
                          color: selected ? "#f97316" : "rgba(255,255,255,0.25)",
                          transition: "all .15s ease",
                        }}
                      >
                        {fmtLabel(v)}
                      </span>
                    )}
                  </Picker.Item>
                ))}
              </Picker.Column>
            </Picker>
          ) : isActive ? (
            <div className="flex items-center justify-center h-full">
              <button
                onClick={handleStop}
                className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer"
                style={{ background: "rgba(239,68,68,0.12)" }}
                aria-label="Stop"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            </div>
          ) : null}
        </div>

        {/* ── Circle (FIX 2, 3, 4) ── */}
        <button
          onClick={handleTap}
          className="relative flex-none cursor-pointer bg-transparent border-none p-0 select-none active:scale-95"
          style={{
            width: circleSize,
            height: circleSize,
            transition: "width .3s ease, height .3s ease",
            marginLeft: 8,
          }}
          aria-label={phase === "finished" ? "Terminé" : phase === "running" ? "Pause" : phase === "paused" ? "Reprendre" : "Démarrer"}
        >
          <svg width="100%" height="100%" viewBox={`0 0 ${VB} ${VB}`}>

            {phase === "idle" ? (
              <>
                {/* Idle: thin ring + play icon */}
                <circle cx={C} cy={C} r={RING_R} fill="none"
                  stroke="#f97316" strokeWidth={RING_STK} strokeOpacity={0.15} />
                {/* Play triangle */}
                <polygon points="36,28 36,62 60,45" fill="#FF8C00" opacity={0.8} />
              </>
            ) : phase === "finished" ? (
              <>
                {/* Full green pie */}
                <circle cx={C} cy={C} r={PIE_R} fill="none"
                  stroke="#22c55e" strokeWidth={PIE_STK} strokeOpacity={0.9} />
                {/* Check mark */}
                <polyline points="32,46 40,54 58,36" fill="none"
                  stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </>
            ) : (
              <>
                {/* FIX 4 — Camembert: background (dark) */}
                <circle cx={C} cy={C} r={PIE_R} fill="none"
                  stroke="rgba(255,255,255,0.08)" strokeWidth={PIE_STK} />
                {/* Foreground pie (orange, depleting) */}
                <circle cx={C} cy={C} r={PIE_R} fill="none"
                  stroke="#FF8C00" strokeWidth={PIE_STK}
                  strokeDasharray={PIE_C}
                  strokeDashoffset={PIE_C * fraction}
                  transform={`rotate(-90 ${C} ${C})`}
                  style={{
                    transition: "stroke-dashoffset 1s linear",
                    opacity: phase === "paused" ? 0.6 : 1,
                  }}
                />
                {/* Time text */}
                <text
                  x={C} y={phase === "paused" ? C - 4 : C + 1}
                  textAnchor="middle" dominantBaseline="central"
                  fill="#fff" fontFamily="var(--font-jetbrains), monospace"
                  fontWeight="bold"
                  fontSize={isLast3 ? 22 : 18}
                >
                  {fmtTime(timeLeft)}
                </text>
                {/* FIX 2 — Pause icon overlay */}
                {phase === "paused" && (
                  <g opacity={0.6} style={{ animation: "pulse-pause 1.5s ease infinite" }}>
                    <rect x="37" y="52" width="5" height="14" rx="1.5" fill="#fff" />
                    <rect x="48" y="52" width="5" height="14" rx="1.5" fill="#fff" />
                  </g>
                )}
              </>
            )}
          </svg>

          {/* Countdown pulse at 3-2-1 (overlay) */}
          {isLast3 && (
            <div key={`cd-${timeLeft}`} className="absolute inset-0 rounded-full"
              style={{
                border: "2px solid #FF8C00",
                animation: "cdp .3s ease-out",
                pointerEvents: "none",
              }}
            />
          )}
        </button>
      </div>

    </div>
  );
}
