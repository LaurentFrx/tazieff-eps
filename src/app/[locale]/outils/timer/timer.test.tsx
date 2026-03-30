import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/navigation before importing I18nProvider (which uses useRouter/usePathname)
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/outils/timer",
  useSearchParams: () => new URLSearchParams(),
}));

import { I18nProvider } from "@/lib/i18n/I18nProvider";

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

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nProvider initialLang="fr">{ui}</I18nProvider>);
}

describe("Timer page — preset grid", () => {
  it("renders 6 preset cards", () => {
    renderWithI18n(<TimerPage />);
    expect(screen.getByText("Tabata")).toBeDefined();
    expect(screen.getByText("EMOM")).toBeDefined();
    expect(screen.getByText("AMRAP")).toBeDefined();
    expect(screen.getByText("Circuit Training")).toBeDefined();
    expect(screen.getByText("Repos")).toBeDefined();
    expect(screen.getByText("Personnalisé")).toBeDefined();
  });

  it("renders the Timer heading", () => {
    renderWithI18n(<TimerPage />);
    expect(screen.getByText("Timer")).toBeDefined();
  });

  it("shows instruction text", () => {
    renderWithI18n(<TimerPage />);
    expect(screen.getByText(/Choisis un format/)).toBeDefined();
  });
});
