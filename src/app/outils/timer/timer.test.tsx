import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock audio modules
vi.mock("@/lib/audio/beep", () => ({
  unlockAudio: vi.fn(),
  hapticFeedback: vi.fn(),
  playCountdownBeep: vi.fn(),
  playTransitionBeep: vi.fn(),
  playBeep: vi.fn(),
}));

vi.mock("@/lib/audio/speech", () => ({
  speakEvent: vi.fn(),
  setSpeechEnabled: vi.fn(),
  isSpeechEnabled: () => true,
  getRandomDoneMessage: () => "Bravo !",
}));

// Stub AudioContext and navigator.vibrate
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("AudioContext", class {
    createOscillator() { return { connect() {}, type: "sine", frequency: { value: 0, setValueAtTime() {} }, start() {}, stop() {} }; }
    createGain() { return { connect() {}, gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
    createBuffer() { return {}; }
    createBufferSource() { return { buffer: null, connect() {}, start() {} }; }
    get destination() { return {}; }
    close() {}
    get currentTime() { return 0; }
    get state() { return "running"; }
    resume() { return Promise.resolve(); }
  });
  Object.defineProperty(navigator, "vibrate", { value: vi.fn(), writable: true, configurable: true });
});

import TimerPage from "./page";

describe("Timer page — preset grid", () => {
  it("renders 6 preset cards", () => {
    render(<TimerPage />);
    expect(screen.getByText("TABATA")).toBeDefined();
    expect(screen.getByText("EMOM")).toBeDefined();
    expect(screen.getByText("AMRAP")).toBeDefined();
    expect(screen.getByText("CIRCUIT")).toBeDefined();
    expect(screen.getByText("REPOS")).toBeDefined();
    expect(screen.getByText("PERSONNALISÉ")).toBeDefined();
  });

  it("renders the Timer heading", () => {
    render(<TimerPage />);
    expect(screen.getByText("Timer")).toBeDefined();
  });

  it("shows instruction text", () => {
    render(<TimerPage />);
    expect(screen.getByText(/Choisissez un format/)).toBeDefined();
  });
});
