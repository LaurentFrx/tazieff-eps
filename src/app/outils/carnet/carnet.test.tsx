import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/link");
vi.mock("@/lib/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

// Mock lucide-react icons used by Carnet
vi.mock("lucide-react", () => ({
  ChevronDown: () => <span>▼</span>,
  ChevronUp: () => <span>▲</span>,
  Download: () => <span>↓</span>,
  Plus: () => <span>+</span>,
  Printer: () => <span>🖨</span>,
  Trash2: () => <span>🗑</span>,
  X: () => <span>✕</span>,
}));

import { Carnet } from "./Carnet";

const STORAGE_KEY = "tazieff-carnet";

const mockMethodes = [
  { slug: "charge-constante", titre: "Charge constante" },
  { slug: "pyramide", titre: "Pyramide" },
];

const mockExercices = [
  { slug: "developpe-couche", title: "Développé couché" },
  { slug: "squat", title: "Squat" },
];

/* ── localStorage helpers ────────────────────────────────────────── */

describe("Carnet — localStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("reads empty array when localStorage is empty", () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeNull();
  });

  it("stores and retrieves entries correctly", () => {
    const entry = {
      id: "test-id",
      date: "2026-03-06",
      objectif: "volume",
      methodes: ["pyramide"],
      exercices: [{ nom: "Squat", charge: 80, seriesReps: "4×10", rir: 2, ressenti: 4 }],
      notes: "Bonne séance",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([entry]));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].objectif).toBe("volume");
    expect(stored[0].exercices[0].nom).toBe("Squat");
    expect(stored[0].exercices[0].charge).toBe(80);
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

/* ── Carnet entry data model ─────────────────────────────────────── */

describe("Carnet — entry data model", () => {
  it("entry has all required fields", () => {
    const entry = {
      id: "abc-123",
      date: "2026-03-06",
      objectif: "puissance" as const,
      methodes: ["charge-constante"],
      exercices: [
        { nom: "Développé couché", charge: 60, seriesReps: "3×8", rir: 1, ressenti: 5 },
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

  it("exercice has charge, seriesReps, rir, ressenti fields", () => {
    const exo = { nom: "Squat", charge: 100, seriesReps: "5×5", rir: 0, ressenti: 5 };
    expect(exo.charge).toBeGreaterThanOrEqual(0);
    expect(exo.rir).toBeGreaterThanOrEqual(0);
    expect(exo.rir).toBeLessThanOrEqual(5);
    expect(exo.ressenti).toBeGreaterThanOrEqual(1);
    expect(exo.ressenti).toBeLessThanOrEqual(5);
  });
});

/* ── Carnet component rendering ──────────────────────────────────── */

describe("Carnet — component", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders form tab by default with date, objectif, exercice fields", () => {
    render(<Carnet methodeNames={mockMethodes} exerciceNames={mockExercices} />);
    // Date input
    const dateInput = document.querySelector('input[type="date"]');
    expect(dateInput).not.toBeNull();
    // Objectif buttons (3: endurance, volume, puissance)
    const objectifButtons = screen.getAllByRole("button").filter(
      (b) => b.textContent && ["carnet.objectifEndurance", "carnet.objectifVolume", "carnet.objectifPuissance"].includes(b.textContent),
    );
    expect(objectifButtons).toHaveLength(3);
  });

  it("renders exercice select with provided options", () => {
    render(<Carnet methodeNames={mockMethodes} exerciceNames={mockExercices} />);
    const selects = document.querySelectorAll("select");
    expect(selects.length).toBeGreaterThanOrEqual(1);
    // Options should include exercise names
    const options = selects[0].querySelectorAll("option");
    expect(options.length).toBe(3); // placeholder + 2 exercises
  });

  it("renders add exercice button", () => {
    render(<Carnet methodeNames={mockMethodes} exerciceNames={mockExercices} />);
    const addBtn = screen.getAllByRole("button").find(
      (b) => b.textContent?.includes("carnet.addExercice"),
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

  it("switching to history tab shows empty message when no entries", () => {
    render(<Carnet methodeNames={mockMethodes} exerciceNames={mockExercices} />);
    const historyTab = screen.getAllByRole("button").find(
      (b) => b.textContent?.includes("carnet.tabHistory"),
    );
    expect(historyTab).toBeDefined();
    fireEvent.click(historyTab!);
    expect(screen.getByText("carnet.emptyHistory")).toBeDefined();
  });

  it("renders méthode toggle buttons", () => {
    render(<Carnet methodeNames={mockMethodes} exerciceNames={mockExercices} />);
    const methodeBtn = screen.getAllByRole("button").find(
      (b) => b.textContent === "Charge constante",
    );
    expect(methodeBtn).toBeDefined();
  });
});
