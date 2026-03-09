import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/link
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

// Mock next/dynamic — render child synchronously
vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: (loader: () => Promise<{ default: React.ComponentType<unknown> }>) => {
    let Comp: React.ComponentType<unknown> | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const loadResult = loader() as any;
    if (loadResult && typeof loadResult.then === "function") {
      loadResult.then((m: { default: React.ComponentType<unknown> }) => { Comp = m.default; });
    }
    // Return a wrapper that renders the loaded component or nothing
    return function DynamicWrapper(props: Record<string, unknown>) {
      return Comp ? <Comp {...props} /> : null;
    };
  },
}));

// Mock useI18n — return key as-is
vi.mock("@/lib/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (key: string) => key, lang: "fr" }),
}));

// Mock audio modules
vi.mock("@/lib/audio/speech", () => ({
  speak: vi.fn(),
  speakCountdown: vi.fn(),
}));

// Stub AudioContext and navigator.vibrate
beforeEach(() => {
  vi.clearAllMocks();
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

describe("Timer — preset grid", () => {
  it("renders 6 preset cards", () => {
    render(<Timer />);
    expect(screen.getByText("timer.presets.repos.name")).toBeDefined();
    expect(screen.getByText("timer.presets.emom.name")).toBeDefined();
    expect(screen.getByText("timer.presets.amrap.name")).toBeDefined();
    expect(screen.getByText("timer.presets.circuit.name")).toBeDefined();
    expect(screen.getByText("timer.presets.tabata.name")).toBeDefined();
    expect(screen.getByText("timer.presets.custom.name")).toBeDefined();
  });

  it("shows select preset instruction", () => {
    render(<Timer />);
    expect(screen.getByText("timer.selectPreset")).toBeDefined();
  });

  it("shows back link to outils", () => {
    render(<Timer />);
    const link = screen.getByText((_, el) =>
      el?.tagName === "A" && el?.textContent?.includes("outils.backLabel") || false,
    );
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/outils");
  });
});

describe("Timer — config panel", () => {
  it("clicking Repos shows rest duration chips", () => {
    render(<Timer />);
    fireEvent.click(screen.getByText("timer.presets.repos.name"));
    // Config panel header
    expect(screen.getByText("timer.presets.repos.desc")).toBeDefined();
    // Rest chips: 30s, 45s, 1min, 1min30, 2min, 3min
    expect(screen.getByText("30s")).toBeDefined();
    expect(screen.getByText("1min30")).toBeDefined();
    expect(screen.getByText("3min")).toBeDefined();
  });

  it("clicking EMOM shows rounds chips", () => {
    render(<Timer />);
    fireEvent.click(screen.getByText("timer.presets.emom.name"));
    expect(screen.getByText("8 min")).toBeDefined();
    expect(screen.getByText("10 min")).toBeDefined();
  });

  it("shows start button and estimated duration", () => {
    render(<Timer />);
    fireEvent.click(screen.getByText("timer.presets.repos.name"));
    expect(screen.getByText("timer.startButton")).toBeDefined();
    expect(screen.getByText("timer.estimatedDuration")).toBeDefined();
  });

  it("back button from config returns to presets", () => {
    render(<Timer />);
    fireEvent.click(screen.getByText("timer.presets.tabata.name"));
    // We should see the config view
    expect(screen.getByText("timer.presets.tabata.desc")).toBeDefined();

    // Click back
    fireEvent.click(screen.getByText((_, el) =>
      el?.textContent?.includes("apprendre.timer.title") && el?.tagName === "BUTTON" || false,
    ));
    // Should be back to presets
    expect(screen.getByText("timer.selectPreset")).toBeDefined();
  });

  it("Tabata config shows stepper controls", () => {
    render(<Timer />);
    fireEvent.click(screen.getByText("timer.presets.tabata.name"));
    expect(screen.getByText("timer.config.work")).toBeDefined();
    expect(screen.getByText("timer.config.rest")).toBeDefined();
    expect(screen.getByText("timer.config.rounds")).toBeDefined();
  });

  it("changing Repos chip updates estimated duration", () => {
    render(<Timer />);
    fireEvent.click(screen.getByText("timer.presets.repos.name"));
    // Default repos = 120s → estimated "2min" shown in duration span
    const durationSpan = screen.getByText("2min", { selector: ".tabular-nums" });
    expect(durationSpan).toBeDefined();
    // Click 30s chip
    fireEvent.click(screen.getByText("30s"));
    // Estimated duration should now show "0min 30s"
    expect(screen.getByText("0min 30s")).toBeDefined();
  });
});
