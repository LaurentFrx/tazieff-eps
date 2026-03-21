import { describe, it, expect, vi } from "vitest";
import {
  getExerciseMuscleGroups,
  isPosteriorDominant,
} from "@/lib/exercices/muscle-groups";

/* ── Pure utility tests ────────────────────────────────────────────────── */

describe("getExerciseMuscleGroups", () => {
  it("maps pectoraux + triceps + epaules", () => {
    const result = getExerciseMuscleGroups([
      "Pectoraux",
      "triceps",
      "deltoïde antérieur",
    ]);
    expect(result).toContain("pectoraux");
    expect(result).toContain("triceps");
    expect(result).toContain("epaules");
  });

  it("maps abdos variants to abdominaux group", () => {
    const result = getExerciseMuscleGroups([
      "Grand droit des abdominaux",
      "obliques",
    ]);
    expect(result).toContain("abdominaux");
    expect(result).toHaveLength(1); // both map to the same group
  });

  it("returns empty for unrecognized muscle tags", () => {
    const result = getExerciseMuscleGroups(["cardio", "endurance"]);
    expect(result).toHaveLength(0);
  });

  it("handles empty input", () => {
    expect(getExerciseMuscleGroups([])).toHaveLength(0);
  });

  it("maps dos-related terms", () => {
    const result = getExerciseMuscleGroups(["Grand dorsal", "Trapèzes"]);
    expect(result).toContain("dos");
  });

  it("maps ischio-jambiers to cuisses_arriere", () => {
    const result = getExerciseMuscleGroups(["Ischio-jambiers"]);
    expect(result).toContain("cuisses_arriere");
  });

  it("deduplicates groups from multiple matching muscles", () => {
    const result = getExerciseMuscleGroups([
      "abdos",
      "transverse",
      "obliques",
      "gainage",
    ]);
    // All of these match "abdominaux"
    expect(result.filter((g) => g === "abdominaux")).toHaveLength(1);
  });
});

describe("isPosteriorDominant", () => {
  it("returns true for mostly dorsal groups", () => {
    expect(
      isPosteriorDominant(["dos", "cuisses_arriere", "fessiers"]),
    ).toBe(true);
  });

  it("returns false for anterior groups", () => {
    expect(isPosteriorDominant(["pectoraux", "triceps"])).toBe(false);
  });

  it("returns false for 50/50 split", () => {
    expect(isPosteriorDominant(["dos", "pectoraux"])).toBe(false);
  });

  it("returns false for empty array", () => {
    expect(isPosteriorDominant([])).toBe(false);
  });

  it("returns true when majority is posterior", () => {
    expect(
      isPosteriorDominant(["dos", "fessiers", "cuisses_avant"]),
    ).toBe(true);
  });
});

/* ── Component tests ───────────────────────────────────────────────────── */

/* Mock next/dynamic to use React.lazy + Suspense (resolves in act()) */
vi.mock("next/dynamic", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (importFn: () => Promise<{ default: React.ComponentType }>) => {
      const Lazy = React.lazy(importFn);
      return function DynMock(props: Record<string, unknown>) {
        return React.createElement(
          React.Suspense,
          { fallback: null },
          React.createElement(Lazy, props),
        );
      };
    },
  };
});

/* Mock next/image to render a plain <img> */
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const { fill, sizes, priority, ...rest } = props;
    return <img {...rest} data-testid="mannequin-img" />;
  },
}));

vi.mock("@/lib/i18n/I18nProvider", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: "fr",
  }),
}));

import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import ExerciseAnatomyThumb from "./ExerciseAnatomyThumb";

describe("ExerciseAnatomyThumb", () => {
  it("renders thumb with mannequin image when muscles match groups", async () => {
    await act(async () => {
      render(
        <ExerciseAnatomyThumb
          muscles={["Pectoraux", "Triceps"]}
          translatedMuscles={["Pectoraux", "Triceps"]}
          slug="s3-03"
        />,
      );
    });

    expect(
      screen.getByLabelText("exerciseAnatomy.musclesWorked"),
    ).toBeTruthy();
    expect(screen.getByTestId("mannequin-img")).toBeTruthy();
  });

  it("shows group labels on the thumb", async () => {
    await act(async () => {
      render(
        <ExerciseAnatomyThumb
          muscles={["Pectoraux", "Triceps"]}
          translatedMuscles={["Pectoraux", "Triceps"]}
          slug="s3-03"
        />,
      );
    });

    expect(screen.getByText("anatomy.groups.pectoraux")).toBeTruthy();
    expect(screen.getByText("anatomy.groups.triceps")).toBeTruthy();
  });

  it("renders fallback chips for unrecognized muscles", async () => {
    await act(async () => {
      render(
        <ExerciseAnatomyThumb
          muscles={["cardio"]}
          translatedMuscles={["Cardio"]}
          slug="s1-01"
        />,
      );
    });

    expect(screen.getByText("Cardio")).toBeTruthy();
    expect(screen.queryByTestId("mannequin-img")).toBeNull();
  });

  it("links to anatomy page with muscle groups and slug", async () => {
    await act(async () => {
      render(
        <ExerciseAnatomyThumb
          muscles={["Pectoraux", "Triceps"]}
          translatedMuscles={["Pectoraux", "Triceps"]}
          slug="s3-03"
        />,
      );
    });

    const link = screen.getByLabelText("exerciseAnatomy.musclesWorked");
    expect(link.tagName).toBe("A");
    const href = link.getAttribute("href");
    expect(href).toContain("/apprendre/anatomie");
    expect(href).toContain("muscles=pectoraux,triceps");
    expect(href).toContain("from=exercice");
    expect(href).toContain("slug=s3-03");
  });
});
