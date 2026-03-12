import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/link");
vi.mock("@/lib/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

import {
  NIVEAUX,
  AUTO_EVAL,
  GRILLE_BAC,
  storageKey,
  getTotalItems,
  getCheckedCount,
  type Niveau,
} from "./data";
import { ParcoursDashboard } from "./ParcoursDashboard";
import { GrilleBac } from "./epreuve-bac/GrilleBac";
import { NiveauChecklist } from "./[niveau]/NiveauChecklist";

/* ── NIVEAUX constant ─────────────────────────────────────── */

describe("NIVEAUX constant", () => {
  it("has exactly 3 niveaux", () => {
    expect(NIVEAUX).toHaveLength(3);
  });

  it("keys are seconde, premiere, terminale", () => {
    const keys = NIVEAUX.map((n) => n.key);
    expect(keys).toEqual(["seconde", "premiere", "terminale"]);
  });

  it("each niveau has 4 competences (realiser, concevoir, analyser, cooperer)", () => {
    for (const n of NIVEAUX) {
      const compKeys = n.competences.map((c) => c.key);
      expect(compKeys).toEqual(["realiser", "concevoir", "analyser", "cooperer"]);
    }
  });

  it("each competence has ≥ 2 items", () => {
    for (const n of NIVEAUX) {
      for (const c of n.competences) {
        expect(c.items.length, `${n.key}.${c.key}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("item counts: seconde=12, premiere=14, terminale=13", () => {
    const counts = NIVEAUX.map((n) => ({
      key: n.key,
      count: n.competences.reduce((s, c) => s + c.items.length, 0),
    }));
    expect(counts).toEqual([
      { key: "seconde", count: 12 },
      { key: "premiere", count: 14 },
      { key: "terminale", count: 13 },
    ]);
  });

  it("all checklist items have non-empty text", () => {
    for (const n of NIVEAUX) {
      for (const c of n.competences) {
        for (const item of c.items) {
          expect(item.text.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("items with links point to valid internal paths", () => {
    for (const n of NIVEAUX) {
      for (const c of n.competences) {
        for (const item of c.items) {
          if (item.link) {
            expect(item.link).toMatch(/^\//);
          }
        }
      }
    }
  });
});

/* ── AUTO_EVAL constant ───────────────────────────────────── */

describe("AUTO_EVAL constant", () => {
  const niveaux: Niveau[] = ["seconde", "premiere", "terminale"];

  it("has entries for all 3 niveaux", () => {
    expect(Object.keys(AUTO_EVAL).sort()).toEqual([...niveaux].sort());
  });

  it("each niveau has exactly 3 questions", () => {
    for (const n of niveaux) {
      expect(AUTO_EVAL[n]).toHaveLength(3);
    }
  });

  it("each question has exactly 3 options", () => {
    for (const n of niveaux) {
      for (const q of AUTO_EVAL[n]) {
        expect(q.options).toHaveLength(3);
      }
    }
  });

  it("option scores are exactly 0, 1, 2", () => {
    for (const n of niveaux) {
      for (const q of AUTO_EVAL[n]) {
        const scores = q.options.map((o) => o.score).sort();
        expect(scores).toEqual([0, 1, 2]);
      }
    }
  });

  it("max score per niveau is 6 (3 questions × 2 pts)", () => {
    for (const n of niveaux) {
      const maxScore = AUTO_EVAL[n].reduce(
        (sum, q) => sum + Math.max(...q.options.map((o) => o.score)),
        0,
      );
      expect(maxScore).toBe(6);
    }
  });
});

/* ── GRILLE_BAC constant ──────────────────────────────────── */

describe("GRILLE_BAC constant", () => {
  it("has 4 competences", () => {
    expect(GRILLE_BAC).toHaveLength(4);
  });

  it("points total exactly 20", () => {
    const total = GRILLE_BAC.reduce((s, c) => s + c.points, 0);
    expect(total).toBe(20);
  });

  it("each competence has points > 0", () => {
    for (const c of GRILLE_BAC) {
      expect(c.points).toBeGreaterThan(0);
    }
  });

  it("each competence has ≥ 1 link", () => {
    for (const c of GRILLE_BAC) {
      expect(c.links.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("all links point to internal paths", () => {
    for (const c of GRILLE_BAC) {
      for (const link of c.links) {
        expect(link.href).toMatch(/^\//);
      }
    }
  });
});

/* ── Helper: storageKey ───────────────────────────────────── */

describe("storageKey", () => {
  it("generates parcours-{niveau}-{competence}", () => {
    expect(storageKey("seconde", "realiser")).toBe("parcours-seconde-realiser");
    expect(storageKey("terminale", "cooperer")).toBe("parcours-terminale-cooperer");
    expect(storageKey("premiere", "analyser")).toBe("parcours-premiere-analyser");
  });
});

/* ── Helper: getTotalItems ────────────────────────────────── */

describe("getTotalItems", () => {
  it("returns correct total per niveau", () => {
    expect(getTotalItems("seconde")).toBe(12);
    expect(getTotalItems("premiere")).toBe(14);
    expect(getTotalItems("terminale")).toBe(13);
  });

  it("returns 0 for unknown niveau", () => {
    expect(getTotalItems("unknown" as Niveau)).toBe(0);
  });
});

/* ── Helper: getCheckedCount ──────────────────────────────── */

describe("getCheckedCount", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns 0 when localStorage is empty", () => {
    expect(getCheckedCount("seconde")).toBe(0);
  });

  it("counts checked items correctly", () => {
    localStorage.setItem(
      "parcours-seconde-realiser",
      JSON.stringify([true, false, true, false]),
    );
    localStorage.setItem(
      "parcours-seconde-concevoir",
      JSON.stringify([true, true, false, false]),
    );
    expect(getCheckedCount("seconde")).toBe(4);
  });

  it("ignores invalid JSON gracefully", () => {
    localStorage.setItem("parcours-seconde-realiser", "not-json");
    expect(getCheckedCount("seconde")).toBe(0);
  });

  it("returns 0 for unknown niveau", () => {
    expect(getCheckedCount("unknown" as Niveau)).toBe(0);
  });
});

/* ── ParcoursDashboard component ──────────────────────────── */

describe("ParcoursDashboard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders 3 niveau cards + 1 grille card = 4 links", () => {
    render(<ParcoursDashboard />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);
  });

  it("links to /parcours-bac/{niveau} and /parcours-bac/epreuve-bac", () => {
    render(<ParcoursDashboard />);
    const hrefs = screen.getAllByRole("link").map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/parcours-bac/seconde");
    expect(hrefs).toContain("/parcours-bac/premiere");
    expect(hrefs).toContain("/parcours-bac/terminale");
    expect(hrefs).toContain("/parcours-bac/epreuve-bac");
  });

  it("shows progress bars for each niveau", () => {
    render(<ParcoursDashboard />);
    const bars = document.querySelectorAll(".parcours-progress-bar");
    expect(bars.length).toBe(3);
  });
});

/* ── GrilleBac component ──────────────────────────────────── */

describe("GrilleBac", () => {
  it("displays total of 20 points", () => {
    render(<GrilleBac />);
    expect(screen.getByText(/20/)).toBeDefined();
  });

  it("renders 4 competence articles", () => {
    render(<GrilleBac />);
    const articles = document.querySelectorAll("article");
    expect(articles).toHaveLength(4);
  });

  it("each competence shows points", () => {
    render(<GrilleBac />);
    expect(screen.getByText("4 pts")).toBeDefined();
    expect(screen.getByText("8 pts")).toBeDefined();
    expect(screen.getByText("6 pts")).toBeDefined();
    expect(screen.getByText("2 pts")).toBeDefined();
  });

  it("renders resource links", () => {
    render(<GrilleBac />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(4);
  });
});

/* ── NiveauChecklist component ────────────────────────────── */

describe("NiveauChecklist", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders 4 competence sections + auto-eval = 5 headings", () => {
    render(<NiveauChecklist niveau="seconde" />);
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings).toHaveLength(5);
  });

  it("renders 12 checkboxes for seconde (4+4+2+2)", () => {
    render(<NiveauChecklist niveau="seconde" />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(12);
  });

  it("renders 9 auto-eval option buttons (3 questions × 3)", () => {
    render(<NiveauChecklist niveau="seconde" />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(9);
  });

  it("renders correct checkbox count for terminale (13)", () => {
    render(<NiveauChecklist niveau="terminale" />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(13);
  });

  it("returns null for invalid niveau", () => {
    const { container } = render(<NiveauChecklist niveau={"invalid" as Niveau} />);
    expect(container.innerHTML).toBe("");
  });
});
