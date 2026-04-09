import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";

beforeAll(() => {
  globalThis.IntersectionObserver = class {
    cb: IntersectionObserverCallback;
    constructor(cb: IntersectionObserverCallback) { this.cb = cb; }
    observe() { this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
});

vi.mock("next/link");

import { MethodeCard } from "./MethodeCard";
import { CategoryBadge } from "./CategoryBadge";
import { ScoreBar, ScoresBlock } from "./ScoreBar";
import { ParametresTable } from "./ParametresTable";
import { RelatedMethods } from "./RelatedMethods";
import { RelatedExercices } from "./RelatedExercices";
import type { MethodeFrontmatter } from "@/lib/content/schema";
import type { LiveExerciseListItem } from "@/lib/live/types";

/* ── MethodeCard ───────────────────────────────────────────────────── */

const defaultCardProps = {
  slug: "drop-set",
  titre: "Drop Set",
  categorie: "gain-de-volume" as const,
  categoryLabel: "Gain de volume",
  scores: { endurance: 3, hypertrophie: 5, force: 4, puissance: 4 },
  scoreLabels: { endurance: "Endurance", hypertrophie: "Hypertrophie", force: "Force", puissance: "Puissance" },
};

describe("MethodeCard", () => {
  it("renders title", () => {
    render(<MethodeCard {...defaultCardProps} />);
    expect(screen.getByText("Drop Set")).toBeDefined();
  });

  it("links to /methodes/{slug}", () => {
    render(<MethodeCard {...defaultCardProps} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/methodes/drop-set");
  });

  it("renders CategoryBadge with correct label", () => {
    render(<MethodeCard {...defaultCardProps} />);
    expect(screen.getByText("Gain de volume")).toBeDefined();
  });

  it("renders 4 score bars", () => {
    render(<MethodeCard {...defaultCardProps} />);
    expect(screen.getByText("Endurance")).toBeDefined();
    expect(screen.getByText("Hypertrophie")).toBeDefined();
    expect(screen.getByText("Force")).toBeDefined();
    expect(screen.getByText("Puissance")).toBeDefined();
  });

  it("renders description when provided", () => {
    render(<MethodeCard {...defaultCardProps} description="Push beyond failure." />);
    expect(screen.getByText("Push beyond failure.")).toBeDefined();
  });

  it("omits description when absent", () => {
    const { container } = render(<MethodeCard {...defaultCardProps} />);
    expect(container.querySelector(".line-clamp-2")).toBeNull();
  });

  it("renders soustitre when provided", () => {
    render(<MethodeCard {...defaultCardProps} soustitre="Advanced technique" />);
    expect(screen.getByText("Advanced technique")).toBeDefined();
  });

  it("renders niveau and timer labels when provided", () => {
    render(<MethodeCard {...defaultCardProps} niveauLabel="Niveau : 1ère" timerLabel="Chrono" />);
    expect(screen.getByText("Niveau : 1ère")).toBeDefined();
    expect(screen.getByText(/Chrono/)).toBeDefined();
  });

  it("does not crash with minimal props", () => {
    render(<MethodeCard {...defaultCardProps} />);
    expect(screen.getByRole("link")).toBeDefined();
  });
});

/* ── CategoryBadge ─────────────────────────────────────────────────── */

describe("CategoryBadge", () => {
  it("renders endurance label", () => {
    render(<CategoryBadge categorie="endurance-de-force" label="Endurance de force" />);
    const badge = screen.getByText("Endurance de force");
    expect(badge).toBeDefined();
    expect(badge.className).toContain("orange");
  });

  it("renders volume label with blue style", () => {
    render(<CategoryBadge categorie="gain-de-volume" label="Gain de volume" />);
    const badge = screen.getByText("Gain de volume");
    expect(badge.className).toContain("blue");
  });

  it("renders puissance label with green style", () => {
    render(<CategoryBadge categorie="gain-de-puissance" label="Gain de puissance" />);
    const badge = screen.getByText("Gain de puissance");
    expect(badge.className).toContain("green");
  });
});

/* ── ScoreBar ──────────────────────────────────────────────────────── */

describe("ScoreBar", () => {
  it("renders label and value", () => {
    render(<ScoreBar label="Endurance" value={3} />);
    expect(screen.getByText("Endurance")).toBeDefined();
    expect(screen.getByText("3/5")).toBeDefined();
  });

  it("renders 5 segments for max=5", () => {
    const { container } = render(<ScoreBar label="Force" value={2} />);
    const segments = container.querySelectorAll(".rounded-full");
    expect(segments.length).toBe(5);
  });

  it("value 0 → all segments empty", () => {
    const { container } = render(<ScoreBar label="X" value={0} />);
    const filled = container.querySelectorAll(".bg-\\[color\\:var\\(--accent\\)\\]");
    expect(filled.length).toBe(0);
  });

  it("value 5 → all segments filled", () => {
    const { container } = render(<ScoreBar label="X" value={5} />);
    const filled = container.querySelectorAll(".bg-\\[color\\:var\\(--accent\\)\\]");
    expect(filled.length).toBe(5);
  });
});

describe("ScoresBlock", () => {
  it("renders 4 score bars", () => {
    render(
      <ScoresBlock
        scores={{ endurance: 1, hypertrophie: 2, force: 3, puissance: 4 }}
        labels={{ endurance: "E", hypertrophie: "H", force: "F", puissance: "P" }}
      />,
    );
    expect(screen.getByText("E")).toBeDefined();
    expect(screen.getByText("H")).toBeDefined();
    expect(screen.getByText("F")).toBeDefined();
    expect(screen.getByText("P")).toBeDefined();
    expect(screen.getByText("1/5")).toBeDefined();
    expect(screen.getByText("4/5")).toBeDefined();
  });
});

/* ── ParametresTable ───────────────────────────────────────────────── */

describe("ParametresTable", () => {
  const baseProps = {
    parametres: {
      series: "4",
      repetitions: "15-20",
      intensite: "60%",
      recuperation: "1min",
    },
    labels: {
      series: "Séries",
      repetitions: "Répétitions",
      intensite: "Intensité",
      recuperation: "Récupération",
      duree: "Durée",
    },
  };

  it("renders all 4 required parameters", () => {
    render(<ParametresTable {...baseProps} />);
    expect(screen.getByText("Séries")).toBeDefined();
    expect(screen.getByText("4")).toBeDefined();
    expect(screen.getByText("Répétitions")).toBeDefined();
    expect(screen.getByText("15-20")).toBeDefined();
    expect(screen.getByText("Intensité")).toBeDefined();
    expect(screen.getByText("60%")).toBeDefined();
    expect(screen.getByText("Récupération")).toBeDefined();
    expect(screen.getByText("1min")).toBeDefined();
  });

  it("hides duree when absent", () => {
    render(<ParametresTable {...baseProps} />);
    expect(screen.queryByText("Durée")).toBeNull();
  });

  it("shows duree when present", () => {
    const withDuree = {
      ...baseProps,
      parametres: { ...baseProps.parametres, duree: "20 min" },
    };
    render(<ParametresTable {...withDuree} />);
    expect(screen.getByText("Durée")).toBeDefined();
    expect(screen.getByText("20 min")).toBeDefined();
  });
});

/* ── RelatedMethods ────────────────────────────────────────────────── */

const fakeMethodes: MethodeFrontmatter[] = [
  {
    slug: "drop-set",
    titre: "Drop Set",
    categorie: "gain-de-volume",
    niveau_minimum: "premiere",
    description: "desc",
    scores: { endurance: 3, hypertrophie: 5, force: 4, puissance: 4 },
    parametres: { series: "3", repetitions: "max", intensite: "80%", recuperation: "3min" },
    exercices_compatibles: [],
    methodes_complementaires: [],
  },
  {
    slug: "rest-pause",
    titre: "Rest Pause",
    categorie: "gain-de-volume",
    niveau_minimum: "terminale",
    description: "desc",
    scores: { endurance: 2, hypertrophie: 5, force: 4, puissance: 3 },
    parametres: { series: "3", repetitions: "max", intensite: "80%", recuperation: "20s" },
    exercices_compatibles: [],
    methodes_complementaires: [],
  },
];

describe("RelatedMethods", () => {
  it("renders links for matching slugs", () => {
    render(
      <RelatedMethods
        slugs={["drop-set", "rest-pause"]}
        allMethodes={fakeMethodes}
        heading="Méthodes complémentaires"
        categoryLabels={{ "gain-de-volume": "Volume" }}
      />,
    );
    expect(screen.getByText("Méthodes complémentaires")).toBeDefined();
    expect(screen.getByText("Drop Set")).toBeDefined();
    expect(screen.getByText("Rest Pause")).toBeDefined();
    const links = screen.getAllByRole("link");
    expect(links[0].getAttribute("href")).toBe("/methodes/drop-set");
    expect(links[1].getAttribute("href")).toBe("/methodes/rest-pause");
  });

  it("returns null for empty slug list", () => {
    const { container } = render(
      <RelatedMethods
        slugs={[]}
        allMethodes={fakeMethodes}
        heading="Heading"
        categoryLabels={{}}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("filters out unknown slugs", () => {
    render(
      <RelatedMethods
        slugs={["drop-set", "nonexistent"]}
        allMethodes={fakeMethodes}
        heading="Related"
        categoryLabels={{ "gain-de-volume": "Volume" }}
      />,
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
  });
});

/* ── RelatedExercices ──────────────────────────────────────────────── */

const fakeExercices = [
  { slug: "s3-16", title: "Développé couché" },
  { slug: "s3-10", title: "Squat" },
] as LiveExerciseListItem[];

describe("RelatedExercices", () => {
  it("renders links for matching slugs", () => {
    render(
      <RelatedExercices
        slugs={["s3-16", "s3-10"]}
        allExercices={fakeExercices}
        heading="Exercices compatibles"
      />,
    );
    expect(screen.getByText("Exercices compatibles")).toBeDefined();
    expect(screen.getByText("Développé couché")).toBeDefined();
    expect(screen.getByText("Squat")).toBeDefined();
    const links = screen.getAllByRole("link");
    expect(links[0].getAttribute("href")).toBe("/exercices/s3-16");
  });

  it("returns null for empty slug list", () => {
    const { container } = render(
      <RelatedExercices slugs={[]} allExercices={fakeExercices} heading="H" />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("filters out unknown slugs", () => {
    render(
      <RelatedExercices
        slugs={["s3-16", "nonexistent"]}
        allExercices={fakeExercices}
        heading="H"
      />,
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
  });
});
