import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  // Pathname côté élève (sans préfixe locale) — le middleware réécrit en
  // interne. LocaleLink ne préfixe donc pas le href.
  usePathname: () => "/onboarding",
}));

vi.mock("@/lib/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (key: string) => key, lang: "fr", setLang: () => {} }),
}));

import { OnboardingWizard } from "./OnboardingWizard";
import { OnboardingBanner } from "@/components/OnboardingBanner";

const LS_DONE = "eps_onboarding_done";
const LS_DISMISSED = "eps_onboarding_dismissed";
const LS_LEVEL = "eps_onboarding_level";
const LS_GOAL = "eps_onboarding_goal";

/* ── localStorage flags ──────────────────────────────────────────── */

describe("Onboarding — localStorage flags", () => {
  beforeEach(() => localStorage.clear());

  it("onboarding-done absent → onboarding not done", () => {
    expect(localStorage.getItem(LS_DONE)).toBeNull();
  });

  it("onboarding-done = 'true' → onboarding completed", () => {
    localStorage.setItem(LS_DONE, "true");
    expect(localStorage.getItem(LS_DONE)).toBe("true");
  });

  it("onboarding-dismissed = 'true' → banner dismissed", () => {
    localStorage.setItem(LS_DISMISSED, "true");
    expect(localStorage.getItem(LS_DISMISSED)).toBe("true");
  });
});

/* ── OnboardingWizard — 3 écrans ─────────────────────────────────── */

describe("OnboardingWizard", () => {
  beforeEach(() => localStorage.clear());

  it("renders step 1 (chooseLevel) by default", () => {
    render(<OnboardingWizard />);
    expect(screen.getByText("onboarding.chooseLevel")).toBeDefined();
  });

  it("shows 3 level options", () => {
    render(<OnboardingWizard />);
    expect(screen.getByText("onboarding.levelSeconde")).toBeDefined();
    expect(screen.getByText("onboarding.levelPremiere")).toBeDefined();
    expect(screen.getByText("onboarding.levelTerminale")).toBeDefined();
  });

  it("Next disabled until level selected", () => {
    render(<OnboardingWizard />);
    const nextBtn = screen.getByText("onboarding.next").closest("button")!;
    expect(nextBtn.hasAttribute("disabled")).toBe(true);
  });

  it("selecting a level enables Next", () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByText("onboarding.levelSeconde").closest("button")!);
    const nextBtn = screen.getByText("onboarding.next").closest("button")!;
    expect(nextBtn.hasAttribute("disabled")).toBe(false);
  });

  it("step 2 shows 3 objectif choices", () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByText("onboarding.levelSeconde").closest("button")!);
    fireEvent.click(screen.getByText("onboarding.next").closest("button")!);
    expect(screen.getByText("onboarding.chooseObjectif")).toBeDefined();
    expect(screen.getByText("onboarding.objEndurance")).toBeDefined();
    expect(screen.getByText("onboarding.objVolume")).toBeDefined();
    expect(screen.getByText("onboarding.objPuissance")).toBeDefined();
  });

  it("step 3 shows welcome + letsGo button", () => {
    render(<OnboardingWizard />);
    // Step 1 → select level → next
    fireEvent.click(screen.getByText("onboarding.levelSeconde").closest("button")!);
    fireEvent.click(screen.getByText("onboarding.next").closest("button")!);
    // Step 2 → select goal → next
    fireEvent.click(screen.getByText("onboarding.objEndurance").closest("button")!);
    // Find the second "next" button (step 2 has back + next)
    const buttons = screen.getAllByText("onboarding.next");
    fireEvent.click(buttons[buttons.length - 1].closest("button")!);
    // Step 3
    expect(screen.getByText("onboarding.welcomeTitle")).toBeDefined();
    expect(screen.getByText("onboarding.letsGo")).toBeDefined();
  });

  it("finishing stores level, goal and done flag", () => {
    render(<OnboardingWizard />);
    // Step 1
    fireEvent.click(screen.getByText("onboarding.levelTerminale").closest("button")!);
    fireEvent.click(screen.getByText("onboarding.next").closest("button")!);
    // Step 2
    fireEvent.click(screen.getByText("onboarding.objPuissance").closest("button")!);
    const buttons = screen.getAllByText("onboarding.next");
    fireEvent.click(buttons[buttons.length - 1].closest("button")!);
    // Step 3 — finish
    fireEvent.click(screen.getByText("onboarding.letsGo").closest("button")!);
    expect(localStorage.getItem(LS_LEVEL)).toBe("terminale");
    expect(localStorage.getItem(LS_GOAL)).toBe("puissance");
    expect(localStorage.getItem(LS_DONE)).toBe("true");
  });
});

/* ── OnboardingBanner ────────────────────────────────────────────── */

describe("OnboardingBanner", () => {
  beforeEach(() => localStorage.clear());

  it("renders banner when onboarding not done and not dismissed", () => {
    render(<OnboardingBanner />);
    expect(screen.getByText("onboarding.bannerTitle")).toBeDefined();
  });

  it("does not render when onboarding is done", () => {
    localStorage.setItem(LS_DONE, "true");
    const { container } = render(<OnboardingBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("does not render when banner was dismissed", () => {
    localStorage.setItem(LS_DISMISSED, "true");
    const { container } = render(<OnboardingBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("close button sets dismissed flag", () => {
    render(<OnboardingBanner />);
    fireEvent.click(screen.getByLabelText("onboarding.bannerClose"));
    expect(localStorage.getItem(LS_DISMISSED)).toBe("true");
  });

  it("CTA links to /onboarding", () => {
    render(<OnboardingBanner />);
    const cta = screen.getByText(/onboarding\.bannerCta/).closest("a");
    expect(cta?.getAttribute("href")).toBe("/onboarding");
  });
});
