import { describe, it, expect } from "vitest";
import { splitMarkdownSections, applyExercisePatch } from "./patch";
import type { ExerciseFrontmatter } from "@/lib/content/schema";
import type { ExerciseLiveDocV2 } from "./types";

describe("splitMarkdownSections", () => {
  it("returns empty intro and no sections for empty content", () => {
    const result = splitMarkdownSections("");
    expect(result.intro).toBe("");
    expect(result.sections).toEqual([]);
  });

  it("puts all content in intro when no ## heading is present", () => {
    const result = splitMarkdownSections("Hello\nWorld");
    expect(result.intro).toBe("Hello\nWorld");
    expect(result.sections).toEqual([]);
  });

  it("splits content on ## headings", () => {
    const content = "intro line\n## First\nbody 1\n## Second\nbody 2";
    const result = splitMarkdownSections(content);
    expect(result.intro).toBe("intro line");
    expect(result.sections).toEqual([
      { heading: "First", body: "body 1" },
      { heading: "Second", body: "body 2" },
    ]);
  });

  it("returns empty intro when content starts with a ## heading", () => {
    const result = splitMarkdownSections("## First\nbody");
    expect(result.intro).toBe("");
    expect(result.sections).toEqual([{ heading: "First", body: "body" }]);
  });

  it("trims whitespace in section body", () => {
    const result = splitMarkdownSections("## First\n\nbody\n\n");
    expect(result.sections[0].body).toBe("body");
  });

  it("trims trailing whitespace in heading", () => {
    const result = splitMarkdownSections("## Heading   \nbody");
    expect(result.sections[0].heading).toBe("Heading");
  });

  it("handles CRLF line endings", () => {
    const result = splitMarkdownSections("intro\r\n## First\r\nbody");
    expect(result.intro).toBe("intro");
    expect(result.sections).toEqual([{ heading: "First", body: "body" }]);
  });

  it("keeps empty body when two headings are consecutive", () => {
    const result = splitMarkdownSections("## Empty\n## Next\nbody");
    expect(result.sections).toEqual([
      { heading: "Empty", body: "" },
      { heading: "Next", body: "body" },
    ]);
  });

  it("does not treat ### as a section heading (only ## is split)", () => {
    const result = splitMarkdownSections("### Sub\nbody");
    expect(result.intro).toBe("### Sub\nbody");
    expect(result.sections).toEqual([]);
  });
});

const BASE_FRONTMATTER = {
  slug: "test-exo",
  title: "Test",
} as unknown as ExerciseFrontmatter;

describe("applyExercisePatch", () => {
  const base = { frontmatter: BASE_FRONTMATTER, content: "original content" };

  it("returns base unchanged when patch is undefined", () => {
    const result = applyExercisePatch(base);
    expect(result.frontmatter).toBe(BASE_FRONTMATTER);
    expect(result.content).toBe("original content");
    expect(result.override).toBeUndefined();
  });

  it("returns base unchanged when patch is null", () => {
    const result = applyExercisePatch(base, null);
    expect(result.override).toBeUndefined();
    expect(result.content).toBe("original content");
  });

  it("sets override when patch is a valid ExerciseLiveDocV2", () => {
    const patch: ExerciseLiveDocV2 = {
      version: 2,
      doc: { sections: [{ id: "a", title: "A", blocks: [] }] },
    };
    const result = applyExercisePatch(base, patch);
    expect(result.override).toBe(patch);
    expect(result.content).toBe("original content");
    expect(result.frontmatter).toBe(BASE_FRONTMATTER);
  });

  it("ignores legacy v1 patch shape (frontmatter/sections record)", () => {
    const legacyPatch = {
      sections: { intro: "new intro" },
    } as unknown as ExerciseLiveDocV2;
    const result = applyExercisePatch(base, legacyPatch);
    expect(result.override).toBeUndefined();
  });

  it("rejects non-object patch via isLiveDocV2 guard", () => {
    const result = applyExercisePatch(
      base,
      "bad-patch" as unknown as ExerciseLiveDocV2,
    );
    expect(result.override).toBeUndefined();
  });

  it("rejects patch with version != 2", () => {
    const patch = {
      version: 1,
      doc: { sections: [] },
    } as unknown as ExerciseLiveDocV2;
    const result = applyExercisePatch(base, patch);
    expect(result.override).toBeUndefined();
  });

  it("rejects patch where doc.sections is not an array", () => {
    const patch = {
      version: 2,
      doc: { sections: "not-an-array" },
    } as unknown as ExerciseLiveDocV2;
    const result = applyExercisePatch(base, patch);
    expect(result.override).toBeUndefined();
  });

  it("never mutates base.content", () => {
    const patch: ExerciseLiveDocV2 = { version: 2, doc: { sections: [] } };
    const snapshot = base.content;
    applyExercisePatch(base, patch);
    expect(base.content).toBe(snapshot);
  });

  // Sprint E.3 (28 avril 2026) — frontmatterPatch est un ajout rétrocompatible
  // qui permet d'overrider methodes_compatibles, exercices_similaires et
  // consignes_securite côté admin sans toucher au frontmatter MDX original.
  describe("frontmatterPatch (Sprint E.3)", () => {
    it("ne touche pas au frontmatter quand frontmatterPatch est absent", () => {
      const patch: ExerciseLiveDocV2 = {
        version: 2,
        doc: { sections: [] },
      };
      const result = applyExercisePatch(base, patch);
      expect(result.frontmatter).toBe(BASE_FRONTMATTER);
      expect(result.override).toBe(patch);
    });

    it("merge frontmatterPatch.consignes_securite dans le frontmatter retourné", () => {
      const patch: ExerciseLiveDocV2 = {
        version: 2,
        doc: {
          sections: [],
          frontmatterPatch: { consignes_securite: "Bassin neutre, dos plat." },
        },
      };
      const result = applyExercisePatch(base, patch);
      expect(result.frontmatter.consignes_securite).toBe("Bassin neutre, dos plat.");
      // Les autres champs frontmatter restent inchangés.
      expect(result.frontmatter.title).toBe(BASE_FRONTMATTER.title);
      expect(result.frontmatter.slug).toBe(BASE_FRONTMATTER.slug);
    });

    it("merge frontmatterPatch.methodes_compatibles dans le frontmatter retourné", () => {
      const patch: ExerciseLiveDocV2 = {
        version: 2,
        doc: {
          sections: [],
          frontmatterPatch: {
            methodes_compatibles: ["amrap", "circuit-training"],
          },
        },
      };
      const result = applyExercisePatch(base, patch);
      expect(result.frontmatter.methodes_compatibles).toEqual([
        "amrap",
        "circuit-training",
      ]);
    });

    it("merge frontmatterPatch.exercices_similaires dans le frontmatter retourné", () => {
      const patch: ExerciseLiveDocV2 = {
        version: 2,
        doc: {
          sections: [],
          frontmatterPatch: {
            exercices_similaires: ["s1-02", "s1-03"],
          },
        },
      };
      const result = applyExercisePatch(base, patch);
      expect(result.frontmatter.exercices_similaires).toEqual(["s1-02", "s1-03"]);
    });

    it("merge plusieurs champs frontmatterPatch en un seul passage", () => {
      const patch: ExerciseLiveDocV2 = {
        version: 2,
        doc: {
          sections: [],
          frontmatterPatch: {
            methodes_compatibles: ["amrap"],
            exercices_similaires: ["s2-01"],
            consignes_securite: "Garde la respiration continue.",
          },
        },
      };
      const result = applyExercisePatch(base, patch);
      expect(result.frontmatter.methodes_compatibles).toEqual(["amrap"]);
      expect(result.frontmatter.exercices_similaires).toEqual(["s2-01"]);
      expect(result.frontmatter.consignes_securite).toBe(
        "Garde la respiration continue.",
      );
    });

    it("ne mute pas le base.frontmatter d'origine quand frontmatterPatch est appliqué", () => {
      const patch: ExerciseLiveDocV2 = {
        version: 2,
        doc: {
          sections: [],
          frontmatterPatch: { consignes_securite: "X" },
        },
      };
      const result = applyExercisePatch(base, patch);
      // Le frontmatter retourné contient le patch…
      expect(result.frontmatter.consignes_securite).toBe("X");
      // …mais l'objet d'origine (BASE_FRONTMATTER) reste intact.
      expect(BASE_FRONTMATTER.consignes_securite).toBeUndefined();
    });
  });
});
