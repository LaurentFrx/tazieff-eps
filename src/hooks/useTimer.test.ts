import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { buildPhaseSequence, computeTotalDuration, useTimer, type TimerConfig } from "./useTimer";

/* Stub AudioContext + navigator.vibrate */
beforeEach(() => {
  vi.stubGlobal("AudioContext", class {
    createOscillator() { return { connect() {}, frequency: { value: 0 }, start() {}, stop() {} }; }
    createGain() { return { connect() {}, gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
    get destination() { return {}; }
    close() {}
    get currentTime() { return 0; }
  });
  Object.defineProperty(navigator, "vibrate", { value: vi.fn(), writable: true, configurable: true });
});

const SIMPLE: TimerConfig = {
  prepareSeconds: 0,
  workSeconds: 10,
  restSeconds: 5,
  rounds: 2,
  cycles: 1,
  recoverySeconds: 0,
  cooldownSeconds: 0,
};

const FULL: TimerConfig = {
  prepareSeconds: 3,
  workSeconds: 20,
  restSeconds: 10,
  rounds: 2,
  cycles: 2,
  recoverySeconds: 15,
  cooldownSeconds: 5,
};

const REST_ONLY: TimerConfig = {
  prepareSeconds: 0,
  workSeconds: 0,
  restSeconds: 60,
  rounds: 1,
  cycles: 1,
  recoverySeconds: 0,
  cooldownSeconds: 0,
};

/* ── buildPhaseSequence ───────────────────────────────────────────────── */

describe("buildPhaseSequence", () => {
  it("builds correct sequence for simple config", () => {
    const seq = buildPhaseSequence(SIMPLE);
    const phases = seq.map((s) => s.phase);
    expect(phases).toEqual(["work", "rest", "work", "rest", "done"]);
  });

  it("builds correct sequence for full config with prepare + recovery + cooldown", () => {
    const seq = buildPhaseSequence(FULL);
    const phases = seq.map((s) => s.phase);
    expect(phases).toEqual([
      "prepare",
      "work", "rest", "work", "rest",
      "recovery",
      "work", "rest", "work", "rest",
      "cooldown",
      "done",
    ]);
  });

  it("builds rest-only sequence for repos preset", () => {
    const seq = buildPhaseSequence(REST_ONLY);
    const phases = seq.map((s) => s.phase);
    expect(phases).toEqual(["rest", "done"]);
  });

  it("skips prepare when prepareSeconds is 0", () => {
    const seq = buildPhaseSequence(SIMPLE);
    expect(seq[0].phase).not.toBe("prepare");
  });
});

/* ── computeTotalDuration ─────────────────────────────────────────────── */

describe("computeTotalDuration", () => {
  it("computes total for simple config", () => {
    // 2 × (10 work + 5 rest) = 30
    expect(computeTotalDuration(SIMPLE)).toBe(30);
  });

  it("computes total for full config", () => {
    // 3 prepare + 2 cycles × (2 × 20 work + 2 × 10 rest) + 1 recovery(15) + 5 cooldown
    // = 3 + 2*(40+20) + 15 + 5 = 3 + 120 + 15 + 5 = 143
    expect(computeTotalDuration(FULL)).toBe(143);
  });

  it("computes total for rest-only config", () => {
    expect(computeTotalDuration(REST_ONLY)).toBe(60);
  });
});

/* ── useTimer hook ────────────────────────────────────────────────────── */

describe("useTimer", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("starts in idle phase", () => {
    const { result } = renderHook(() => useTimer(SIMPLE));
    expect(result.current[0].phase).toBe("idle");
    expect(result.current[0].isRunning).toBe(false);
  });

  it("start transitions to first phase (work when no prepare)", () => {
    const { result } = renderHook(() => useTimer(SIMPLE));
    act(() => { result.current[1].start(); });
    expect(result.current[0].phase).toBe("work");
    expect(result.current[0].isRunning).toBe(true);
    expect(result.current[0].secondsRemaining).toBe(10);
  });

  it("start transitions to prepare phase when prepareSeconds > 0", () => {
    const { result } = renderHook(() => useTimer(FULL));
    act(() => { result.current[1].start(); });
    expect(result.current[0].phase).toBe("prepare");
    expect(result.current[0].secondsRemaining).toBe(3);
  });

  it("phases advance correctly on tick", () => {
    const { result } = renderHook(() => useTimer(SIMPLE));
    act(() => { result.current[1].start(); });
    expect(result.current[0].phase).toBe("work");

    // Advance 10 seconds — work phase ends, rest begins
    act(() => { vi.advanceTimersByTime(10000); });
    expect(result.current[0].phase).toBe("rest");
    expect(result.current[0].secondsRemaining).toBe(5);
  });

  it("rounds increment correctly", () => {
    const { result } = renderHook(() => useTimer(SIMPLE));
    act(() => { result.current[1].start(); });
    expect(result.current[0].currentRound).toBe(1);

    // Advance through work(10) + rest(5) = 15s → round 2
    act(() => { vi.advanceTimersByTime(15000); });
    expect(result.current[0].currentRound).toBe(2);
    expect(result.current[0].phase).toBe("work");
  });

  it("reaches done phase at the end", () => {
    const { result } = renderHook(() => useTimer(SIMPLE));
    act(() => { result.current[1].start(); });

    // Total duration = 30s
    act(() => { vi.advanceTimersByTime(30000); });
    expect(result.current[0].phase).toBe("done");
    expect(result.current[0].isRunning).toBe(false);
  });

  it("skip advances to next phase", () => {
    const { result } = renderHook(() => useTimer(SIMPLE));
    act(() => { result.current[1].start(); });
    expect(result.current[0].phase).toBe("work");

    act(() => { result.current[1].skip(); });
    expect(result.current[0].phase).toBe("rest");
  });

  it("pause and resume work", () => {
    const { result } = renderHook(() => useTimer(SIMPLE));
    act(() => { result.current[1].start(); });
    expect(result.current[0].isRunning).toBe(true);

    act(() => { result.current[1].pause(); });
    expect(result.current[0].isRunning).toBe(false);

    const remaining = result.current[0].secondsRemaining;
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current[0].secondsRemaining).toBe(remaining); // unchanged

    act(() => { result.current[1].resume(); });
    expect(result.current[0].isRunning).toBe(true);
  });

  it("reset returns to idle", () => {
    const { result } = renderHook(() => useTimer(SIMPLE));
    act(() => { result.current[1].start(); });
    act(() => { vi.advanceTimersByTime(5000); });

    act(() => { result.current[1].reset(); });
    expect(result.current[0].phase).toBe("idle");
    expect(result.current[0].isRunning).toBe(false);
    expect(result.current[0].totalElapsed).toBe(0);
  });

  it("totalDuration is correctly set", () => {
    const { result } = renderHook(() => useTimer(SIMPLE));
    expect(result.current[0].totalDuration).toBe(30);
  });

  it("rest-only config works (repos preset)", () => {
    const { result } = renderHook(() => useTimer(REST_ONLY));
    act(() => { result.current[1].start(); });
    expect(result.current[0].phase).toBe("rest");
    expect(result.current[0].secondsRemaining).toBe(60);

    act(() => { vi.advanceTimersByTime(60000); });
    expect(result.current[0].phase).toBe("done");
  });
});
