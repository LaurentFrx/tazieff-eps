import { describe, it, expect } from "vitest";
import { getAllMethodes, getMethode, getMethodesForExercice, getAllLearnPages, getLearnPage, getAllMethods, getMethodBySlug } from "./fs";
import { methodeSchema } from "./schema";

describe("getAllMethodes()", () => {
  it("returns 19 méthodes", async () => {
    const methodes = await getAllMethodes();
    expect(methodes).toHaveLength(19);
  });

  it("each méthode has required fields", async () => {
    const methodes = await getAllMethodes();
    for (const m of methodes) {
      expect(m.slug).toBeTruthy();
      expect(m.titre).toBeTruthy();
      expect(m.categorie).toBeTruthy();
      expect(m.scores).toBeDefined();
      expect(m.parametres).toBeDefined();
    }
  });

  it("méthodes are sorted by ordre", async () => {
    const methodes = await getAllMethodes();
    const withOrdre = methodes.filter((m) => m.ordre !== undefined);
    for (let i = 1; i < withOrdre.length; i++) {
      expect(withOrdre[i].ordre).toBeGreaterThanOrEqual(withOrdre[i - 1].ordre!);
    }
  });
});

describe("getMethode()", () => {
  it('returns drop-set méthode with correct fields', async () => {
    const result = await getMethode("drop-set");
    expect(result).not.toBeNull();
    expect(result!.frontmatter.slug).toBe("drop-set");
    expect(result!.frontmatter.titre).toBeTruthy();
    expect(result!.content).toBeTruthy();
  });

  it("returns null for nonexistent slug", async () => {
    const result = await getMethode("nonexistent-slug-xyz");
    expect(result).toBeNull();
  });
});

describe("getMethodesForExercice()", () => {
  it("returns at least 1 méthode for a common exercise", async () => {
    // Get an exercise slug that appears in some methode's exercices_compatibles
    const methodes = await getAllMethodes();
    const anyExo = methodes
      .flatMap((m) => m.exercices_compatibles)
      .filter(Boolean)[0];
    if (!anyExo) return; // skip if no data
    const result = await getMethodesForExercice(anyExo);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("returns empty array for nonexistent exercise", async () => {
    const result = await getMethodesForExercice("nonexistent-xyz");
    expect(result).toEqual([]);
  });
});

describe("getAllLearnPages()", () => {
  it("returns at least 5 pages", async () => {
    const pages = await getAllLearnPages("fr");
    expect(pages.length).toBeGreaterThanOrEqual(5);
  });

  it("pages are sorted by ordre", async () => {
    const pages = await getAllLearnPages("fr");
    for (let i = 1; i < pages.length; i++) {
      expect(pages[i].ordre).toBeGreaterThanOrEqual(pages[i - 1].ordre);
    }
  });

  it("each page has required fields", async () => {
    const pages = await getAllLearnPages("fr");
    for (const p of pages) {
      expect(p.slug).toBeTruthy();
      expect(p.titre).toBeTruthy();
      expect(typeof p.ordre).toBe("number");
    }
  });
});

describe("getLearnPage()", () => {
  it('returns glossaire page', async () => {
    const result = await getLearnPage("glossaire", "fr");
    expect(result).not.toBeNull();
    expect(result!.frontmatter.slug).toBe("glossaire");
    expect(result!.content).toContain("###");
  });

  it("returns null for nonexistent slug", async () => {
    const result = await getLearnPage("nonexistent-xyz", "fr");
    expect(result).toBeNull();
  });
});

/* ── V2 Methods (content/methods/) ─────────────────────────────────────── */

describe("methodeSchema", () => {
  it("validates a correct method frontmatter", () => {
    const valid = {
      title: "Drop Set",
      slug: "drop-set",
      description: "Technique d'intensification",
      objectifPrincipal: "volume",
      scores: { endurance: 3, hypertrophie: 5, force: 4, puissance: 4 },
      parametres: { series: "1", repetitions: "max", intensite: "80%", recuperation: "3 min" },
      niveau: "intermediaire",
      tags: ["hypertrophie"],
    };
    expect(methodeSchema.parse(valid)).toMatchObject({ slug: "drop-set" });
  });

  it("rejects invalid objectifPrincipal", () => {
    const invalid = {
      title: "Test",
      slug: "test",
      description: "desc",
      objectifPrincipal: "flexibility",
      scores: { endurance: 1, hypertrophie: 1, force: 1, puissance: 1 },
      parametres: { series: "1", repetitions: "1", intensite: "1", recuperation: "1" },
      niveau: "debutant",
      tags: ["test"],
    };
    expect(() => methodeSchema.parse(invalid)).toThrow();
  });

  it("rejects scores out of range", () => {
    const invalid = {
      title: "Test",
      slug: "test",
      description: "desc",
      objectifPrincipal: "endurance",
      scores: { endurance: 6, hypertrophie: 1, force: 1, puissance: 1 },
      parametres: { series: "1", repetitions: "1", intensite: "1", recuperation: "1" },
      niveau: "debutant",
      tags: ["test"],
    };
    expect(() => methodeSchema.parse(invalid)).toThrow();
  });
});

describe("getAllMethods()", () => {
  it("returns at least 1 V2 method (drop-set)", async () => {
    const methods = await getAllMethods("fr");
    expect(methods.length).toBeGreaterThanOrEqual(1);
    expect(methods.some((m) => m.slug === "drop-set")).toBe(true);
  });
});

describe("getMethodBySlug()", () => {
  it("loads drop-set in FR with correct frontmatter", async () => {
    const result = await getMethodBySlug("drop-set", "fr");
    expect(result).not.toBeNull();
    expect(result!.frontmatter.slug).toBe("drop-set");
    expect(result!.frontmatter.objectifPrincipal).toBe("volume");
    expect(result!.frontmatter.niveau).toBe("intermediaire");
    expect(result!.content).toContain("## Principe");
  });

  it("loads drop-set in EN", async () => {
    const result = await getMethodBySlug("drop-set", "en");
    expect(result).not.toBeNull();
    expect(result!.frontmatter.title).toBe("Drop Set");
    expect(result!.content).toContain("## Principle");
  });

  it("falls back to FR when locale file is missing", async () => {
    // Italian locale doesn't exist, should fall back to FR
    const result = await getMethodBySlug("drop-set", "it" as any);
    expect(result).not.toBeNull();
    expect(result!.frontmatter.slug).toBe("drop-set");
  });

  it("returns null for nonexistent method slug", async () => {
    const result = await getMethodBySlug("nonexistent-method-xyz", "fr");
    expect(result).toBeNull();
  });
});
