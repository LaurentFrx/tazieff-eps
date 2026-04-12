import { describe, it, expect, vi, afterEach } from "vitest";
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
  it("maps 'grand dorsal' to dorsaux", () => {
    expect(getMuscleGroup("grand dorsal")).toBe("dorsaux");
  });
  it("maps 'Trapeze' (case-insensitive) to dorsaux", () => {
    expect(getMuscleGroup("Trapeze")).toBe("dorsaux");
  });
  it("maps 'LOMBAIRES' (uppercase) to dorsaux", () => {
    expect(getMuscleGroup("LOMBAIRES")).toBe("dorsaux");
  });
  it("maps 'Érecteurs du rachis' (accented) to dorsaux", () => {
    expect(getMuscleGroup("Érecteurs du rachis")).toBe("dorsaux");
  });

  it("maps 'quadriceps' to cuisses", () => {
    expect(getMuscleGroup("quadriceps")).toBe("cuisses");
  });
  it("maps 'Ischio-jambiers' to cuisses", () => {
    expect(getMuscleGroup("Ischio-jambiers")).toBe("cuisses");
  });
  it("maps 'mollets' to mollets", () => {
    expect(getMuscleGroup("mollets")).toBe("mollets");
  });
  it("maps 'Grand fessier' to fessiers", () => {
    expect(getMuscleGroup("Grand fessier")).toBe("fessiers");
  });

  it("maps 'deltoides' to epaules", () => {
    expect(getMuscleGroup("deltoides")).toBe("epaules");
  });
  it("maps 'Biceps' to bras", () => {
    expect(getMuscleGroup("Biceps")).toBe("bras");
  });
  it("maps 'triceps' to bras", () => {
    expect(getMuscleGroup("triceps")).toBe("bras");
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

  it("returns null for phantom muscles", () => {
    expect(getMuscleGroup("cardio")).toBeNull();
    expect(getMuscleGroup("coordination")).toBeNull();
    expect(getMuscleGroup("anti-rotation")).toBeNull();
    expect(getMuscleGroup("rotation")).toBeNull();
  });

  // Critical: false positive prevention
  it("maps 'biceps femoral' to cuisses (not bras)", () => {
    expect(getMuscleGroup("biceps femoral")).toBe("cuisses");
  });
  it("maps 'triceps sural' to mollets (not bras)", () => {
    expect(getMuscleGroup("triceps sural")).toBe("mollets");
  });
  it("maps 'triceps brachial' to bras (not mollets)", () => {
    expect(getMuscleGroup("triceps brachial")).toBe("bras");
  });
  it("maps 'stabilisateurs' to abdominaux", () => {
    expect(getMuscleGroup("stabilisateurs")).toBe("abdominaux");
  });
  it("maps 'stabilisateurs profonds' to null (phantom)", () => {
    expect(getMuscleGroup("stabilisateurs profonds")).toBeNull();
  });
});

/* ── getMuscleGroupsForExercise tests ───────────────────────────────────── */

describe("getMuscleGroupsForExercise", () => {
  it("returns multiple groups for multi-muscle exercise", () => {
    const result = getMuscleGroupsForExercise(["deltoides", "pectoraux", "grand droit"]);
    expect(result).toContain("epaules");
    expect(result).toContain("pectoraux");
    expect(result).toContain("abdominaux");
    expect(result).toHaveLength(3);
  });

  it("deduplicates groups from multiple matching muscles", () => {
    const result = getMuscleGroupsForExercise(["abdominaux", "obliques", "transverse", "grand droit"]);
    expect(result).toEqual(["abdominaux"]);
  });

  it("returns empty for phantom muscle tags", () => {
    const result = getMuscleGroupsForExercise(["cardio", "coordination"]);
    expect(result).toHaveLength(0);
  });

  it("handles empty input", () => {
    expect(getMuscleGroupsForExercise([])).toHaveLength(0);
  });

  it("preserves canonical order", () => {
    const result = getMuscleGroupsForExercise(["pectoraux", "grand dorsal", "quadriceps"]);
    expect(result).toEqual(["pectoraux", "dorsaux", "cuisses"]);
  });
});

/* ── getExerciseMuscleGroups (bridge) tests ─────────────────────────────── */

describe("getExerciseMuscleGroups", () => {
  it("maps pectoraux + triceps to pectoraux + bras", () => {
    const result = getExerciseMuscleGroups(["Pectoraux", "triceps"]);
    expect(result).toContain("pectoraux");
    expect(result).toContain("bras");
  });

  it("maps abdos variants to abdominaux group", () => {
    const result = getExerciseMuscleGroups(["Grand droit des abdominaux", "obliques"]);
    expect(result).toContain("abdominaux");
    expect(result).toHaveLength(1);
  });

  it("maps dos-related terms to dorsaux", () => {
    const result = getExerciseMuscleGroups(["Grand dorsal", "Trapèzes"]);
    expect(result).toContain("dorsaux");
  });

  it("maps ischio-jambiers to cuisses", () => {
    const result = getExerciseMuscleGroups(["Ischio-jambiers"]);
    expect(result).toContain("cuisses");
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

  it("shows new 8-group labels on the thumb", async () => {
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
    expect(screen.getByText("filters.muscleGroups.bras")).toBeTruthy();
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

  // IMPORTANT : test anti-régression — bug récurrent.
  // "rotation" / "anti-rotation" NE DOIVENT PAS matcher un groupe.
  it("does NOT include any group for a back exercise with 'rotation' phantom muscle", async () => {
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
    expect(href).toContain("dorsaux");
    expect(href).not.toContain("abdominaux");
  });

  it("maps 'Coiffe des rotateurs' to epaules", async () => {
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

  it("renders thumb immediately without scan animation classes", async () => {
    await act(async () => {
      render(
        <ExerciseAnatomyThumb
          muscles={["Pectoraux", "Triceps"]}
          translatedMuscles={["Pectoraux", "Triceps"]}
          slug="s3-03"
        />,
      );
    });

    const thumb = screen.getByLabelText("exerciseAnatomy.musclesWorked");
    expect(thumb.className).not.toContain("scanning");
    expect(thumb.className).not.toContain("pre-scan");
    expect(screen.getByTestId("mannequin-img")).toBeTruthy();
  });

  it("links to anatomy page with unified 8-group keys", async () => {
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
    expect(href).toContain("pectoraux");
    expect(href).toContain("bras");
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
