import { describe, it, expect } from "vitest";
import { search } from "./search";

describe("search()", () => {
  it("returns empty array for empty query", () => {
    expect(search("")).toEqual([]);
  });

  it("returns empty array for single-char query", () => {
    expect(search("a")).toEqual([]);
  });

  it("returns empty array for non-matching query", () => {
    expect(search("xyznonexistent")).toEqual([]);
  });

  it('search("pectoraux") returns exercice results', () => {
    const groups = search("pectoraux");
    expect(groups.length).toBeGreaterThan(0);
    const exerciceGroup = groups.find((g) => g.type === "exercice");
    expect(exerciceGroup).toBeDefined();
    expect(exerciceGroup!.items.length).toBeGreaterThan(0);
  });

  it('search("drop set") returns a methode result', () => {
    const groups = search("drop set");
    const methodeGroup = groups.find((g) => g.type === "methode");
    expect(methodeGroup).toBeDefined();
    expect(methodeGroup!.items.some((i) => i.slug === "drop-set")).toBe(true);
  });

  it('search("RIR") returns apprendre and glossaire results', () => {
    const groups = search("RIR");
    const types = groups.map((g) => g.type);
    expect(types).toContain("apprendre");
    expect(types).toContain("glossaire");
  });

  it("is accent-insensitive", () => {
    const withAccent = search("péctoraux");
    const withoutAccent = search("pectoraux");
    // Both should return results with the same slugs
    const slugsAccent = withAccent.flatMap((g) => g.items.map((i) => i.slug));
    const slugsNoAccent = withoutAccent.flatMap((g) => g.items.map((i) => i.slug));
    expect(slugsAccent).toEqual(slugsNoAccent);
  });

  it("is case-insensitive", () => {
    const upper = search("GAINAGE");
    const lower = search("gainage");
    expect(upper.length).toBe(lower.length);
  });

  it("results are grouped by type in order: exercice, methode, apprendre, glossaire", () => {
    const groups = search("RM");
    const types = groups.map((g) => g.type);
    const order = ["exercice", "methode", "apprendre", "glossaire"];
    let lastIndex = -1;
    for (const type of types) {
      const idx = order.indexOf(type);
      expect(idx).toBeGreaterThan(lastIndex);
      lastIndex = idx;
    }
  });

  it("limits results to 8 items per group", () => {
    // Search a very broad term to get many results
    const groups = search("de");
    for (const group of groups) {
      expect(group.items.length).toBeLessThanOrEqual(8);
    }
  });

  it("multi-token query uses AND logic", () => {
    const groups = search("gainage abdos");
    const items = groups.flatMap((g) => g.items);
    // All results must contain both tokens
    for (const item of items) {
      const text = item.searchText.toLowerCase();
      expect(text).toContain("gainage");
      expect(text).toContain("abdo");
    }
  });
});
