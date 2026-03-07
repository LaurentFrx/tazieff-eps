import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock next/link
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

// Mock useI18n — return key as-is
vi.mock("@/lib/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

// Stub AudioContext and navigator.vibrate (jsdom doesn't support them)
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

import { Timer } from "./Timer";

describe("Timer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the 3 mode buttons", () => {
    render(<Timer />);
    expect(screen.getByText("apprendre.timer.modeRecup")).toBeDefined();
    expect(screen.getByText("apprendre.timer.modeEmom")).toBeDefined();
    expect(screen.getByText("apprendre.timer.modeAmrap")).toBeDefined();
  });

  it("displays time in MM:SS format on initial render (recup mode)", () => {
    render(<Timer />);
    // Default recup = 120s = 02:00
    expect(screen.getByText("02:00")).toBeDefined();
  });

  it("renders start and reset buttons", () => {
    render(<Timer />);
    expect(screen.getByText("methodes.timer.start")).toBeDefined();
    expect(screen.getByText("methodes.timer.reset")).toBeDefined();
  });

  it("shows recup presets (30s, 60s, 90s, 120s, 180s)", () => {
    render(<Timer />);
    expect(screen.getByText("30s")).toBeDefined();
    expect(screen.getByText("1min")).toBeDefined();
    expect(screen.getByText("1.5min")).toBeDefined();
    expect(screen.getByText("2min")).toBeDefined();
    expect(screen.getByText("3min")).toBeDefined();
  });

  it("changes duration when clicking a preset", () => {
    render(<Timer />);
    fireEvent.click(screen.getByText("30s"));
    expect(screen.getByText("00:30")).toBeDefined();
  });

  it("switches to EMOM mode and shows round config", () => {
    render(<Timer />);
    fireEvent.click(screen.getByText("apprendre.timer.modeEmom"));
    expect(screen.getByText("apprendre.timer.rounds")).toBeDefined();
    // Default EMOM time = 60s = 01:00
    expect(screen.getByText("01:00")).toBeDefined();
  });

  it("switches to AMRAP mode and shows duration config", () => {
    render(<Timer />);
    fireEvent.click(screen.getByText("apprendre.timer.modeAmrap"));
    expect(screen.getByText("apprendre.timer.duration")).toBeDefined();
    // Default AMRAP = 10min = 10:00
    expect(screen.getByText("10:00")).toBeDefined();
  });

  it("shows pause button when running", () => {
    render(<Timer />);
    fireEvent.click(screen.getByText("methodes.timer.start"));
    expect(screen.getByText("methodes.timer.pause")).toBeDefined();
  });

  it("countdown ticks in recup mode", () => {
    render(<Timer />);
    // Preset to 30s first
    fireEvent.click(screen.getByText("30s"));
    expect(screen.getByText("00:30")).toBeDefined();

    // Start
    fireEvent.click(screen.getByText("methodes.timer.start"));

    // Advance 5 seconds
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getByText("00:25")).toBeDefined();
  });

  it("reset restores initial duration", () => {
    render(<Timer />);
    fireEvent.click(screen.getByText("30s"));
    fireEvent.click(screen.getByText("methodes.timer.start"));
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getByText("00:25")).toBeDefined();

    fireEvent.click(screen.getByText("methodes.timer.pause"));
    fireEvent.click(screen.getByText("methodes.timer.reset"));
    expect(screen.getByText("00:30")).toBeDefined();
  });

  it("shows done message when timer reaches zero", () => {
    render(<Timer />);
    fireEvent.click(screen.getByText("30s"));
    fireEvent.click(screen.getByText("methodes.timer.start"));
    act(() => { vi.advanceTimersByTime(30000); });
    expect(screen.getByText("apprendre.timer.done")).toBeDefined();
  });

  it("AMRAP round counter increments and decrements", () => {
    render(<Timer />);
    fireEvent.click(screen.getByText("apprendre.timer.modeAmrap"));
    // Initial rounds = 0
    expect(screen.getByText("0")).toBeDefined();
    // Click +
    fireEvent.click(screen.getByText("+"));
    expect(screen.getByText("1")).toBeDefined();
    fireEvent.click(screen.getByText("+"));
    expect(screen.getByText("2")).toBeDefined();
    // Click −
    fireEvent.click(screen.getByText("−"));
    expect(screen.getByText("1")).toBeDefined();
  });
});
