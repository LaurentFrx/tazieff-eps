import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getExerciseMuscleGroups,
} from "@/lib/exercices/muscle-groups";
import { setAnatomyAnim, getAnatomyAnim } from "@/lib/storage";
import {
  getMuscleGroup,
  getMuscleGroupsForExercise,
} from "@/lib/exercices/muscleGroups";

/* ── getMuscleGroup unit tests ──────────────────────────────────────────── */

describe("getMuscleGroup", () => {
  it("maps 'grand dorsal' to dos", () => {
    expect(getMuscleGroup("grand dorsal")).toBe("dos");
  });
  it("maps 'Trapeze' (case-insensitive) to dos", () => {
    expect(getMuscleGroup("Trapeze")).toBe("dos");
  });
  it("maps 'LOMBAIRES' (uppercase) to dos", () => {
    expect(getMuscleGroup("LOMBAIRES")).toBe("dos");
  });
  it("maps 'Érecteurs du rachis' (accented) to dos", () => {
    expect(getMuscleGroup("Érecteurs du rachis")).toBe("dos");
  });

  it("maps 'quadriceps' to membres-inferieurs", () => {
    expect(getMuscleGroup("quadriceps")).toBe("membres-inferieurs");
  });
  it("maps 'Ischio-jambiers' to membres-inferieurs", () => {
    expect(getMuscleGroup("Ischio-jambiers")).toBe("membres-inferieurs");
  });
  it("maps 'mollets' to membres-inferieurs", () => {
    expect(getMuscleGroup("mollets")).toBe("membres-inferieurs");
  });
  it("maps 'Grand fessier' to membres-inferieurs", () => {
    expect(getMuscleGroup("Grand fessier")).toBe("membres-inferieurs");
  });

  it("maps 'deltoides' to membres-superieurs", () => {
    expect(getMuscleGroup("deltoides")).toBe("membres-superieurs");
  });
  it("maps 'Biceps' to membres-superieurs", () => {
    expect(getMuscleGroup("Biceps")).toBe("membres-superieurs");
  });
  it("maps 'triceps' to membres-superieurs", () => {
    expect(getMuscleGroup("triceps")).toBe("membres-superieurs");
  });

  it("maps 'obliques' to abdominaux", () => {
    expect(getMuscleGroup("obliques")).toBe("abdominaux");
  });
  it("maps 'transverse' to abdominaux", () => {
    expect(getMuscleGroup("transverse")).toBe("abdominaux");
  });
  it("maps 'grand droit' to abdominaux", () => {
    expect(getMuscleGroup("grand droit")).toBe("abdominaux");
  });

  it("maps 'pectoraux' to pectoraux", () => {
    expect(getMuscleGroup("pectoraux")).toBe("pectoraux");
  });
  it("maps 'dentele' to pectoraux", () => {
    expect(getMuscleGroup("dentele")).toBe("pectoraux");
  });
  it("maps 'grand pectoral' to pectoraux", () => {
    expect(getMuscleGroup("grand pectoral")).toBe("pectoraux");
  });

  it("returns null for unknown muscle", () => {
    // Suppress console.warn in test
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(getMuscleGroup("cardio")).toBeNull();
    spy.mockRestore();
  });
});

/* ── getMuscleGroupsForExercise tests ───────────────────────────────────── */

describe("getMuscleGroupsForExercise", () => {
  it("returns multiple groups for multi-muscle exercise", () => {
    const result = getMuscleGroupsForExercise(["deltoides", "pectoraux", "grand droit"]);
    expect(result).toContain("membres-superieurs");
    expect(result).toContain("pectoraux");
    expect(result).toContain("abdominaux");
    expect(result).toHaveLength(3);
  });

  it("deduplicates groups from multiple matching muscles", () => {
    const result = getMuscleGroupsForExercise(["abdominaux", "obliques", "transverse", "grand droit"]);
    expect(result).toEqual(["abdominaux"]);
  });

  it("returns empty for unrecognized muscle tags", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = getMuscleGroupsForExercise(["cardio", "endurance"]);
    expect(result).toHaveLength(0);
    spy.mockRestore();
  });

  it("handles empty input", () => {
    expect(getMuscleGroupsForExercise([])).toHaveLength(0);
  });

  it("preserves canonical order: dos, membres-inferieurs, membres-superieurs, abdominaux, pectoraux", () => {
    const result = getMuscleGroupsForExercise(["pectoraux", "grand dorsal", "quadriceps"]);
    expect(result).toEqual(["dos", "membres-inferieurs", "pectoraux"]);
  });
});

/* ── getExerciseMuscleGroups (bridge) tests ─────────────────────────────── */

describe("getExerciseMuscleGroups", () => {
  it("maps pectoraux + triceps to pectoraux + membres-superieurs", () => {
    const result = getExerciseMuscleGroups(["Pectoraux", "triceps"]);
    expect(result).toContain("pectoraux");
    expect(result).toContain("membres-superieurs");
  });

  it("maps abdos variants to abdominaux group", () => {
    const result = getExerciseMuscleGroups(["Grand droit des abdominaux", "obliques"]);
    expect(result).toContain("abdominaux");
    expect(result).toHaveLength(1);
  });

  it("maps dos-related terms", () => {
    const result = getExerciseMuscleGroups(["Grand dorsal", "Trapèzes"]);
    expect(result).toContain("dos");
  });

  it("maps ischio-jambiers to membres-inferieurs", () => {
    const result = getExerciseMuscleGroups(["Ischio-jambiers"]);
    expect(result).toContain("membres-inferieurs");
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

import { render, screen, act } from "@testing-library/react";
import ExerciseAnatomyThumb from "./ExerciseAnatomyThumb";

/* Global IntersectionObserver mock for jsdom */
beforeEach(() => {
  if (typeof globalThis.IntersectionObserver === "undefined") {
    globalThis.IntersectionObserver = class IntersectionObserver {
      constructor(public cb: (entries: Array<{ isIntersecting: boolean }>) => void) {}
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
    } as unknown as typeof globalThis.IntersectionObserver;
  }
  localStorage.clear();
  setAnatomyAnim(true); // default for each test
});

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

  it("shows new 5-group labels on the thumb", async () => {
    await act(async () => {
      render(
        <ExerciseAnatomyThumb
          muscles={["Pectoraux", "Triceps"]}
          translatedMuscles={["Pectoraux", "Triceps"]}
          slug="s3-03"
        />,
      );
    });

    expect(screen.getByText("filters.muscleGroups.pectoraux")).toBeTruthy();
    expect(screen.getByText("filters.muscleGroups.membres-superieurs")).toBeTruthy();
  });

  it("renders fallback chips for unrecognized muscles", async () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
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
    spy.mockRestore();
  });

  // IMPORTANT : test anti-régression — bug récurrent.
  // Quand ouvert depuis un exercice, seuls les muscles de l'exercice sont surlignés.
  // "rotation" / "anti-rotation" NE DOIVENT PAS matcher le groupe abdominaux.
  it("does NOT include abdominaux group for a back exercise with 'rotation' muscle", async () => {
    await act(async () => {
      render(
        <ExerciseAnatomyThumb
          muscles={["Grand dorsal", "Trapezes", "rotation"]}
          translatedMuscles={["Grand dorsal", "Trapèzes", "Rotation"]}
          slug="s2-12"
        />,
      );
    });

    const link = screen.getByLabelText("exerciseAnatomy.musclesWorked");
    const href = link.getAttribute("href") ?? "";
    expect(href).toContain("dos");
    expect(href).not.toContain("abdominaux");
  });

  it("does NOT include abdominaux group for 'Coiffe des rotateurs'", async () => {
    await act(async () => {
      render(
        <ExerciseAnatomyThumb
          muscles={["Deltoides", "Coiffe des rotateurs"]}
          translatedMuscles={["Deltoïdes", "Coiffe des rotateurs"]}
          slug="s3-05"
        />,
      );
    });

    const link = screen.getByLabelText("exerciseAnatomy.musclesWorked");
    const href = link.getAttribute("href") ?? "";
    expect(href).toContain("epaules");
    expect(href).not.toContain("abdominaux");
  });

  it("shows scan overlay when animation is enabled and element is visible", async () => {
    setAnatomyAnim(true);
    let intersectionCb: (entries: Array<{ isIntersecting: boolean }>) => void;
    const mockObserve = vi.fn();
    const mockDisconnect = vi.fn();
    vi.stubGlobal("IntersectionObserver", class {
      constructor(cb: (entries: Array<{ isIntersecting: boolean }>) => void) { intersectionCb = cb; }
      observe = mockObserve;
      disconnect = mockDisconnect;
      unobserve = vi.fn();
    });

    await act(async () => {
      render(
        <ExerciseAnatomyThumb
          muscles={["Pectoraux", "Triceps"]}
          translatedMuscles={["Pectoraux", "Triceps"]}
          slug="s3-03"
        />,
      );
    });

    // Trigger intersection
    await act(async () => { intersectionCb!([{ isIntersecting: true }]); });

    const thumb = screen.getByLabelText("exerciseAnatomy.musclesWorked");
    expect(thumb.className).toContain("scanning");
    vi.unstubAllGlobals();
  });

  it("does NOT show scan overlay when animation is disabled", async () => {
    setAnatomyAnim(false);
    let intersectionCb: (entries: Array<{ isIntersecting: boolean }>) => void;
    vi.stubGlobal("IntersectionObserver", class {
      constructor(cb: (entries: Array<{ isIntersecting: boolean }>) => void) { intersectionCb = cb; }
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
    });

    await act(async () => {
      render(
        <ExerciseAnatomyThumb
          muscles={["Pectoraux", "Triceps"]}
          translatedMuscles={["Pectoraux", "Triceps"]}
          slug="s3-03"
        />,
      );
    });

    await act(async () => { intersectionCb!([{ isIntersecting: true }]); });

    const thumb = screen.getByLabelText("exerciseAnatomy.musclesWorked");
    expect(thumb.className).not.toContain("scanning");
    vi.unstubAllGlobals();
  });

  it("links to anatomy page with anatomy-data group keys (not simplified 5-groups)", async () => {
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
    // href uses anatomy-data keys (pectoraux, triceps), NOT simplified groups
    expect(href).toContain("pectoraux");
    expect(href).toContain("triceps");
    expect(href).not.toContain("membres-superieurs");
    expect(href).toContain("from=exercice");
    expect(href).toContain("slug=s3-03");
  });
});

/* ── Anatomy animation toggle (localStorage) ─────────────────────────────── */

describe("anatomy animation preference", () => {
  afterEach(() => localStorage.clear());

  it("defaults to true when no localStorage value set", () => {
    localStorage.removeItem("eps_anatomy_anim");
    expect(getAnatomyAnim()).toBe(true);
  });

  it("persists false in localStorage", () => {
    setAnatomyAnim(false);
    expect(localStorage.getItem("eps_anatomy_anim")).toBe("false");
    expect(getAnatomyAnim()).toBe(false);
  });

  it("persists true in localStorage", () => {
    setAnatomyAnim(true);
    expect(localStorage.getItem("eps_anatomy_anim")).toBe("true");
    expect(getAnatomyAnim()).toBe(true);
  });
});
