import { describe, it, expect, vi, beforeEach } from "vitest";
import { playBeep, hapticFeedback, playCountdownBeep, playTransitionBeep } from "./beep";

const mockStart = vi.fn();
const mockStop = vi.fn();
const mockConnect = vi.fn();
const mockSetValue = vi.fn();
const mockRamp = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("AudioContext", class {
    createOscillator() {
      return { connect: mockConnect, type: "sine", frequency: { value: 0, setValueAtTime: vi.fn() }, start: mockStart, stop: mockStop };
    }
    createGain() {
      return {
        connect: mockConnect,
        gain: { value: 0, setValueAtTime: mockSetValue, exponentialRampToValueAtTime: mockRamp },
      };
    }
    createBuffer() { return {}; }
    createBufferSource() { return { buffer: null, connect: mockConnect, start: vi.fn() }; }
    get destination() { return {}; }
    get currentTime() { return 0; }
    get state() { return "running"; }
    resume() { return Promise.resolve(); }
  });
  Object.defineProperty(navigator, "vibrate", { value: vi.fn(), writable: true, configurable: true });
});

describe("playBeep", () => {
  it("creates oscillator and starts it", () => {
    playBeep(880, 0.1);
    expect(mockStart).toHaveBeenCalled();
    expect(mockStop).toHaveBeenCalled();
  });

  it("sets gain volume", () => {
    playBeep(880, 0.1, 0.5);
    expect(mockSetValue).toHaveBeenCalledWith(0.5, 0);
  });
});

describe("hapticFeedback", () => {
  it("calls navigator.vibrate on Android", () => {
    hapticFeedback("tap");
    expect(navigator.vibrate).toHaveBeenCalledWith([50]);
  });

  it("calls vibrate with double pattern", () => {
    hapticFeedback("double");
    expect(navigator.vibrate).toHaveBeenCalledWith([80, 40, 80]);
  });

  it("calls vibrate with heavy pattern", () => {
    hapticFeedback("heavy");
    expect(navigator.vibrate).toHaveBeenCalledWith([400]);
  });

  it("falls back to audio thump when vibrate not available", () => {
    Object.defineProperty(navigator, "vibrate", { value: undefined, writable: true, configurable: true });
    hapticFeedback("tap");
    // Should play audio thump instead — oscillator started
    expect(mockStart).toHaveBeenCalled();
  });
});

describe("playCountdownBeep", () => {
  it("plays beep for seconds 0-2", () => {
    playCountdownBeep(2);
    expect(mockStart).toHaveBeenCalled();
  });

  it("plays GO beep at 0", () => {
    playCountdownBeep(0);
    expect(mockStart).toHaveBeenCalled();
  });

  it("does not play beep outside 2-1-0 range", () => {
    mockStart.mockClear();
    playCountdownBeep(3);
    expect(mockStart).not.toHaveBeenCalled();
    playCountdownBeep(5);
    expect(mockStart).not.toHaveBeenCalled();
  });
});

describe("playTransitionBeep", () => {
  it("plays a beep", () => {
    playTransitionBeep();
    expect(mockStart).toHaveBeenCalled();
  });
});
