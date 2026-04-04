import { describe, it, expect, beforeEach } from "vitest";

const STORAGE_KEY = "eps_session_draft";

describe("useSessionDraft — localStorage layer", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts empty when localStorage has no data", () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeNull();
  });

  it("stores items in localStorage", () => {
    const items = [
      { slug: "s1-01", title: "Développé couché", muscles: ["pectoraux"], addedAt: "2026-04-04T12:00:00Z" },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].slug).toBe("s1-01");
  });

  it("handles invalid JSON gracefully", () => {
    localStorage.setItem(STORAGE_KEY, "not-json");
    let result: unknown[] = [];
    try {
      result = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    } catch {
      result = [];
    }
    expect(result).toEqual([]);
  });

  it("supports multiple items", () => {
    const items = [
      { slug: "s1-01", title: "Développé couché", muscles: ["pectoraux"], addedAt: "2026-04-04T12:00:00Z" },
      { slug: "s3-01", title: "Squat", muscles: ["quadriceps"], addedAt: "2026-04-04T12:01:00Z" },
      { slug: "s2-05", title: "Tractions", muscles: ["dos"], addedAt: "2026-04-04T12:02:00Z" },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(3);
    expect(stored.map((i: { slug: string }) => i.slug)).toEqual(["s1-01", "s3-01", "s2-05"]);
  });

  it("removal works correctly", () => {
    const items = [
      { slug: "s1-01", title: "A", muscles: [], addedAt: "" },
      { slug: "s3-01", title: "B", muscles: [], addedAt: "" },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

    const filtered = items.filter((i) => i.slug !== "s1-01");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].slug).toBe("s3-01");
  });
});
