import { describe, it, expect } from "vitest";
import { getAllMethodes, getMethode, getMethodesForExercice, getAllLearnPages, getLearnPage } from "./fs";

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
