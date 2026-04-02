'use client';

import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import type { RingPhase } from '@/components/tools/CountdownRing';
import type { TimerPreset, TimerState, PhaseEntry } from '@/hooks/useTimer';
import { buildPhases, computeTotalRemaining, getCurrentRoundCycle } from '@/hooks/useTimer';
import { hapticFeedback, playCountdownBeep, playTransitionBeep, playFinishSound } from '@/lib/audio/beep';
import { speakEvent, isSpeechEnabled, setSpeechEnabled } from '@/lib/audio/speech';

/* ─── Display config passed by each timer preset ─── */

export interface TimerDisplayConfig {
  ringPhases: RingPhase[];
  ringTotal: number;
  phaseColorMap: Record<string, string>;
  phaseGradientMap: Record<string, string>;
}

/* ─── Context value ─── */

export interface TimerContextValue {
  state: TimerState;
  timerType: string | null;
  displayConfig: TimerDisplayConfig | null;
  isActive: boolean;
  startTimer: (type: string, preset: TimerPreset, config: TimerDisplayConfig, lang: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  skip: () => void;
  speechEnabled: boolean;
  toggleSpeech: () => void;
}

/* ─── Idle state ─── */

const IDLE_STATE: TimerState = {
  status: 'idle', phases: [], activePhaseIndex: 0, secondsLeft: 0,
  totalSecondsLeft: 0, currentRound: 1, totalRounds: 1,
  currentCycle: 1, totalCycles: 1, elapsedSeconds: 0,
};

/* ─── Context ─── */

const TimerContext = createContext<TimerContextValue | null>(null);
export function useTimerContext() { return useContext(TimerContext); }

/* ─── Provider ─── */

export function TimerProvider({ children }: { children: ReactNode }) {
  const [timerType, setTimerType] = useState<string | null>(null);
  const [displayConfig, setDisplayConfig] = useState<TimerDisplayConfig | null>(null);
  const [state, setState] = useState<TimerState>(IDLE_STATE);
  const [speechOn, setSpeechOnState] = useState(() =>
    typeof window !== 'undefined' ? isSpeechEnabled() : true,
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const langRef = useRef('fr');
  const halfwayRef = useRef(false);
  const lastRoundRef = useRef(false);
  const presetRef = useRef<TimerPreset | null>(null);

  /* ── helpers ── */

  const clearInt = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const acquireWL = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator)
        wakeLockRef.current = await navigator.wakeLock.request('screen');
    } catch { /* not available */ }
  }, []);

  const releaseWL = useCallback(() => {
    wakeLockRef.current?.release(); wakeLockRef.current = null;
  }, []);

  const firePhaseAudio = useCallback((phase: PhaseEntry) => {
    hapticFeedback('heavy'); playTransitionBeep();
    if (phase.type === 'prepare') speakEvent('prepare', langRef.current);
    else if (phase.type === 'work') speakEvent('work_start', langRef.current);
    else speakEvent('rest_start', langRef.current);
  }, []);

  /* ── advance to next phase ── */

  const advancePhase = useCallback((cur: TimerState): TimerState => {
    const nextIdx = cur.activePhaseIndex + 1;
    const newPhases = cur.phases.map((p, i) =>
      i === cur.activePhaseIndex ? { ...p, status: 'done' as const }
        : i === nextIdx ? { ...p, status: 'active' as const }
        : p,
    );

    if (nextIdx >= cur.phases.length) {
      playFinishSound(); speakEvent('done', langRef.current); hapticFeedback('heavy');
      return { ...cur, status: 'done', phases: newPhases, secondsLeft: 0, totalSecondsLeft: 0 };
    }

    const next = newPhases[nextIdx];
    firePhaseAudio(next);

    const preset = presetRef.current;
    if (preset) {
      const totalR = preset.rounds * preset.cycles;
      const { currentRound, currentCycle } = getCurrentRoundCycle(newPhases, nextIdx);
      const globalR = (currentCycle - 1) * preset.rounds + currentRound;

      if (!halfwayRef.current && next.type === 'work' && totalR > 2 && globalR === Math.ceil(totalR / 2)) {
        halfwayRef.current = true; speakEvent('halfway', langRef.current);
      }
      if (!lastRoundRef.current && next.type === 'work' && globalR === totalR) {
        lastRoundRef.current = true; speakEvent('last_round', langRef.current); hapticFeedback('double');
      }

      return {
        ...cur, phases: newPhases, activePhaseIndex: nextIdx,
        secondsLeft: next.duration,
        totalSecondsLeft: computeTotalRemaining(newPhases, nextIdx, next.duration),
        currentRound, currentCycle,
      };
    }
    return cur;
  }, [firePhaseAudio]);

  /* ── tick ── */

  const tick = useCallback(() => {
    setState(prev => {
      if (prev.status !== 'running') return prev;
      const sl = prev.secondsLeft - 1;
      const el = prev.elapsedSeconds + 1;

      if (sl >= 0 && sl <= 2) {
        playCountdownBeep(sl); hapticFeedback('tap');
        if (sl >= 1) speakEvent(`countdown_${sl}`, langRef.current);
      }
      if (sl <= 0) return advancePhase({ ...prev, secondsLeft: 0, elapsedSeconds: el });
      return { ...prev, secondsLeft: sl, totalSecondsLeft: prev.totalSecondsLeft - 1, elapsedSeconds: el };
    });
  }, [advancePhase]);

  /* ── actions ── */

  const stop = useCallback(() => {
    clearInt(); releaseWL();
    halfwayRef.current = false; lastRoundRef.current = false;
    setTimerType(null); setDisplayConfig(null);
    presetRef.current = null; setState(IDLE_STATE);
  }, [clearInt, releaseWL]);

  // Auto-cleanup 2 s after done
  useEffect(() => {
    if (state.status === 'done') {
      const t = setTimeout(stop, 2000);
      return () => clearTimeout(t);
    }
  }, [state.status, stop]);

  const startTimer = useCallback((type: string, preset: TimerPreset, config: TimerDisplayConfig, lang: string) => {
    clearInt(); releaseWL();
    setTimerType(type); setDisplayConfig(config);
    langRef.current = lang; presetRef.current = preset;
    halfwayRef.current = false; lastRoundRef.current = false;

    const phases = buildPhases(preset);
    const activated = phases.map((p, i) => i === 0 ? { ...p, status: 'active' as const } : p);

    setState({
      status: 'running', phases: activated, activePhaseIndex: 0,
      secondsLeft: phases[0]?.duration ?? 0,
      totalSecondsLeft: phases.reduce((s, p) => s + p.duration, 0),
      currentRound: 1, totalRounds: preset.rounds,
      currentCycle: 1, totalCycles: preset.cycles, elapsedSeconds: 0,
    });

    if (phases[0]) firePhaseAudio(phases[0]);
    acquireWL();
    intervalRef.current = setInterval(tick, 1000);
  }, [clearInt, releaseWL, acquireWL, tick, firePhaseAudio]);

  const pause = useCallback(() => {
    setState(p => p.status === 'running' ? { ...p, status: 'paused' } : p);
    clearInt();
  }, [clearInt]);

  const resume = useCallback(() => {
    setState(p => p.status === 'paused' ? { ...p, status: 'running' } : p);
    clearInt(); intervalRef.current = setInterval(tick, 1000);
  }, [tick, clearInt]);

  const skip = useCallback(() => {
    setState(p => (p.status === 'running' || p.status === 'paused')
      ? advancePhase({ ...p, secondsLeft: 0 }) : p);
  }, [advancePhase]);

  const toggleSpeech = useCallback(() => {
    setSpeechOnState(p => { const n = !p; setSpeechEnabled(n); return n; });
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { clearInt(); releaseWL(); }, [clearInt, releaseWL]);

  const isActive = state.status === 'running' || state.status === 'paused';

  return (
    <TimerContext.Provider value={{
      state, timerType, displayConfig, isActive,
      startTimer, pause, resume, stop, skip,
      speechEnabled: speechOn, toggleSpeech,
    }}>
      {children}
    </TimerContext.Provider>
  );
}
