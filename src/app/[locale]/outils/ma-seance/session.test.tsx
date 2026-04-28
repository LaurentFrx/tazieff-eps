import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/link");
vi.mock("@/lib/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (key: string) => key, lang: "fr" }),
}));

// Mock useSearchParams + usePathname (utilisé par LocaleLink depuis P0.7-quater)
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/outils/ma-seance",
}));

import { SessionGenerator } from "./SessionGenerator";
import type { MethodeFrontmatter } from "@/lib/content/schema";
import type { LiveExerciseListItem } from "@/lib/live/types";

const STORAGE_KEY = "eps_session";

const mockMethodes: MethodeFrontmatter[] = [
  {
    slug: "charge-constante",
    titre: "Charge constante",
    soustitre: "",
    description: "Test description",
    categorie: "endurance-de-force",
    niveau_minimum: "seconde",
    scores: { endurance: 4, hypertrophie: 3, force: 2, puissance: 1 },
    parametres: { series: "3-4", repetitions: "12-15", intensite: "60-65%", recuperation: "1min30" },
    timer: false,
    mots_cles: [],
    methodes_complementaires: [],
    exercices_compatibles: ["squat", "developpe-couche", "rowing"],
  },
  {
    slug: "pyramide",
    titre: "Pyramide",
    soustitre: "",
    description: "Pyramid sets",
    categorie: "gain-de-volume",
    niveau_minimum: "premiere",
    scores: { endurance: 2, hypertrophie: 5, force: 3, puissance: 2 },
    parametres: { series: "4-5", repetitions: "12-8-6-8-12", intensite: "60-80%", recuperation: "2min" },
    timer: false,
    mots_cles: [],
    methodes_complementaires: [],
    exercices_compatibles: ["squat", "curl-biceps"],
  },
  {
    slug: "bi-set",
    titre: "Bi-set",
    soustitre: "",
    description: "Two exercises paired",
    categorie: "gain-de-puissance",
    niveau_minimum: "terminale",
    scores: { endurance: 2, hypertrophie: 3, force: 4, puissance: 5 },
    parametres: { series: "4", repetitions: "6-8", intensite: "80-85%", recuperation: "3min" },
    timer: false,
    mots_cles: [],
    methodes_complementaires: [],
    exercices_compatibles: ["squat"],
  },
] as MethodeFrontmatter[];

const mockExercices: LiveExerciseListItem[] = [
  { slug: "squat", title: "Squat", muscles: ["Quadriceps", "Fessiers"], tags: [], media: "", level: "debutant", themeCompatibility: [], equipment: [] },
  { slug: "developpe-couche", title: "Développé couché", muscles: ["Pectoraux", "Triceps"], tags: [], media: "", level: "debutant", themeCompatibility: [], equipment: [] },
  { slug: "rowing", title: "Rowing", muscles: ["Dos", "Biceps"], tags: [], media: "", level: "debutant", themeCompatibility: [], equipment: [] },
  { slug: "curl-biceps", title: "Curl biceps", muscles: ["Biceps"], tags: [], media: "", level: "debutant", themeCompatibility: [], equipment: [] },
  { slug: "extension-triceps", title: "Extension triceps", muscles: ["Triceps"], tags: [], media: "", level: "intermediaire", themeCompatibility: [], equipment: [] },
  { slug: "fentes", title: "Fentes", muscles: ["Quadriceps", "Fessiers"], tags: [], media: "", level: "debutant", themeCompatibility: [], equipment: [] },
  { slug: "dips", title: "Dips", muscles: ["Pectoraux", "Triceps"], tags: [], media: "", level: "intermediaire", themeCompatibility: [], equipment: [] },
  { slug: "gainage", title: "Gainage", muscles: ["Abdominaux"], tags: [], media: "", level: "debutant", themeCompatibility: [], equipment: [] },
] as LiveExerciseListItem[];

const defaultProps = {
  allMethodes: mockMethodes,
  allExercices: mockExercices,
  categoryLabels: {
    "endurance-de-force": "Endurance de force",
    "gain-de-volume": "Gain de volume",
    "gain-de-puissance": "Gain de puissance",
  },
  scoreLabels: {
    endurance: "Endurance",
    hypertrophie: "Hypertrophie",
    force: "Force",
    puissance: "Puissance",
  },
  parametresLabels: {
    series: "Séries",
    repetitions: "Répétitions",
    intensite: "Intensité",
    recuperation: "Récupération",
    duree: "Durée",
  },
};

describe("SessionGenerator", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders step 1 with objectif cards on mount", () => {
    render(<SessionGenerator {...defaultProps} />);
    expect(screen.getByText("maSeance.title")).toBeDefined();
    expect(screen.getByText("maSeance.objectifEndurance")).toBeDefined();
    expect(screen.getByText("maSeance.objectifVolume")).toBeDefined();
    expect(screen.getByText("maSeance.objectifPuissance")).toBeDefined();
  });

  it("shows 3 stepper indicators", () => {
    render(<SessionGenerator {...defaultProps} />);
    expect(screen.getByText("maSeance.stepObjectif")).toBeDefined();
    expect(screen.getByText("maSeance.stepMethodes")).toBeDefined();
    expect(screen.getByText("maSeance.stepExercices")).toBeDefined();
  });

  it("advances to step 2 when objectif is selected", () => {
    render(<SessionGenerator {...defaultProps} />);
    fireEvent.click(screen.getByText("maSeance.objectifEndurance"));
    // Step 2 should show method list
    expect(screen.getByText("Charge constante")).toBeDefined();
  });

  it("shows all methodes for selected objectif regardless of niveau", () => {
    render(<SessionGenerator {...defaultProps} />);
    fireEvent.click(screen.getByText("maSeance.objectifVolume"));
    // Pyramide (gain-de-volume, niveau_minimum: premiere) should appear without niveau filter
    expect(screen.getByText("Pyramide")).toBeDefined();
  });

  it("advances to step 3 when a methode is selected and next is clicked", () => {
    render(<SessionGenerator {...defaultProps} />);
    // Step 1: select endurance
    fireEvent.click(screen.getByText("maSeance.objectifEndurance"));
    // Step 2: select a method (minMethodes = 1)
    fireEvent.click(screen.getByText("Charge constante"));
    fireEvent.click(screen.getByText("maSeance.next"));
    // Step 3: exercises list
    expect(screen.getByText("0 / 6 maSeance.exercicesCount")).toBeDefined();
  });

  it("toggles exercises and shows count", () => {
    render(<SessionGenerator {...defaultProps} />);
    fireEvent.click(screen.getByText("maSeance.objectifEndurance"));
    fireEvent.click(screen.getByText("Charge constante"));
    fireEvent.click(screen.getByText("maSeance.next"));
    // Select one exercise
    fireEvent.click(screen.getByText("Squat"));
    expect(screen.getByText("1 / 6 maSeance.exercicesCount")).toBeDefined();
  });

  it("limits selection to max 6 exercises", () => {
    render(<SessionGenerator {...defaultProps} />);
    fireEvent.click(screen.getByText("maSeance.objectifEndurance"));
    fireEvent.click(screen.getByText("Charge constante"));
    fireEvent.click(screen.getByText("maSeance.next"));

    // Select 6 exercises
    const exNames = ["Squat", "Développé couché", "Rowing", "Curl biceps", "Extension triceps", "Fentes"];
    for (const name of exNames) {
      fireEvent.click(screen.getByText(name));
    }
    expect(screen.getByText("6 / 6 maSeance.exercicesCount")).toBeDefined();

    // 7th exercise button should be disabled
    const dipsBtn = screen.getByText("Dips").closest("button")!;
    expect(dipsBtn.hasAttribute("disabled")).toBe(true);
  });

  it("saves session to localStorage when generating", () => {
    render(<SessionGenerator {...defaultProps} />);
    fireEvent.click(screen.getByText("maSeance.objectifEndurance"));
    fireEvent.click(screen.getByText("Charge constante"));
    fireEvent.click(screen.getByText("maSeance.next"));

    // Select 6 exercises
    const exNames = ["Squat", "Développé couché", "Rowing", "Curl biceps", "Extension triceps", "Fentes"];
    for (const name of exNames) {
      fireEvent.click(screen.getByText(name));
    }

    fireEvent.click(screen.getByText("maSeance.generate"));
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const saved = JSON.parse(raw!);
    expect(saved.objectif).toBe("endurance-de-force");
    expect(saved.selectedExercices).toHaveLength(6);
  });

  it("restores session from localStorage on mount", () => {
    const saved = {
      niveau: "seconde",
      objectif: "endurance-de-force",
      selectedMethodes: ["charge-constante"],
      selectedExercices: ["squat", "developpe-couche", "rowing", "curl-biceps", "extension-triceps", "fentes"],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

    render(<SessionGenerator {...defaultProps} />);
    // Should jump to result step — heading appears twice (print-only + visible)
    expect(screen.getAllByText("maSeance.result.heading").length).toBeGreaterThanOrEqual(1);
  });
});
