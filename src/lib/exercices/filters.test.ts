import { describe, it, expect } from "vitest";
import {
  mergeExercises,
  filterVisibleExercises,
  filterExercises,
  NO_EQUIPMENT_ID,
} from "./filters";
import type { ExerciseListItem } from "./filters";
import type { LiveExerciseListItem, LiveExerciseRow } from "@/lib/live/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeExercise(
  overrides: Partial<LiveExerciseListItem> = {},
): LiveExerciseListItem {
  return {
    title: "Pompes",
    slug: "pompes",
    tags: ["upper-body"],
    themeCompatibility: [1],
    muscles: ["pectoraux"],
    isLive: false,
    ...overrides,
  };
}

function makeListItem(
  overrides: Partial<ExerciseListItem> = {},
): ExerciseListItem {
  return {
    title: "Pompes",
    slug: "pompes",
    tags: ["upper-body"],
    themeCompatibility: [1],
    muscles: ["pectoraux"],
    isLive: false,
    ...overrides,
  };
}

function makeLiveRow(
  slug: string,
  overrides: Partial<{ title: string; status: string }> = {},
): LiveExerciseRow {
  return {
    slug,
    locale: "fr",
    data_json: {
      frontmatter: {
        title: overrides.title ?? slug,
        slug,
        tags: ["live"],
        themeCompatibility: [1],
        muscles: ["jambes"],
      },
      content: "",
      ...(overrides.status ? { status: overrides.status } : {}),
    } as LiveExerciseRow["data_json"],
  };
}

// ===================================================================
// mergeExercises
// ===================================================================

describe("mergeExercises", () => {
  it("returns exercises unchanged when no live rows", () => {
    const exercises = [makeExercise()];
    const result = mergeExercises(exercises, []);
    expect(result).toBe(exercises);
  });

  it("adds live exercises not present in MDX", () => {
    const mdx = [makeExercise({ slug: "pompes", isLive: false })];
    const live = [makeLiveRow("squats")];
    const result = mergeExercises(mdx, live);
    expect(result.map((e) => e.slug)).toContain("squats");
  });

  it("does not duplicate exercises with same slug", () => {
    const mdx = [makeExercise({ slug: "pompes", isLive: false })];
    const live = [makeLiveRow("pompes")];
    const result = mergeExercises(mdx, live);
    const slugs = result.map((e) => e.slug);
    expect(slugs.filter((s) => s === "pompes")).toHaveLength(1);
  });

  it("prefers MDX over live for same slug", () => {
    const mdx = [makeExercise({ slug: "pompes", title: "MDX Pompes", isLive: false })];
    const live = [makeLiveRow("pompes", { title: "Live Pompes" })];
    const result = mergeExercises(mdx, live);
    const pompes = result.find((e) => e.slug === "pompes");
    expect(pompes?.title).toBe("MDX Pompes");
  });

  it("sorts ready exercises before drafts", () => {
    const mdx: LiveExerciseListItem[] = [];
    const live = [
      makeLiveRow("draft-exo", { title: "AAA Draft", status: "draft" }),
      makeLiveRow("ready-exo", { title: "ZZZ Ready", status: "ready" }),
    ];
    const result = mergeExercises(mdx, live);
    expect(result[0].slug).toBe("ready-exo");
    expect(result[1].slug).toBe("draft-exo");
  });

  it("sorts alphabetically within same status", () => {
    const mdx: LiveExerciseListItem[] = [];
    const live = [
      makeLiveRow("b-exo", { title: "Burpees" }),
      makeLiveRow("a-exo", { title: "Abdos" }),
    ];
    const result = mergeExercises(mdx, live);
    expect(result[0].title).toBe("Abdos");
    expect(result[1].title).toBe("Burpees");
  });

  it("marks live items with isLive=true", () => {
    const result = mergeExercises([], [makeLiveRow("squats")]);
    expect(result[0].isLive).toBe(true);
  });

  it("filters out isLive MDX items before merging", () => {
    const mdx = [
      makeExercise({ slug: "pompes", isLive: true }),
      makeExercise({ slug: "abdos", isLive: false }),
    ];
    const live = [makeLiveRow("pompes", { title: "Live Pompes" })];
    const result = mergeExercises(mdx, live);
    const pompes = result.find((e) => e.slug === "pompes");
    expect(pompes?.isLive).toBe(true);
    expect(pompes?.title).toBe("Live Pompes");
  });

  it("preserves status from live data_json", () => {
    const result = mergeExercises(
      [],
      [makeLiveRow("draft", { status: "draft" })],
    );
    expect((result[0] as ExerciseListItem).status).toBe("draft");
  });

  it("handles empty arrays", () => {
    expect(mergeExercises([], [])).toEqual([]);
  });
});

// ===================================================================
// filterVisibleExercises
// ===================================================================

describe("filterVisibleExercises", () => {
  it("returns all exercises when teacher is unlocked", () => {
    const items: ExerciseListItem[] = [
      makeListItem({ status: "draft" }),
      makeListItem({ slug: "squats", status: "ready" }),
    ];
    expect(filterVisibleExercises(items, true)).toHaveLength(2);
  });

  it("hides drafts when teacher is locked", () => {
    const items: ExerciseListItem[] = [
      makeListItem({ status: "draft" }),
      makeListItem({ slug: "squats", status: "ready" }),
    ];
    const result = filterVisibleExercises(items, false);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("squats");
  });

  it("keeps exercises without status (undefined = ready)", () => {
    const items: ExerciseListItem[] = [makeListItem()];
    const result = filterVisibleExercises(items, false);
    expect(result).toHaveLength(1);
  });

  it("returns empty array when all are drafts and locked", () => {
    const items: ExerciseListItem[] = [
      makeListItem({ status: "draft" }),
      makeListItem({ slug: "s2", status: "draft" }),
    ];
    expect(filterVisibleExercises(items, false)).toHaveLength(0);
  });

  it("returns empty for empty input", () => {
    expect(filterVisibleExercises([], false)).toHaveLength(0);
    expect(filterVisibleExercises([], true)).toHaveLength(0);
  });
});

// ===================================================================
// filterExercises
// ===================================================================

describe("filterExercises", () => {
  const exercises: ExerciseListItem[] = [
    makeListItem({
      slug: "pompes",
      title: "Pompes",
      tags: ["upper-body", "renforcement"],
      muscles: ["pectoraux", "triceps"],
      level: "debutant",
      equipment: ["tapis"],
      themeCompatibility: [1, 2],
    }),
    makeListItem({
      slug: "squats",
      title: "Squats",
      tags: ["lower-body", "renforcement"],
      muscles: ["quadriceps"],
      level: "intermediaire",
      themeCompatibility: [2, 3],
    }),
    makeListItem({
      slug: "burpees",
      title: "Burpees",
      tags: ["cardio"],
      muscles: ["full-body"],
      level: "avance",
      equipment: ["tapis"],
      themeCompatibility: [1],
    }),
    makeListItem({
      slug: "planche",
      title: "Planche",
      tags: ["core"],
      muscles: ["abdominaux"],
      themeCompatibility: [3],
    }),
  ];

  // --- No filter ---
  it("returns all when no criteria provided", () => {
    expect(filterExercises(exercises, {})).toHaveLength(4);
  });

  // --- Text search ---
  it("filters by text query on title", () => {
    const result = filterExercises(exercises, { query: "pompes" });
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("pompes");
  });

  it("filters by text query case-insensitive", () => {
    const result = filterExercises(exercises, { query: "SQUATS" });
    expect(result).toHaveLength(1);
  });

  it("matches query against tags", () => {
    const result = filterExercises(exercises, { query: "cardio" });
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("burpees");
  });

  it("matches query against muscles", () => {
    const result = filterExercises(exercises, { query: "triceps" });
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("pompes");
  });

  it("trims query whitespace", () => {
    const result = filterExercises(exercises, { query: "  pompes  " });
    expect(result).toHaveLength(1);
  });

  it("returns all when query is empty string", () => {
    expect(filterExercises(exercises, { query: "" })).toHaveLength(4);
  });

  it("returns all when query is only whitespace", () => {
    expect(filterExercises(exercises, { query: "   " })).toHaveLength(4);
  });

  // --- Level filter ---
  it("filters by single level", () => {
    const result = filterExercises(exercises, { levels: ["debutant"] });
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("pompes");
  });

  it("filters by multiple levels", () => {
    const result = filterExercises(exercises, {
      levels: ["debutant", "avance"],
    });
    expect(result).toHaveLength(2);
  });

  it("excludes exercises without level when level filter active", () => {
    const result = filterExercises(exercises, { levels: ["debutant"] });
    expect(result.find((e) => e.slug === "planche")).toBeUndefined();
  });

  it("returns all when levels is empty array", () => {
    expect(filterExercises(exercises, { levels: [] })).toHaveLength(4);
  });

  // --- Equipment filter ---
  it("filters by equipment value", () => {
    const result = filterExercises(exercises, { equipment: ["tapis"] });
    expect(result).toHaveLength(2);
  });

  it("filters by sans-materiel", () => {
    const result = filterExercises(exercises, {
      equipment: [NO_EQUIPMENT_ID],
    });
    // squats and planche have no equipment
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.slug).sort()).toEqual(["planche", "squats"]);
  });

  it("combines sans-materiel with named equipment", () => {
    const result = filterExercises(exercises, {
      equipment: [NO_EQUIPMENT_ID, "tapis"],
    });
    // All 4 match: pompes+burpees have tapis, squats+planche have no equipment
    expect(result).toHaveLength(4);
  });

  it("returns all when equipment is empty array", () => {
    expect(filterExercises(exercises, { equipment: [] })).toHaveLength(4);
  });

  // --- Tags filter ---
  it("filters by single tag", () => {
    const result = filterExercises(exercises, { tags: ["cardio"] });
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("burpees");
  });

  it("filters by multiple tags (OR logic)", () => {
    const result = filterExercises(exercises, {
      tags: ["cardio", "core"],
    });
    expect(result).toHaveLength(2);
  });

  it("matches exercises with at least one matching tag", () => {
    const result = filterExercises(exercises, { tags: ["renforcement"] });
    expect(result).toHaveLength(2);
  });

  // --- Theme filter ---
  it("filters by single theme", () => {
    const result = filterExercises(exercises, { themes: [3] });
    expect(result).toHaveLength(2); // squats (2,3) and planche (3)
  });

  it("filters by multiple themes (OR logic)", () => {
    const result = filterExercises(exercises, { themes: [1, 3] });
    expect(result).toHaveLength(4);
  });

  it("excludes exercises with empty themeCompatibility", () => {
    const exWithEmpty: ExerciseListItem[] = [
      makeListItem({ slug: "empty-theme", themeCompatibility: [] }),
    ];
    const result = filterExercises(exWithEmpty, { themes: [1] });
    expect(result).toHaveLength(0);
  });

  // --- Favorites filter ---
  it("filters only favorites when onlyFavorites=true", () => {
    const result = filterExercises(exercises, {
      onlyFavorites: true,
      favorites: ["squats"],
    });
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("squats");
  });

  it("returns empty when onlyFavorites=true and no favorites match", () => {
    const result = filterExercises(exercises, {
      onlyFavorites: true,
      favorites: [],
    });
    expect(result).toHaveLength(0);
  });

  it("ignores favorites list when onlyFavorites=false", () => {
    const result = filterExercises(exercises, {
      onlyFavorites: false,
      favorites: ["squats"],
    });
    expect(result).toHaveLength(4);
  });

  // --- Combined filters ---
  it("combines level + tags", () => {
    const result = filterExercises(exercises, {
      levels: ["debutant"],
      tags: ["renforcement"],
    });
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("pompes");
  });

  it("combines query + level", () => {
    const result = filterExercises(exercises, {
      query: "renforcement",
      levels: ["intermediaire"],
    });
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("squats");
  });

  it("combines equipment + theme", () => {
    const result = filterExercises(exercises, {
      equipment: ["tapis"],
      themes: [1],
    });
    // pompes (tapis, theme 1,2) and burpees (tapis, theme 1)
    expect(result).toHaveLength(2);
  });

  it("returns empty when combined filters have no intersection", () => {
    const result = filterExercises(exercises, {
      levels: ["avance"],
      tags: ["core"],
    });
    expect(result).toHaveLength(0);
  });

  // --- Edge cases ---
  it("handles empty exercises array", () => {
    expect(filterExercises([], { query: "test" })).toHaveLength(0);
  });

  it("handles undefined optional fields gracefully", () => {
    const minimal: ExerciseListItem[] = [
      makeListItem({ equipment: undefined, level: undefined }),
    ];
    const result = filterExercises(minimal, {});
    expect(result).toHaveLength(1);
  });
});
