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

const VALUES = [15, 30, 45, 60, 90, 120];

const SIZE = 60;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 25;
const STK = 4;
const CIRC = 2 * Math.PI * R;

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

/** Snap a duration to the closest picker value */
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

/* ─── Component ─── */

export function RestTimer({ restRaw }: RestTimerProps) {
  const defaultDur = snap(parseRestSeconds(restRaw));
  const [pickerValue, setPickerValue] = useState<{ dur: number }>({ dur: defaultDur });
  const [timeLeft, setTimeLeft] = useState(defaultDur);
  const [phase, setPhase] = useState<Phase>("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          cleanup();
          setPhase("finished");
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
    if (phase === "idle") { setTimeLeft(duration); setPhase("running"); }
    else if (phase === "running") setPhase("paused");
    else if (phase === "paused") setPhase("running");
  };

  /* ── Stop (reset) ── */
  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    cleanup();
    setPhase("idle");
    setTimeLeft(duration);
  };

  /* ── Ring visuals ── */
  const progress = phase !== "idle" ? 1 - timeLeft / duration : 0;
  const isLast3 = phase === "running" && timeLeft > 0 && timeLeft <= 3;

  let ringStroke: string;
  let ringOffset: number;
  let ringOpacity: number;

  if (phase === "finished") {
    ringStroke = "#22c55e"; ringOffset = 0; ringOpacity = 1;
  } else if (phase === "running" || phase === "paused") {
    ringStroke = "#f97316"; ringOffset = CIRC * progress; ringOpacity = 1;
  } else {
    ringStroke = "#f97316"; ringOffset = 0; ringOpacity = 0.15;
  }

  const showPicker = phase === "idle";
  const showStop = phase === "running" || phase === "paused";

  /* ─── Render ─── */

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(24,24,27,0.92)", border: "1px solid rgba(255,255,255,0.06)" }}>

      <style>{`
        @keyframes cdp{0%,100%{transform:scale(1)}40%{transform:scale(1.3)}}
        @keyframes vpop{0%{transform:scale(.85);opacity:.5}100%{transform:scale(1);opacity:1}}
        .rest-pk > div:last-child {
          background: rgba(249,115,22,0.06) !important;
          border-radius: 6px !important;
        }
        .rest-pk > div:last-child > div {
          background: rgba(249,115,22,0.3) !important;
        }
      `}</style>

      <div className="flex items-center px-3" style={{ height: 80 }}>

        {/* Label */}
        <div className="flex-none text-[11px] font-semibold tracking-wider uppercase leading-tight"
          style={{ color: "#0891b2", minWidth: 48 }}>
          TIMER<br />REPOS
        </div>

        {/* Picker zone — or stop button */}
        <div className="flex-1 relative" style={{ height: 80 }}>
          {showPicker ? (
            <Picker
              className="rest-pk"
              value={pickerValue}
              onChange={(val) => setPickerValue(val)}
              height={80}
              itemHeight={34}
              wheelMode="natural"
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
                        {v}<span className="text-[10px] ml-0.5 opacity-60">s</span>
                      </span>
                    )}
                  </Picker.Item>
                ))}
              </Picker.Column>
            </Picker>
          ) : showStop ? (
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

        {/* Circle with SVG ring */}
        <button
          onClick={handleTap}
          className="relative flex-none cursor-pointer bg-transparent border-none p-0 select-none active:scale-95 transition-transform ml-2"
          style={{ width: SIZE, height: SIZE }}
          aria-label={phase === "finished" ? "Terminé" : phase === "running" ? "Pause" : phase === "paused" ? "Reprendre" : "Démarrer"}
        >
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
            style={{ transform: "rotate(-90deg)" }}>
            {/* Background track */}
            <circle cx={CX} cy={CY} r={R} fill="none"
              stroke="white" strokeWidth={STK} strokeOpacity={0.06} />
            {/* Active / progress arc */}
            <circle cx={CX} cy={CY} r={R} fill="none"
              stroke={ringStroke} strokeWidth={STK} strokeLinecap="round"
              strokeDasharray={CIRC} strokeDashoffset={ringOffset}
              strokeOpacity={ringOpacity}
              style={{ transition: "stroke-dashoffset .3s linear, stroke .3s ease, stroke-opacity .3s ease" }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            {phase === "finished" ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : phase === "running" || phase === "paused" ? (
              <span
                key={isLast3 ? `cd-${timeLeft}` : "stable"}
                className="font-mono font-bold leading-none"
                style={{
                  fontSize: 15,
                  color: isLast3 ? "#f97316" : "#fff",
                  opacity: phase === "paused" ? 0.5 : 1,
                  animation: isLast3 ? "cdp .3s ease-out" : undefined,
                }}
              >
                {fmtTime(timeLeft)}
              </span>
            ) : (
              <span key={duration} className="font-mono font-bold leading-none"
                style={{ fontSize: 16, color: "#fff", animation: "vpop .2s ease-out" }}>
                {duration}<span className="text-[9px] ml-px opacity-50">s</span>
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Hint */}
      <p className="text-center text-[10px] pb-2 -mt-0.5"
        style={{ color: "rgba(255,255,255,0.3)" }}>
        {phase === "finished" ? "Terminé !"
          : phase === "running" ? "Tap le cercle pour pause"
          : phase === "paused" ? "Tap le cercle pour reprendre"
          : "Tap le cercle pour démarrer"}
      </p>
    </div>
  );
}
