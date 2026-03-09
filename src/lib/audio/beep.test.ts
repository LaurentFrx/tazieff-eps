import { describe, it, expect, vi, beforeEach } from "vitest";
import { playBeep, beepCountdown, beepWork, beepRest, beepDone } from "./beep";

const mockStart = vi.fn();
const mockStop = vi.fn();
const mockConnect = vi.fn();
const mockSetValue = vi.fn();
const mockRamp = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("AudioContext", class {
    createOscillator() {
      return { connect: mockConnect, frequency: { value: 0 }, start: mockStart, stop: mockStop };
    }
    createGain() {
      return {
        connect: mockConnect,
        gain: { value: 0, setValueAtTime: mockSetValue, exponentialRampToValueAtTime: mockRamp },
      };
    }
    get destination() { return {}; }
    get currentTime() { return 0; }
  });
  Object.defineProperty(navigator, "vibrate", { value: vi.fn(), writable: true, configurable: true });
});

describe("playBeep", () => {
  it("creates oscillator and starts it", () => {
    playBeep(880, 100);
    expect(mockStart).toHaveBeenCalled();
    expect(mockStop).toHaveBeenCalled();
  });

  it("sets gain volume", () => {
    playBeep(880, 100, 0.5);
    expect(mockSetValue).toHaveBeenCalledWith(0.5, 0);
  });
});

describe("beepCountdown", () => {
  it("plays beep and vibrates", () => {
    beepCountdown();
    expect(mockStart).toHaveBeenCalled();
    expect(navigator.vibrate).toHaveBeenCalledWith([50]);
  });
});

describe("beepWork", () => {
  it("plays beep and vibrates", () => {
    beepWork();
    expect(mockStart).toHaveBeenCalled();
    expect(navigator.vibrate).toHaveBeenCalledWith([200]);
  });
});

describe("beepRest", () => {
  it("plays beep and vibrates", () => {
    beepRest();
    expect(mockStart).toHaveBeenCalled();
    expect(navigator.vibrate).toHaveBeenCalledWith([100, 50, 100]);
  });
});

describe("beepDone", () => {
  it("plays beep and vibrates", () => {
    beepDone();
    expect(mockStart).toHaveBeenCalled();
    expect(navigator.vibrate).toHaveBeenCalledWith([500]);
  });
});
