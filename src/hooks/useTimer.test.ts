import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTimer, type TimerPreset } from "./useTimer";

/* Stub AudioContext + navigator.vibrate */
beforeEach(() => {
  vi.stubGlobal("AudioContext", class {
    createOscillator() { return { connect() {}, type: "sine", frequency: { value: 0, setValueAtTime() {} }, start() {}, stop() {} }; }
    createGain() { return { connect() {}, gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
    get destination() { return {}; }
    close() {}
    get currentTime() { return 0; }
    get state() { return "running"; }
    resume() { return Promise.resolve(); }
  });
  Object.defineProperty(navigator, "vibrate", { value: vi.fn(), writable: true, configurable: true });
});

const SIMPLE: TimerPreset = {
  name: "Simple",
  prepareDuration: 0,
  workDuration: 10,
  restDuration: 5,
  rounds: 2,
  cycles: 1,
  recoveryDuration: 0,
  restBetweenDuration: 0,
  cooldownDuration: 0,
};

const FULL: TimerPreset = {
  name: "Full",
  prepareDuration: 3,
  workDuration: 20,
  restDuration: 10,
  rounds: 2,
  cycles: 2,
  recoveryDuration: 15,
  restBetweenDuration: 0,
  cooldownDuration: 5,
};

const REST_ONLY: TimerPreset = {
  name: "Rest",
  prepareDuration: 0,
  workDuration: 120,
  restDuration: 0,
  rounds: 1,
  cycles: 1,
  recoveryDuration: 0,
  restBetweenDuration: 0,
  cooldownDuration: 0,
};

describe("useTimer", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("starts in idle status", () => {
    const { result } = renderHook(() => useTimer(SIMPLE));
    expect(result.current.state.status).toBe("idle");
  });

  it("builds correct number of phases for simple config", () => {
    const { result } = renderHook(() => useTimer(SIMPLE));
    // work, rest, work (no rest after last round)
    const types = result.current.state.phases.map((p) => p.type);
    expect(types).toEqual(["work", "rest", "work"]);
  });

  it("builds correct phases for full config", () => {
    const { result } = renderHook(() => useTimer(FULL));
    const types = result.current.state.phases.map((p) => p.type);
    expect(types).toEqual([
      "prepare",
      "work", "rest", "work",
      "recovery",
      "work", "rest", "work",
      "cooldown",
    ]);
  });

  it("start transitions to running", () => {
    const { result } = renderHook(() => useTimer(SIMPLE));
    act(() => { result.current.start(); });
    expect(result.current.state.status).toBe("running");
    expect(result.current.state.phases[0].status).toBe("active");
  });

  it("start transitions to prepare phase when prepareDuration > 0", () => {
    const { result } = renderHook(() => useTimer(FULL));
    act(() => { result.current.start(); });
    expect(result.current.state.phases[0].type).toBe("prepare");
    expect(result.current.state.phases[0].status).toBe("active");
    expect(result.current.state.secondsLeft).toBe(3);
  });

  it("phases advance correctly on tick", () => {
    const { result } = renderHook(() => useTimer(SIMPLE));
    act(() => { result.current.start(); });
    expect(result.current.state.phases[0].type).toBe("work");

    // Advance 10 seconds — work phase ends, rest begins
    act(() => { vi.advanceTimersByTime(10000); });
    expect(result.current.state.activePhaseIndex).toBe(1);
    expect(result.current.state.phases[1].type).toBe("rest");
    expect(result.current.state.secondsLeft).toBe(5);
  });

  it("reaches done status at the end", () => {
    const { result } = renderHook(() => useTimer(SIMPLE));
    act(() => { result.current.start(); });

    // Total: work(10) + rest(5) + work(10) = 25s
    act(() => { vi.advanceTimersByTime(25000); });
    expect(result.current.state.status).toBe("done");
  });

  it("skip advances to next phase", () => {
    const { result } = renderHook(() => useTimer(SIMPLE));
    act(() => { result.current.start(); });
    expect(result.current.state.activePhaseIndex).toBe(0);

    act(() => { result.current.skip(); });
    expect(result.current.state.activePhaseIndex).toBe(1);
  });

  it("pause and resume work", () => {
    const { result } = renderHook(() => useTimer(SIMPLE));
    act(() => { result.current.start(); });
    expect(result.current.state.status).toBe("running");

    act(() => { result.current.pause(); });
    expect(result.current.state.status).toBe("paused");

    const remaining = result.current.state.secondsLeft;
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.state.secondsLeft).toBe(remaining); // unchanged

    act(() => { result.current.resume(); });
    expect(result.current.state.status).toBe("running");
  });

  it("reset returns to idle", () => {
    const { result } = renderHook(() => useTimer(SIMPLE));
    act(() => { result.current.start(); });
    act(() => { vi.advanceTimersByTime(5000); });

    act(() => { result.current.reset(); });
    expect(result.current.state.status).toBe("idle");
    expect(result.current.state.elapsedSeconds).toBe(0);
  });

  it("totalSecondsLeft is correctly set", () => {
    const { result } = renderHook(() => useTimer(SIMPLE));
    // work(10) + rest(5) + work(10) = 25
    expect(result.current.state.totalSecondsLeft).toBe(25);
  });

  it("rest-only config works", () => {
    const { result } = renderHook(() => useTimer(REST_ONLY));
    act(() => { result.current.start(); });
    expect(result.current.state.phases[0].type).toBe("work");
    expect(result.current.state.secondsLeft).toBe(120);

    act(() => { vi.advanceTimersByTime(120000); });
    expect(result.current.state.status).toBe("done");
  });
});
