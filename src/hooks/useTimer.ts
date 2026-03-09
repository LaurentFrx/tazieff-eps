import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { beepCountdown, beepDone, beepRest, beepWork } from "@/lib/audio/beep";

/* ── Public types ─────────────────────────────────────────────────────── */

export type TimerPhase =
  | "idle"
  | "prepare"
  | "work"
  | "rest"
  | "recovery"
  | "cooldown"
  | "done";

export interface TimerConfig {
  prepareSeconds: number;
  workSeconds: number;
  restSeconds: number;
  rounds: number;
  cycles: number;
  recoverySeconds: number;
  cooldownSeconds: number;
}

export interface TimerState {
  phase: TimerPhase;
  secondsRemaining: number;
  currentRound: number;
  totalRounds: number;
  currentCycle: number;
  totalCycles: number;
  totalElapsed: number;
  totalDuration: number;
  isRunning: boolean;
}

export interface TimerActions {
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => void;
}

/* ── Phase sequence builder ───────────────────────────────────────────── */

interface PhaseStep {
  phase: TimerPhase;
  seconds: number;
  round: number;
  cycle: number;
}

export function buildPhaseSequence(config: TimerConfig): PhaseStep[] {
  const seq: PhaseStep[] = [];

  if (config.prepareSeconds > 0) {
    seq.push({ phase: "prepare", seconds: config.prepareSeconds, round: 0, cycle: 0 });
  }

  for (let c = 1; c <= config.cycles; c++) {
    for (let r = 1; r <= config.rounds; r++) {
      if (config.workSeconds > 0) {
        seq.push({ phase: "work", seconds: config.workSeconds, round: r, cycle: c });
      }
      if (config.restSeconds > 0) {
        seq.push({ phase: "rest", seconds: config.restSeconds, round: r, cycle: c });
      }
    }
    if (c < config.cycles && config.recoverySeconds > 0) {
      seq.push({
        phase: "recovery",
        seconds: config.recoverySeconds,
        round: config.rounds,
        cycle: c,
      });
    }
  }

  if (config.cooldownSeconds > 0) {
    seq.push({
      phase: "cooldown",
      seconds: config.cooldownSeconds,
      round: config.rounds,
      cycle: config.cycles,
    });
  }

  seq.push({ phase: "done", seconds: 0, round: config.rounds, cycle: config.cycles });

  return seq;
}

export function computeTotalDuration(config: TimerConfig): number {
  return buildPhaseSequence(config).reduce((sum, step) => sum + step.seconds, 0);
}

/* ── Reducer ──────────────────────────────────────────────────────────── */

interface InternalState {
  phaseIndex: number;
  secondsRemaining: number;
  totalElapsed: number;
  isRunning: boolean;
}

type Action =
  | { type: "START"; sequence: PhaseStep[] }
  | { type: "TICK"; sequence: PhaseStep[] }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "RESET" }
  | { type: "SKIP"; sequence: PhaseStep[] };

function reducer(state: InternalState, action: Action): InternalState {
  switch (action.type) {
    case "START": {
      if (action.sequence.length <= 1) {
        return { phaseIndex: action.sequence.length - 1, secondsRemaining: 0, totalElapsed: 0, isRunning: false };
      }
      return { phaseIndex: 0, secondsRemaining: action.sequence[0].seconds, totalElapsed: 0, isRunning: true };
    }
    case "TICK": {
      if (!state.isRunning) return state;
      if (state.secondsRemaining <= 1) {
        const nextIdx = state.phaseIndex + 1;
        if (nextIdx >= action.sequence.length) {
          return { ...state, secondsRemaining: 0, totalElapsed: state.totalElapsed + 1, isRunning: false };
        }
        const next = action.sequence[nextIdx];
        return {
          phaseIndex: nextIdx,
          secondsRemaining: next.seconds,
          totalElapsed: state.totalElapsed + 1,
          isRunning: next.phase !== "done",
        };
      }
      return { ...state, secondsRemaining: state.secondsRemaining - 1, totalElapsed: state.totalElapsed + 1 };
    }
    case "PAUSE":
      return { ...state, isRunning: false };
    case "RESUME":
      return state.secondsRemaining > 0 ? { ...state, isRunning: true } : state;
    case "RESET":
      return { phaseIndex: -1, secondsRemaining: 0, totalElapsed: 0, isRunning: false };
    case "SKIP": {
      const nextIdx = state.phaseIndex + 1;
      if (nextIdx >= action.sequence.length) return state;
      const next = action.sequence[nextIdx];
      return {
        ...state,
        phaseIndex: nextIdx,
        secondsRemaining: next.seconds,
        isRunning: next.phase !== "done" && state.isRunning,
      };
    }
    default:
      return state;
  }
}

const INITIAL: InternalState = {
  phaseIndex: -1,
  secondsRemaining: 0,
  totalElapsed: 0,
  isRunning: false,
};

/* ── Hook ─────────────────────────────────────────────────────────────── */

export function useTimer(config: TimerConfig): [TimerState, TimerActions] {
  const sequence = useMemo(() => buildPhaseSequence(config), [config]);
  const totalDuration = useMemo(() => computeTotalDuration(config), [config]);
  const sequenceRef = useRef(sequence);
  sequenceRef.current = sequence;

  const [internal, dispatch] = useReducer(reducer, INITIAL);

  /* Phase-change side effects (beep + vibrate) */
  const prevPhaseIdxRef = useRef(-1);
  const currentStep = internal.phaseIndex >= 0 && internal.phaseIndex < sequence.length
    ? sequence[internal.phaseIndex]
    : null;
  const currentPhase: TimerPhase = currentStep?.phase ?? "idle";

  useEffect(() => {
    if (internal.phaseIndex === prevPhaseIdxRef.current) return;
    prevPhaseIdxRef.current = internal.phaseIndex;
    switch (currentPhase) {
      case "work": beepWork(); break;
      case "rest": beepRest(); break;
      case "recovery": beepRest(); break;
      case "done": beepDone(); break;
    }
  }, [internal.phaseIndex, currentPhase]);

  /* Countdown beep at 3-2-1 */
  useEffect(() => {
    if (
      internal.isRunning &&
      internal.secondsRemaining > 0 &&
      internal.secondsRemaining <= 3 &&
      currentPhase !== "idle" &&
      currentPhase !== "done"
    ) {
      beepCountdown();
    }
  }, [internal.secondsRemaining, internal.isRunning, currentPhase]);

  /* Interval */
  useEffect(() => {
    if (!internal.isRunning) return;
    const iv = setInterval(() => {
      dispatch({ type: "TICK", sequence: sequenceRef.current });
    }, 1000);
    return () => clearInterval(iv);
  }, [internal.isRunning]);

  /* Derived public state */
  const state: TimerState = useMemo(() => ({
    phase: currentPhase,
    secondsRemaining: internal.secondsRemaining,
    currentRound: currentStep?.round ?? 1,
    totalRounds: config.rounds,
    currentCycle: currentStep?.cycle ?? 1,
    totalCycles: config.cycles,
    totalElapsed: internal.totalElapsed,
    totalDuration,
    isRunning: internal.isRunning,
  }), [currentPhase, internal, currentStep, config.rounds, config.cycles, totalDuration]);

  /* Actions */
  const start = useCallback(
    () => dispatch({ type: "START", sequence: sequenceRef.current }),
    [],
  );
  const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
  const resume = useCallback(() => dispatch({ type: "RESUME" }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);
  const skip = useCallback(
    () => dispatch({ type: "SKIP", sequence: sequenceRef.current }),
    [],
  );

  const actions: TimerActions = useMemo(
    () => ({ start, pause, resume, reset, skip }),
    [start, pause, resume, reset, skip],
  );

  return [state, actions];
}
