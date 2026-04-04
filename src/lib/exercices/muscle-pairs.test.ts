import { describe, it, expect } from "vitest";
import { getAntagonists, getComplementaryExercises } from "./muscle-pairs";

describe("getAntagonists", () => {
  it("pectoraux → contains dos", () => {
    const result = getAntagonists(["Pectoraux"]);
    expect(result).toContain("dos");
  });

  it("biceps → contains triceps", () => {
    const result = getAntagonists(["biceps"]);
    expect(result).toContain("triceps");
  });

  it("quadriceps → contains ischios-jambiers", () => {
    const result = getAntagonists(["Quadriceps"]);
    expect(result).toContain("ischios-jambiers");
  });

  it("returns empty for unknown muscles", () => {
    const result = getAntagonists(["unknown-muscle"]);
    expect(result).toEqual([]);
  });
});

describe("getComplementaryExercises", () => {
  const exercises = [
    { slug: "bench", muscles: ["Pectoraux", "triceps"], title: "Bench" },
    { slug: "row", muscles: ["dos", "biceps"], title: "Row" },
    { slug: "squat", muscles: ["quadriceps"], title: "Squat" },
    { slug: "curl", muscles: ["biceps"], title: "Curl" },
    { slug: "fly", muscles: ["Pectoraux"], title: "Fly" },
  ];

  it("returns exercises with antagonist muscles for bench press (pectoraux)", () => {
    const result = getComplementaryExercises("bench", exercises);
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((e) => e.slug === "row")).toBe(true);
  });

  it("returns max 4 results", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      slug: `exo-${i}`,
      muscles: ["dos"],
      title: `Exo ${i}`,
    }));
    const result = getComplementaryExercises("bench", [...exercises, ...many]);
    expect(result.length).toBeLessThanOrEqual(4);
  });

  it("does not include the current exercise", () => {
    const result = getComplementaryExercises("bench", exercises);
    expect(result.every((e) => e.slug !== "bench")).toBe(true);
  });
});
