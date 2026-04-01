import { describe, it, expect } from "vitest";
import { epley, brzycki, buildRmTable, RM_TABLE } from "./rm";

describe("epley()", () => {
  it("returns charge when reps=1", () => {
    expect(epley(100, 1)).toBe(100);
  });

  it("computes 1RM for charge=80, reps=10", () => {
    // 80 * (1 + 10/30) = 80 * 1.333 = 106.67 → 107
    expect(epley(80, 10)).toBe(107);
  });

  it("computes 1RM for charge=60, reps=5", () => {
    // 60 * (1 + 5/30) = 60 * 1.167 = 70
    expect(epley(60, 5)).toBe(70);
  });

  it("returns 0 for charge=0", () => {
    expect(epley(0, 10)).toBe(0);
  });

  it("returns 0 for reps=0", () => {
    expect(epley(80, 0)).toBe(0);
  });

  it("returns 0 for negative values", () => {
    expect(epley(-10, 5)).toBe(0);
    expect(epley(80, -3)).toBe(0);
  });

  it("never returns NaN or Infinity", () => {
    const result = epley(80, 10);
    expect(Number.isFinite(result)).toBe(true);
  });
});

describe("brzycki()", () => {
  it("returns charge when reps=1", () => {
    expect(brzycki(100, 1)).toBe(100);
  });

  it("computes 1RM for charge=80, reps=10", () => {
    // 80 * (36 / (37-10)) = 80 * (36/27) = 80 * 1.333 = 106.67 → 107
    expect(brzycki(80, 10)).toBe(107);
  });

  it("handles reps >= 37 edge case", () => {
    const result = brzycki(10, 37);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBe(370); // 10 * 37
  });

  it("returns 0 for charge=0", () => {
    expect(brzycki(0, 10)).toBe(0);
  });

  it("returns 0 for reps=0", () => {
    expect(brzycki(80, 0)).toBe(0);
  });

  it("never returns NaN or Infinity", () => {
    for (let reps = 1; reps <= 40; reps++) {
      const result = brzycki(80, reps);
      expect(Number.isFinite(result)).toBe(true);
    }
  });
});

describe("RM_TABLE", () => {
  it("has 15 rows (30–100% by 5)", () => {
    expect(RM_TABLE).toHaveLength(15);
  });

  it("starts at 100% and ends at 30%", () => {
    expect(RM_TABLE[0].pct).toBe(100);
    expect(RM_TABLE[RM_TABLE.length - 1].pct).toBe(30);
  });

  it("percentages are in descending order", () => {
    for (let i = 1; i < RM_TABLE.length; i++) {
      expect(RM_TABLE[i].pct).toBeLessThan(RM_TABLE[i - 1].pct);
    }
  });

  it("includes 95% force entry", () => {
    const row95 = RM_TABLE.find((r) => r.pct === 95);
    expect(row95).toBeDefined();
    expect(row95!.zone).toBe("force");
    expect(row95!.reps).toBe(2);
  });
});

describe("buildRmTable()", () => {
  it("returns 15 rows with computed charges", () => {
    const table = buildRmTable(100);
    expect(table).toHaveLength(15);
    expect(table[0].charge).toBe(100); // 100% of 100
    expect(table[2].charge).toBe(90);  // 90% of 100
    expect(table[14].charge).toBe(30); // 30% of 100
  });

  it("rounds charges correctly", () => {
    const table = buildRmTable(107);
    expect(table[0].charge).toBe(107);       // 100%
    expect(table[2].charge).toBe(96);        // 90% of 107 = 96.3 → 96
    expect(table[4].charge).toBe(86);        // 80% of 107 = 85.6 → 86
  });
});
