"use client";

import { useEffect, useRef, useState } from "react";

type MethodeTimerProps = {
  labels: {
    heading: string;
    start: string;
    pause: string;
    reset: string;
    minutes: string;
    setDuration: string;
  };
};

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function MethodeTimer({ labels }: MethodeTimerProps) {
  const [durationMin, setDurationMin] = useState(10);
  const [remaining, setRemaining] = useState(durationMin * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemaining(durationMin * 60);
    setRunning(false);
  }, [durationMin]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running]);

  const progress = 1 - remaining / (durationMin * 60);
  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference * (1 - progress);
  const isDone = remaining === 0;

  return (
    <div className="card flex flex-col items-center gap-4 py-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--muted)]">
        {labels.heading}
      </h2>

      <div className="relative flex h-32 w-32 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="var(--bg-2)"
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <span className="relative text-2xl font-mono font-bold text-[color:var(--ink)]">
          {formatTime(remaining)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-[color:var(--muted)]">
          {labels.setDuration}
        </label>
        <input
          type="number"
          min={1}
          max={60}
          value={durationMin}
          disabled={running}
          onChange={(e) => {
            const val = Math.max(1, Math.min(60, Number(e.target.value)));
            setDurationMin(val);
          }}
          className="w-16 rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--bg)] px-2 py-1 text-center text-sm text-[color:var(--ink)] disabled:opacity-50"
        />
        <span className="text-xs text-[color:var(--muted)]">{labels.minutes}</span>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          className="chip"
          disabled={isDone}
          onClick={() => setRunning((prev) => !prev)}
        >
          {running ? labels.pause : labels.start}
        </button>
        <button
          type="button"
          className="chip chip-clear"
          onClick={() => {
            setRunning(false);
            setRemaining(durationMin * 60);
          }}
        >
          {labels.reset}
        </button>
      </div>
    </div>
  );
}
