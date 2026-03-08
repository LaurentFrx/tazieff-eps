import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getExerciseMuscleGroups,
  isPosteriorDominant,
} from "@/lib/exercices/muscle-groups";

/* ── Pure utility tests ────────────────────────────────────────────────── */

describe("getExerciseMuscleGroups", () => {
  it("maps pectoraux + triceps + deltoides", () => {
    const result = getExerciseMuscleGroups([
      "Pectoraux",
      "triceps",
      "deltoides anterieurs",
    ]);
    expect(result).toContain("pectoraux");
    expect(result).toContain("triceps");
    expect(result).toContain("deltoides");
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

  it("maps dorsaux-related terms", () => {
    const result = getExerciseMuscleGroups(["Grand dorsal", "Trapèzes"]);
    expect(result).toContain("dorsaux");
  });

  it("maps ischio-jambiers", () => {
    const result = getExerciseMuscleGroups(["Ischio-jambiers"]);
    expect(result).toContain("ischio_jambiers");
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
      isPosteriorDominant(["dorsaux", "ischio_jambiers", "fessiers"]),
    ).toBe(true);
  });

  it("returns false for anterior groups", () => {
    expect(isPosteriorDominant(["pectoraux", "triceps"])).toBe(false);
  });

  it("returns false for 50/50 split", () => {
    expect(isPosteriorDominant(["dorsaux", "pectoraux"])).toBe(false);
  });

  it("returns false for empty array", () => {
    expect(isPosteriorDominant([])).toBe(false);
  });

  it("returns true when majority is posterior", () => {
    expect(
      isPosteriorDominant(["dorsaux", "fessiers", "quadriceps"]),
    ).toBe(true);
  });
});

/* ── Component tests (mocked Three.js) ────────────────────────────────── */

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

/* Mock the Canvas — Three.js doesn't work in jsdom */
let thumbOnLoaded: (() => void) | null = null;
vi.mock("./ExerciseAnatomyThumbCanvas", () => ({
  default: ({ onLoaded }: { onLoaded: () => void }) => {
    thumbOnLoaded = onLoaded;
    return <div data-testid="thumb-canvas">3D Canvas Mock</div>;
  },
}));

vi.mock("./ExerciseAnatomyModal", () => ({
  default: ({
    onClose,
    groupKeys,
  }: {
    onClose: () => void;
    groupKeys: string[];
  }) => (
    <div data-testid="anatomy-modal">
      <span data-testid="modal-groups">{groupKeys.join(",")}</span>
      <button data-testid="modal-close" onClick={onClose}>
        Close
      </button>
    </div>
  ),
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
  beforeEach(() => {
    thumbOnLoaded = null;
  });

  it("renders thumb button when muscles match groups", async () => {
    await act(async () => {
      render(
        <ExerciseAnatomyThumb
          muscles={["Pectoraux", "Triceps"]}
          translatedMuscles={["Pectoraux", "Triceps"]}
        />,
      );
    });

    expect(
      screen.getByLabelText("exerciseAnatomy.musclesWorked"),
    ).toBeTruthy();
  });

  it("renders fallback chips for unrecognized muscles", async () => {
    await act(async () => {
      render(
        <ExerciseAnatomyThumb
          muscles={["cardio"]}
          translatedMuscles={["Cardio"]}
        />,
      );
    });

    expect(screen.getByText("Cardio")).toBeTruthy();
  });

  it("renders fallback chips on 3-second timeout when canvas never loads", async () => {
    vi.useFakeTimers();

    await act(async () => {
      render(
        <ExerciseAnatomyThumb
          muscles={["Pectoraux"]}
          translatedMuscles={["Pectoraux"]}
        />,
      );
    });

    // Canvas is rendered but onLoaded has NOT been called
    expect(thumbOnLoaded).not.toBeNull();

    // Advance past the 3-second timeout WITHOUT calling onLoaded
    act(() => {
      vi.advanceTimersByTime(3100);
    });

    // Should now show fallback chips
    expect(screen.getByText("Pectoraux")).toBeTruthy();
    expect(screen.queryByTestId("thumb-canvas")).toBeNull();

    vi.useRealTimers();
  });

  it("opens modal on click and closes on button click", async () => {
    await act(async () => {
      render(
        <ExerciseAnatomyThumb
          muscles={["Pectoraux", "Triceps"]}
          translatedMuscles={["Pectoraux", "Triceps"]}
        />,
      );
    });

    // Simulate canvas loaded
    act(() => {
      thumbOnLoaded?.();
    });

    // Click the thumb to open modal
    const thumb = screen.getByLabelText("exerciseAnatomy.musclesWorked");
    fireEvent.click(thumb);

    // Wait for modal to resolve (React.lazy + createPortal need async flush)
    await waitFor(() => {
      expect(
        document.querySelector("[data-testid='anatomy-modal']"),
      ).toBeTruthy();
    });

    // Close the modal
    fireEvent.click(
      document.querySelector("[data-testid='modal-close']") as HTMLElement,
    );

    // Modal should be gone
    expect(document.querySelector("[data-testid='anatomy-modal']")).toBeNull();
  });
});
