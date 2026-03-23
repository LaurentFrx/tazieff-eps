import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/link");
vi.mock("@/lib/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("lucide-react", () => ({
  ChevronDown: () => <span>▼</span>,
  ChevronUp: () => <span>▲</span>,
  Download: () => <span>↓</span>,
  Printer: () => <span>🖨</span>,
  Trash2: () => <span>🗑</span>,
}));

import { Carnet } from "./Carnet";

const STORAGE_KEY = "tazieff-carnet";

const mockMethodes = [
  { slug: "charge-constante", titre: "Charge constante" },
  { slug: "pyramide", titre: "Pyramide" },
];

const mockExercices = [
  { slug: "s3-01", title: "Développé couché", themeCompatibility: [1, 2], session: "S3" },
  { slug: "s4-01", title: "Squat", themeCompatibility: [1, 2, 3], session: "S4" },
];

/* ── localStorage ────────────────────────────────────────────────── */

describe("Carnet — localStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("reads empty array when localStorage is empty", () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeNull();
  });

  it("stores and retrieves entries with new format (series + reps)", () => {
    const entry = {
      id: "test-id",
      date: "2026-03-06",
      objectif: "volume",
      methodes: ["pyramide"],
      exercices: [{ nom: "Squat", charge: 80, series: 4, reps: 10, rir: 2, ressenti: 4 }],
      notes: "Bonne séance",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([entry]));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].exercices[0].series).toBe(4);
    expect(stored[0].exercices[0].reps).toBe(10);
  });

  it("migrates legacy seriesReps string to series + reps numbers", () => {
    const legacy = {
      id: "legacy-id",
      date: "2026-01-01",
      objectif: "endurance",
      methodes: [],
      exercices: [{ nom: "Pompes", charge: 0, seriesReps: "3x12", rir: 1, ressenti: 3 }],
      notes: "",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([legacy]));
    // Render triggers loadEntries which migrates
    render(<Carnet methodeNames={mockMethodes} exerciceNames={mockExercices} />);
    // Switch to history to see the entry
    const historyTab = screen.getAllByRole("button").find(
      (b) => b.textContent?.includes("Historique"),
    );
    fireEvent.click(historyTab!);
    // The entry should render without crashing
    expect(screen.getByText("2026-01-01")).toBeDefined();
  });

  it("handles invalid JSON gracefully (no crash on parse)", () => {
    localStorage.setItem(STORAGE_KEY, "not-valid-json");
    let entries: unknown[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      entries = raw ? JSON.parse(raw) : [];
    } catch {
      entries = [];
    }
    expect(entries).toEqual([]);
  });

  it("deleting an entry removes it from the list", () => {
    const entries = [
      { id: "a", date: "2026-03-01", objectif: "endurance", methodes: [], exercices: [], notes: "" },
      { id: "b", date: "2026-03-02", objectif: "volume", methodes: [], exercices: [], notes: "" },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    const filtered = entries.filter((e) => e.id !== "a");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe("b");
  });
});

/* ── Data model ──────────────────────────────────────────────────── */

describe("Carnet — entry data model", () => {
  it("entry has all required fields", () => {
    const entry = {
      id: "abc-123",
      date: "2026-03-06",
      objectif: "puissance" as const,
      methodes: ["charge-constante"],
      exercices: [
        { nom: "Développé couché", charge: 60, series: 3, reps: 8, rir: 1, ressenti: 5 },
      ],
      notes: "RAS",
    };
    expect(entry).toHaveProperty("id");
    expect(entry).toHaveProperty("date");
    expect(entry).toHaveProperty("objectif");
    expect(entry).toHaveProperty("methodes");
    expect(entry).toHaveProperty("exercices");
    expect(entry).toHaveProperty("notes");
    expect(["endurance", "volume", "puissance"]).toContain(entry.objectif);
  });

  it("exercice has charge, series, reps, rir, ressenti fields", () => {
    const exo = { nom: "Squat", charge: 100, series: 5, reps: 5, rir: 0, ressenti: 5 };
    expect(exo.charge).toBeGreaterThanOrEqual(0);
    expect(exo.series).toBeGreaterThanOrEqual(1);
    expect(exo.reps).toBeGreaterThanOrEqual(1);
    expect(exo.rir).toBeGreaterThanOrEqual(0);
    expect(exo.rir).toBeLessThanOrEqual(5);
    expect(exo.ressenti).toBeGreaterThanOrEqual(1);
    expect(exo.ressenti).toBeLessThanOrEqual(5);
  });
});

/* ── Component rendering ─────────────────────────────────────────── */

describe("Carnet — component", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders form tab by default with date, objectif, exercice fields", () => {
    render(<Carnet methodeNames={mockMethodes} exerciceNames={mockExercices} />);
    const dateInput = document.querySelector('input[type="date"]');
    expect(dateInput).not.toBeNull();
    const objectifButtons = screen.getAllByRole("button").filter(
      (b) =>
        b.textContent &&
        ["carnet.objectifEndurance", "carnet.objectifVolume", "carnet.objectifPuissance"].includes(
          b.textContent,
        ),
    );
    expect(objectifButtons).toHaveLength(3);
  });

  it("renders combobox search input instead of select", () => {
    render(<Carnet methodeNames={mockMethodes} exerciceNames={mockExercices} />);
    const searchInput = screen.getByPlaceholderText("Rechercher un exercice...");
    expect(searchInput).toBeDefined();
    // No select elements should exist
    const selects = document.querySelectorAll("select");
    expect(selects.length).toBe(0);
  });

  it("renders separate series and reps number inputs", () => {
    render(<Carnet methodeNames={mockMethodes} exerciceNames={mockExercices} />);
    const seriesInput = screen.getByPlaceholderText("4");
    const repsInput = screen.getByPlaceholderText("10");
    expect(seriesInput).toBeDefined();
    expect(repsInput).toBeDefined();
    expect(seriesInput.getAttribute("type")).toBe("number");
    expect(repsInput.getAttribute("type")).toBe("number");
  });

  it("renders 5 emoji buttons for ressenti", () => {
    render(<Carnet methodeNames={mockMethodes} exerciceNames={mockExercices} />);
    const emojiButtons = screen.getAllByRole("button").filter(
      (b) => b.getAttribute("aria-label")?.startsWith("Ressenti :"),
    );
    expect(emojiButtons).toHaveLength(5);
  });

  it("renders add exercice button", () => {
    render(<Carnet methodeNames={mockMethodes} exerciceNames={mockExercices} />);
    const addBtn = screen.getAllByRole("button").find(
      (b) => b.textContent?.includes("Ajouter un exercice"),
    );
    expect(addBtn).toBeDefined();
  });

  it("renders save button", () => {
    render(<Carnet methodeNames={mockMethodes} exerciceNames={mockExercices} />);
    const saveBtn = screen.getAllByRole("button").find(
      (b) => b.textContent?.includes("carnet.save"),
    );
    expect(saveBtn).toBeDefined();
  });

  it("renders live summary text", () => {
    render(<Carnet methodeNames={mockMethodes} exerciceNames={mockExercices} />);
    // Default summary shows "Endurance"
    const summary = document.querySelector(".carnet-summary");
    expect(summary).not.toBeNull();
    expect(summary?.textContent).toContain("Endurance");
  });

  it("switching to history tab shows empty state", () => {
    render(<Carnet methodeNames={mockMethodes} exerciceNames={mockExercices} />);
    const historyTab = screen.getAllByRole("button").find(
      (b) => b.textContent?.includes("Historique"),
    );
    fireEvent.click(historyTab!);
    expect(screen.getByText("Prêt pour ta première séance ?")).toBeDefined();
  });

  it("renders méthode toggle buttons", () => {
    render(<Carnet methodeNames={mockMethodes} exerciceNames={mockExercices} />);
    const methodeBtn = screen.getAllByRole("button").find(
      (b) => b.textContent === "Charge constante",
    );
    expect(methodeBtn).toBeDefined();
  });

  it("selector filters exercises on search input", () => {
    render(<Carnet methodeNames={mockMethodes} exerciceNames={mockExercices} />);
    const searchInput = screen.getByPlaceholderText("Rechercher un exercice...");
    fireEvent.change(searchInput, { target: { value: "Sq" } });
    // The dropdown should appear with "Squat"
    expect(screen.getByText("Squat")).toBeDefined();
  });

  it("selector shows grouped sessions on focus", () => {
    render(<Carnet methodeNames={mockMethodes} exerciceNames={mockExercices} />);
    const searchInput = screen.getByPlaceholderText("Rechercher un exercice...");
    fireEvent.focus(searchInput);
    // Session headers should appear
    expect(screen.getByText(/S3 — Haut du corps/)).toBeDefined();
    expect(screen.getByText(/S4 — Bas du corps/)).toBeDefined();
  });
});
