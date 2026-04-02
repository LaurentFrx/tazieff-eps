'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// ---------- Types ----------

export type TimerPhaseType = 'prepare' | 'work' | 'rest' | 'recovery' | 'cooldown';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'done';

export interface PhaseEntry {
  type: TimerPhaseType;
  duration: number; // seconds
  status: 'done' | 'active' | 'upcoming';
  label: string;
  roundIndex?: number; // 1-based round number for work/rest
  cycleIndex?: number; // 1-based cycle number
}

export interface TimerPreset {
  name: string;
  prepareDuration: number;
  workDuration: number;
  restDuration: number;
  rounds: number;
  cycles: number;
  recoveryDuration: number; // between cycles
  cooldownDuration: number;
}

export interface TimerState {
  status: TimerStatus;
  phases: PhaseEntry[];
  activePhaseIndex: number;
  secondsLeft: number;
  totalSecondsLeft: number;
  currentRound: number;
  totalRounds: number;
  currentCycle: number;
  totalCycles: number;
  elapsedSeconds: number;
}

export interface TimerCallbacks {
  onPhaseChange?: (phase: PhaseEntry, prevPhase: PhaseEntry | null) => void;
  onTick?: (secondsLeft: number, phase: PhaseEntry) => void;
  onHalfway?: () => void;
  onLastRound?: () => void;
  onDone?: (elapsedSeconds: number) => void;
}

// ---------- Build phase list ----------

export function buildPhases(preset: TimerPreset): PhaseEntry[] {
  const phases: PhaseEntry[] = [];

  if (preset.prepareDuration > 0) {
    phases.push({
      type: 'prepare',
      duration: preset.prepareDuration,
      status: 'upcoming',
      label: 'PREPARE',
    });
  }

  for (let c = 1; c <= preset.cycles; c++) {
    for (let r = 1; r <= preset.rounds; r++) {
      phases.push({
        type: 'work',
        duration: preset.workDuration,
        status: 'upcoming',
        label: `WORK`,
        roundIndex: r,
        cycleIndex: c,
      });

      // Rest after each round except the last of the cycle
      if (preset.restDuration > 0 && r < preset.rounds) {
        phases.push({
          type: 'rest',
          duration: preset.restDuration,
          status: 'upcoming',
          label: `REST`,
          roundIndex: r,
          cycleIndex: c,
        });
      }
    }

    // Recovery between cycles (not after the last cycle)
    if (preset.recoveryDuration > 0 && c < preset.cycles) {
      phases.push({
        type: 'recovery',
        duration: preset.recoveryDuration,
        status: 'upcoming',
        label: 'RECOVERY',
        cycleIndex: c,
      });
    }
  }

  if (preset.cooldownDuration > 0) {
    phases.push({
      type: 'cooldown',
      duration: preset.cooldownDuration,
      status: 'upcoming',
      label: 'COOLDOWN',
    });
  }

  return phases;
}

export function computeTotalRemaining(phases: PhaseEntry[], activeIndex: number, secondsLeft: number): number {
  let total = secondsLeft;
  for (let i = activeIndex + 1; i < phases.length; i++) {
    total += phases[i].duration;
  }
  return total;
}

export function getCurrentRoundCycle(phases: PhaseEntry[], activeIndex: number) {
  const phase = phases[activeIndex];
  return {
    currentRound: phase?.roundIndex ?? 1,
    currentCycle: phase?.cycleIndex ?? 1,
  };
}

// ---------- Hook ----------

export function useTimer(preset: TimerPreset, callbacks?: TimerCallbacks) {
  const [state, setState] = useState<TimerState>(() => {
    const phases = buildPhases(preset);
    return {
      status: 'idle',
      phases,
      activePhaseIndex: 0,
      secondsLeft: phases[0]?.duration ?? 0,
      totalSecondsLeft: phases.reduce((s, p) => s + p.duration, 0),
      currentRound: 1,
      totalRounds: preset.rounds,
      currentCycle: 1,
      totalCycles: preset.cycles,
      elapsedSeconds: 0,
    };
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const halfwayFiredRef = useRef(false);
  const lastRoundFiredRef = useRef(false);
  const presetRef = useRef(preset);

  // Keep presetRef in sync for use inside callbacks
  useEffect(() => {
    presetRef.current = preset;
  }, [preset]);

  // Wake Lock
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const acquireWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch {
      // Wake lock not available
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release();
    wakeLockRef.current = null;
  }, []);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const advancePhase = useCallback((currentState: TimerState): TimerState => {
    const { phases, activePhaseIndex } = currentState;
    const nextIndex = activePhaseIndex + 1;

    // Mark current phase as done
    const newPhases = phases.map((p, i) => {
      if (i === activePhaseIndex) return { ...p, status: 'done' as const };
      if (i === nextIndex) return { ...p, status: 'active' as const };
      return p;
    });

    if (nextIndex >= phases.length) {
      // All phases done
      callbacksRef.current?.onDone?.(currentState.elapsedSeconds);
      return {
        ...currentState,
        status: 'done',
        phases: newPhases,
        secondsLeft: 0,
        totalSecondsLeft: 0,
      };
    }

    const nextPhase = newPhases[nextIndex];
    const prevPhase = phases[activePhaseIndex];

    // Fire phase change callback
    callbacksRef.current?.onPhaseChange?.(nextPhase, prevPhase);

    // Halfway detection
    const totalRounds = presetRef.current.rounds * presetRef.current.cycles;
    const { currentRound, currentCycle } = getCurrentRoundCycle(newPhases, nextIndex);
    const globalRound = (currentCycle - 1) * presetRef.current.rounds + currentRound;

    if (
      !halfwayFiredRef.current &&
      nextPhase.type === 'work' &&
      totalRounds > 2 &&
      globalRound === Math.ceil(totalRounds / 2)
    ) {
      halfwayFiredRef.current = true;
      callbacksRef.current?.onHalfway?.();
    }

    // Last round detection
    if (
      !lastRoundFiredRef.current &&
      nextPhase.type === 'work' &&
      globalRound === totalRounds
    ) {
      lastRoundFiredRef.current = true;
      callbacksRef.current?.onLastRound?.();
    }

    return {
      ...currentState,
      phases: newPhases,
      activePhaseIndex: nextIndex,
      secondsLeft: nextPhase.duration,
      totalSecondsLeft: computeTotalRemaining(newPhases, nextIndex, nextPhase.duration),
      currentRound: currentRound,
      currentCycle: currentCycle,
    };
  }, []);

  const tick = useCallback(() => {
    setState((prev) => {
      if (prev.status !== 'running') return prev;

      const newSecondsLeft = prev.secondsLeft - 1;
      const newElapsed = prev.elapsedSeconds + 1;

      // Fire tick callback
      callbacksRef.current?.onTick?.(newSecondsLeft, prev.phases[prev.activePhaseIndex]);

      if (newSecondsLeft <= 0) {
        return advancePhase({ ...prev, secondsLeft: 0, elapsedSeconds: newElapsed });
      }

      return {
        ...prev,
        secondsLeft: newSecondsLeft,
        totalSecondsLeft: prev.totalSecondsLeft - 1,
        elapsedSeconds: newElapsed,
      };
    });
  }, [advancePhase]);

  const start = useCallback(() => {
    setState((prev) => {
      if (prev.status !== 'idle') return prev;

      const newPhases = prev.phases.map((p, i) =>
        i === 0 ? { ...p, status: 'active' as const } : p,
      );

      // Fire initial phase change
      callbacksRef.current?.onPhaseChange?.(newPhases[0], null);

      return {
        ...prev,
        status: 'running',
        phases: newPhases,
      };
    });

    acquireWakeLock();
    clearTimer();
    intervalRef.current = setInterval(tick, 1000);
  }, [tick, clearTimer, acquireWakeLock]);

  const pause = useCallback(() => {
    setState((prev) => (prev.status === 'running' ? { ...prev, status: 'paused' } : prev));
    clearTimer();
  }, [clearTimer]);

  const resume = useCallback(() => {
    setState((prev) => (prev.status === 'paused' ? { ...prev, status: 'running' } : prev));
    clearTimer();
    intervalRef.current = setInterval(tick, 1000);
  }, [tick, clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    releaseWakeLock();
    halfwayFiredRef.current = false;
    lastRoundFiredRef.current = false;

    const phases = buildPhases(presetRef.current);
    setState({
      status: 'idle',
      phases,
      activePhaseIndex: 0,
      secondsLeft: phases[0]?.duration ?? 0,
      totalSecondsLeft: phases.reduce((s, p) => s + p.duration, 0),
      currentRound: 1,
      totalRounds: presetRef.current.rounds,
      currentCycle: 1,
      totalCycles: presetRef.current.cycles,
      elapsedSeconds: 0,
    });
  }, [clearTimer, releaseWakeLock]);

  const skip = useCallback(() => {
    setState((prev) => {
      if (prev.status !== 'running' && prev.status !== 'paused') return prev;
      return advancePhase({ ...prev, secondsLeft: 0 });
    });
  }, [advancePhase]);

  // Cleanup
  useEffect(() => {
    return () => {
      clearTimer();
      releaseWakeLock();
    };
  }, [clearTimer, releaseWakeLock]);

  return {
    state,
    start,
    pause,
    resume,
    reset,
    skip,
  };
}
