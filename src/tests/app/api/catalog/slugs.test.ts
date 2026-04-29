// Sprint E.3 (28 avril 2026) — couverture de l'endpoint GET /api/catalog/slugs.
//
// L'endpoint lit le filesystem côté serveur via getAllExercises/getAllMethodes.
// Les tests mockent ces helpers pour valider :
//   - le shape de la payload retournée { exercices, methodes }
//   - le tri alphabétique sur le titre (locale fr)
//   - la propagation du cache-control public/s-maxage
//   - la gestion d'erreur (500 + payload error)

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/content/fs", () => ({
  getAllExercises: vi.fn(),
  getAllMethodes: vi.fn(),
}));

import { getAllExercises, getAllMethodes } from "@/lib/content/fs";
import { GET } from "@/app/api/catalog/slugs/route";

const mockExercises = getAllExercises as unknown as ReturnType<typeof vi.fn>;
const mockMethodes = getAllMethodes as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockExercises.mockReset();
  mockMethodes.mockReset();
});

describe("GET /api/catalog/slugs", () => {
  it("retourne 200 avec exercices et methodes triés par titre fr", async () => {
    mockExercises.mockResolvedValue([
      { slug: "s2-01", title: "Squat", muscles: [], tags: [], themeCompatibility: [1] },
      { slug: "s1-01", title: "Abdominaux", muscles: [], tags: [], themeCompatibility: [1] },
    ]);
    mockMethodes.mockResolvedValue([
      { slug: "circuit-training", titre: "Circuit training", scores: {} },
      { slug: "amrap", titre: "AMRAP", scores: {} },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      exercices: Array<{ slug: string; title: string }>;
      methodes: Array<{ slug: string; title: string }>;
    };

    expect(body.exercices).toHaveLength(2);
    // Tri alphabétique sur title : Abdominaux avant Squat.
    expect(body.exercices[0]).toEqual({ slug: "s1-01", title: "Abdominaux" });
    expect(body.exercices[1]).toEqual({ slug: "s2-01", title: "Squat" });

    expect(body.methodes).toHaveLength(2);
    // Tri alphabétique : AMRAP avant Circuit training.
    expect(body.methodes[0]).toEqual({ slug: "amrap", title: "AMRAP" });
    expect(body.methodes[1]).toEqual({
      slug: "circuit-training",
      title: "Circuit training",
    });
  });

  it("transmet un Cache-Control public avec s-maxage", async () => {
    mockExercises.mockResolvedValue([]);
    mockMethodes.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
    const cacheControl = res.headers.get("Cache-Control") ?? "";
    expect(cacheControl).toMatch(/public/);
    expect(cacheControl).toMatch(/s-maxage=\d+/);
  });

  it("retourne 500 avec payload structuré quand getAllExercises throw", async () => {
    mockExercises.mockRejectedValue(new Error("FS unavailable"));
    mockMethodes.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string; detail: string };
    expect(body.error).toBe("catalog_slugs_failed");
    expect(body.detail).toContain("FS unavailable");
  });

  it("ne fuit aucune donnée frontmatter au-delà des slug + title", async () => {
    mockExercises.mockResolvedValue([
      {
        slug: "s1-01",
        title: "X",
        muscles: ["secret"],
        tags: ["secret"],
        themeCompatibility: [1],
        consignes_securite: "secret note",
      },
    ]);
    mockMethodes.mockResolvedValue([
      {
        slug: "amrap",
        titre: "AMRAP",
        description: "secret",
        scores: { endurance: 5, hypertrophie: 5, force: 5, puissance: 5 },
      },
    ]);

    const res = await GET();
    const body = (await res.json()) as {
      exercices: Array<{ slug: string; title: string }>;
      methodes: Array<{ slug: string; title: string }>;
    };

    // Seuls slug et title sont exposés
    expect(Object.keys(body.exercices[0]).sort()).toEqual(["slug", "title"]);
    expect(Object.keys(body.methodes[0]).sort()).toEqual(["slug", "title"]);
  });
});
