"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTimer, type TimerConfig, type TimerPhase } from "@/hooks/useTimer";
import { speak, speakCountdown } from "@/lib/audio/speech";

/* ── Phase colors ─────────────────────────────────────────────────────── */

const PHASE_BG: Record<TimerPhase, string> = {
  idle: "#1a1a2e",
  prepare: "#3b82f6",
  work: "#f97316",
  rest: "#22c55e",
  recovery: "#8b5cf6",
  cooldown: "#06b6d4",
  done: "#ec4899",
};

/* ── Helpers ──────────────────────────────────────────────────────────── */

function fmt(s: number): string {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/* ── SVG Icons (inline, no lucide-react) ──────────────────────────────── */

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
      <polygon points="6,3 20,12 6,21" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
      <rect x="5" y="3" width="4" height="18" rx="1" />
      <rect x="15" y="3" width="4" height="18" rx="1" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M3 12a9 9 0 1 1 1.5-5" />
      <polyline points="3 3 3 7 7 7" />
    </svg>
  );
}

function SkipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <polygon points="4,3 14,12 4,21" />
      <polygon points="13,3 23,12 13,21" />
    </svg>
  );
}

function SpeakerOnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function SpeakerOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

/* ── Circular progress ring ───────────────────────────────────────────── */

function ProgressRing({
  progress,
  size = 250,
  strokeWidth = 8,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);

  return (
    <svg width={size} height={size} className="absolute inset-0 m-auto -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="white"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-linear"
      />
    </svg>
  );
}

/* ── Component ────────────────────────────────────────────────────────── */

type Props = {
  config: TimerConfig;
  onBack: () => void;
};

export default function TimerDisplay({ config, onBack }: Props) {
  const { t, lang } = useI18n();
  const [state, actions] = useTimer(config);

  /* Voice toggle (persisted) */
  const [voiceOn, setVoiceOn] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("tazieff-timer-voice") !== "off";
  });
  const voiceRef = useRef(voiceOn);
  voiceRef.current = voiceOn;

  const toggleVoice = () => {
    setVoiceOn((v) => {
      const next = !v;
      localStorage.setItem("tazieff-timer-voice", next ? "on" : "off");
      return next;
    });
  };

  /* Auto-start on mount */
  useEffect(() => {
    actions.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Speech on phase change */
  const prevPhaseRef = useRef(state.phase);
  useEffect(() => {
    if (state.phase === prevPhaseRef.current) return;
    prevPhaseRef.current = state.phase;
    if (!voiceRef.current) return;
    switch (state.phase) {
      case "prepare": speak("prepare", lang); break;
      case "work":
        if (state.currentRound === state.totalRounds && state.totalRounds > 1) {
          speak("lastRound", lang);
        } else {
          speak("work", lang);
        }
        break;
      case "rest": speak("rest", lang); break;
      case "recovery": speak("recovery", lang); break;
      case "done": speak("done", lang); break;
    }
  }, [state.phase, state.currentRound, state.totalRounds, lang]);

  /* Speech countdown 3-2-1 */
  useEffect(() => {
    if (!voiceRef.current) return;
    if (state.isRunning && state.secondsRemaining > 0 && state.secondsRemaining <= 3) {
      speakCountdown(state.secondsRemaining, lang);
    }
  }, [state.secondsRemaining, state.isRunning, lang]);

  /* Wake Lock */
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    if (state.isRunning && "wakeLock" in navigator) {
      navigator.wakeLock.request("screen").then((l) => { lock = l; }).catch(() => {});
    }
    return () => { lock?.release().catch(() => {}); };
  }, [state.isRunning]);

  /* Phase labels */
  const phaseLabels: Record<TimerPhase, string> = {
    idle: t("timer.phases.idle"),
    prepare: t("timer.phases.prepare"),
    work: t("timer.phases.work"),
    rest: t("timer.phases.rest"),
    recovery: t("timer.phases.recovery"),
    cooldown: t("timer.phases.cooldown"),
    done: t("timer.phases.done"),
  };

  /* Progress for circular ring */
  const phaseDurations: Record<TimerPhase, number> = {
    idle: 0,
    prepare: config.prepareSeconds,
    work: config.workSeconds,
    rest: config.restSeconds,
    recovery: config.recoverySeconds,
    cooldown: config.cooldownSeconds,
    done: 0,
  };
  const phaseTotalSec = phaseDurations[state.phase] || 1;
  const phaseProgress = state.phase === "done" ? 1 : state.phase === "idle" ? 0 : state.secondsRemaining / phaseTotalSec;

  /* Global progress */
  const globalProgress = state.totalDuration > 0 ? state.totalElapsed / state.totalDuration : 0;

  const bg = PHASE_BG[state.phase];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between"
      style={{ background: bg, transition: "background 0.5s ease" }}
    >
      {/* Top bar */}
      <div className="w-full flex items-center justify-between px-4 pt-[max(12px,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-white/70 text-sm hover:text-white transition-colors"
        >
          <BackIcon />
        </button>
        <button
          type="button"
          onClick={toggleVoice}
          className="text-white/70 hover:text-white transition-colors p-2"
          aria-label={voiceOn ? t("timer.voiceOn") : t("timer.voiceOff")}
        >
          {voiceOn ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
        </button>
      </div>

      {/* Global progress bar */}
      <div className="w-full px-6">
        <div className="h-1 w-full rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${Math.min(100, globalProgress * 100)}%` }}
          />
        </div>
      </div>

      {/* Phase name */}
      <p className="text-white text-lg font-bold tracking-wider uppercase">
        {phaseLabels[state.phase]}
      </p>

      {/* Giant countdown + ring */}
      <div className="relative flex items-center justify-center" style={{ width: 250, height: 250 }}>
        <ProgressRing progress={phaseProgress} />
        <span className="font-mono text-8xl font-black text-white tabular-nums leading-none z-10">
          {fmt(state.secondsRemaining)}
        </span>
      </div>

      {/* Round / cycle info */}
      <p className="text-white/70 text-sm tabular-nums">
        {state.totalRounds > 1 && (
          <>{t("timer.roundOf")} {state.currentRound}/{state.totalRounds}</>
        )}
        {state.totalRounds > 1 && state.totalCycles > 1 && " — "}
        {state.totalCycles > 1 && (
          <>{t("timer.cycleOf")} {state.currentCycle}/{state.totalCycles}</>
        )}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-6 pb-[max(24px,env(safe-area-inset-bottom))]">
        {/* Reset */}
        <button
          type="button"
          onClick={actions.reset}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
          aria-label={t("timer.controls.reset")}
        >
          <ResetIcon />
        </button>

        {/* Play / Pause */}
        <button
          type="button"
          onClick={() => {
            if (state.phase === "idle" || state.phase === "done") {
              actions.reset();
              setTimeout(() => actions.start(), 50);
            } else if (state.isRunning) {
              actions.pause();
            } else {
              actions.resume();
            }
          }}
          className="flex items-center justify-center w-20 h-20 rounded-full bg-white text-black shadow-lg hover:scale-105 transition-transform"
          aria-label={state.isRunning ? t("timer.controls.pause") : t("timer.controls.start")}
        >
          {state.isRunning ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* Skip */}
        <button
          type="button"
          onClick={actions.skip}
          disabled={state.phase === "done" || state.phase === "idle"}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors disabled:opacity-30"
          aria-label={t("timer.controls.skip")}
        >
          <SkipIcon />
        </button>
      </div>
    </div>
  );
}
