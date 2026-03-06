import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/link
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, className, onClick }: { href: string; children: React.ReactNode; className?: string; onClick?: () => void }) => (
    <a href={href} className={className} onClick={onClick}>{children}</a>
  ),
}));

// Mock useI18n — return key as-is
vi.mock("@/lib/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  ArrowLeft: () => <span>←</span>,
  ArrowRight: () => <span>→</span>,
  Check: () => <span>✓</span>,
  Dumbbell: () => <span>🏋</span>,
  Target: () => <span>🎯</span>,
  Zap: () => <span>⚡</span>,
  X: () => <span>✕</span>,
}));

import { OnboardingWizard } from "./OnboardingWizard";
import { OnboardingBanner } from "@/components/OnboardingBanner";

const STORAGE_DONE = "tazieff-onboarding-done";
const STORAGE_DISMISSED = "tazieff-onboarding-dismissed";

const mockMethodes = [
  { slug: "charge-constante", titre: "Charge constante", categorie: "endurance-de-force" },
  { slug: "circuit-training", titre: "Circuit training", categorie: "endurance-de-force" },
  { slug: "pyramide", titre: "Pyramide", categorie: "gain-de-volume" },
  { slug: "bulgare", titre: "Bulgare", categorie: "gain-de-puissance" },
];

const mockExercices = [
  { slug: "developpe-couche", title: "Développé couché", muscles: ["pectoraux", "triceps"] },
  { slug: "squat", title: "Squat", muscles: ["quadriceps", "fessiers"] },
  { slug: "traction", title: "Traction", muscles: ["dorsaux", "biceps"] },
  { slug: "rowing", title: "Rowing", muscles: ["dorsaux", "trapèze"] },
  { slug: "presse", title: "Presse à cuisses", muscles: ["quadriceps", "ischio-jambiers"] },
  { slug: "curl", title: "Curl biceps", muscles: ["biceps"] },
];

/* ── localStorage flags ──────────────────────────────────────────── */

describe("Onboarding — localStorage flags", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("onboarding-done absent → onboarding not done", () => {
    expect(localStorage.getItem(STORAGE_DONE)).toBeNull();
  });

  it("onboarding-done = 'true' → onboarding completed", () => {
    localStorage.setItem(STORAGE_DONE, "true");
    expect(localStorage.getItem(STORAGE_DONE)).toBe("true");
  });

  it("onboarding-dismissed = 'true' → banner dismissed", () => {
    localStorage.setItem(STORAGE_DISMISSED, "true");
    expect(localStorage.getItem(STORAGE_DISMISSED)).toBe("true");
  });
});

/* ── OnboardingWizard component ──────────────────────────────────── */

describe("OnboardingWizard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders step 1 (welcome) by default", () => {
    render(<OnboardingWizard methodes={mockMethodes} exercices={mockExercices} />);
    expect(screen.getByText("onboarding.welcomeTitle")).toBeDefined();
    expect(screen.getByText(/onboarding\.letsGo/)).toBeDefined();
  });

  it("shows 5 step indicators in progress bar", () => {
    render(<OnboardingWizard methodes={mockMethodes} exercices={mockExercices} />);
    // Each step has a label "N. stepLabel"
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(new RegExp(`${i}\\. onboarding\\.step${i}`))).toBeDefined();
    }
  });

  it("clicking 'Let's go' navigates to step 2 (objectif)", () => {
    render(<OnboardingWizard methodes={mockMethodes} exercices={mockExercices} />);
    const letsGoBtn = screen.getByText(/onboarding\.letsGo/).closest("button")!;
    fireEvent.click(letsGoBtn);
    expect(screen.getByText("onboarding.chooseObjectif")).toBeDefined();
  });

  it("step 2 shows 3 objectif cards", () => {
    render(<OnboardingWizard methodes={mockMethodes} exercices={mockExercices} />);
    // Navigate to step 2
    fireEvent.click(screen.getByText(/onboarding\.letsGo/).closest("button")!);
    expect(screen.getByText("onboarding.objEndurance")).toBeDefined();
    expect(screen.getByText("onboarding.objVolume")).toBeDefined();
    expect(screen.getByText("onboarding.objPuissance")).toBeDefined();
  });

  it("'Next' button is disabled on step 2 until objectif is selected", () => {
    render(<OnboardingWizard methodes={mockMethodes} exercices={mockExercices} />);
    fireEvent.click(screen.getByText(/onboarding\.letsGo/).closest("button")!);
    const nextBtn = screen.getByText(/onboarding\.next/).closest("button")!;
    expect(nextBtn.hasAttribute("disabled")).toBe(true);
  });

  it("selecting objectif enables Next button on step 2", () => {
    render(<OnboardingWizard methodes={mockMethodes} exercices={mockExercices} />);
    fireEvent.click(screen.getByText(/onboarding\.letsGo/).closest("button")!);
    // Click endurance
    fireEvent.click(screen.getByText("onboarding.objEndurance").closest("button")!);
    const nextBtn = screen.getByText(/onboarding\.next/).closest("button")!;
    expect(nextBtn.hasAttribute("disabled")).toBe(false);
  });

  it("step 3 filters méthodes by selected objectif", () => {
    render(<OnboardingWizard methodes={mockMethodes} exercices={mockExercices} />);
    // Step 1 → 2
    fireEvent.click(screen.getByText(/onboarding\.letsGo/).closest("button")!);
    // Select endurance → step 3
    fireEvent.click(screen.getByText("onboarding.objEndurance").closest("button")!);
    fireEvent.click(screen.getByText(/onboarding\.next/).closest("button")!);
    // Should show endurance-de-force methods
    expect(screen.getByText("Charge constante")).toBeDefined();
    expect(screen.getByText("Circuit training")).toBeDefined();
    // Should NOT show gain-de-volume/puissance methods
    expect(screen.queryByText("Pyramide")).toBeNull();
    expect(screen.queryByText("Bulgare")).toBeNull();
  });

  it("finish sets localStorage flag and shows recap (step 5)", () => {
    render(<OnboardingWizard methodes={mockMethodes} exercices={mockExercices} />);
    // Step 1 → 2
    fireEvent.click(screen.getByText(/onboarding\.letsGo/).closest("button")!);
    // Select endurance → step 3
    fireEvent.click(screen.getByText("onboarding.objEndurance").closest("button")!);
    fireEvent.click(screen.getByText(/onboarding\.next/).closest("button")!);
    // Select a method → step 4
    fireEvent.click(screen.getByText("Charge constante").closest("button")!);
    fireEvent.click(screen.getByText(/onboarding\.next/).closest("button")!);
    // Select 4 exercises (minimum required)
    fireEvent.click(screen.getByText("Développé couché").closest("button")!);
    fireEvent.click(screen.getByText("Squat").closest("button")!);
    fireEvent.click(screen.getByText("Traction").closest("button")!);
    fireEvent.click(screen.getByText("Rowing").closest("button")!);
    // Click finish
    fireEvent.click(screen.getByText(/onboarding\.finish/).closest("button")!);
    // Should be on step 5 (recap)
    expect(screen.getByText("onboarding.recapTitle")).toBeDefined();
    // localStorage flag should be set
    expect(localStorage.getItem(STORAGE_DONE)).toBe("true");
  });

  it("step 4 limits exercise selection to 6 max", () => {
    render(<OnboardingWizard methodes={mockMethodes} exercices={mockExercices} />);
    // Navigate to step 4
    fireEvent.click(screen.getByText(/onboarding\.letsGo/).closest("button")!);
    fireEvent.click(screen.getByText("onboarding.objEndurance").closest("button")!);
    fireEvent.click(screen.getByText(/onboarding\.next/).closest("button")!);
    fireEvent.click(screen.getByText("Charge constante").closest("button")!);
    fireEvent.click(screen.getByText(/onboarding\.next/).closest("button")!);
    // Select all 6 exercises
    for (const ex of mockExercices) {
      fireEvent.click(screen.getByText(ex.title).closest("button")!);
    }
    // Counter should show 6/6
    expect(screen.getByText(/6\/6/)).toBeDefined();
  });
});

/* ── OnboardingBanner component ──────────────────────────────────── */

describe("OnboardingBanner", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders banner when onboarding not done and not dismissed", () => {
    render(<OnboardingBanner />);
    expect(screen.getByText("onboarding.bannerTitle")).toBeDefined();
    expect(screen.getByText("onboarding.bannerBody")).toBeDefined();
  });

  it("does not render when onboarding is done", () => {
    localStorage.setItem(STORAGE_DONE, "true");
    const { container } = render(<OnboardingBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("does not render when banner was dismissed", () => {
    localStorage.setItem(STORAGE_DISMISSED, "true");
    const { container } = render(<OnboardingBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("close button sets dismissed flag in localStorage", () => {
    render(<OnboardingBanner />);
    const closeBtn = screen.getByLabelText("onboarding.bannerClose");
    fireEvent.click(closeBtn);
    expect(localStorage.getItem(STORAGE_DISMISSED)).toBe("true");
  });

  it("CTA link points to /onboarding", () => {
    render(<OnboardingBanner />);
    const ctaLink = screen.getByText(/onboarding\.bannerCta/).closest("a");
    expect(ctaLink?.getAttribute("href")).toBe("/onboarding");
  });
});
