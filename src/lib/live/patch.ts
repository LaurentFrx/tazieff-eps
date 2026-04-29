import type { ExerciseFrontmatter } from "@/lib/content/schema";
import type { ExerciseLiveDocV2, ExerciseOverridePatch } from "@/lib/live/types";

export type MarkdownSection = {
  heading: string;
  body: string;
};

export type MarkdownSections = {
  intro: string;
  sections: MarkdownSection[];
};

export function splitMarkdownSections(content: string): MarkdownSections {
  const lines = content.split(/\r?\n/);
  const introLines: string[] = [];
  const sections: MarkdownSection[] = [];
  let currentHeading: string | null = null;
  let currentLines: string[] = [];

  const flush = () => {
    if (currentHeading) {
      sections.push({
        heading: currentHeading,
        body: currentLines.join("\n").trim(),
      });
    } else if (currentLines.length > 0) {
      introLines.push(...currentLines);
    }
    currentHeading = null;
    currentLines = [];
  };

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      flush();
      currentHeading = match[1].trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  flush();

  return {
    intro: introLines.join("\n").trim(),
    sections,
  };
}

export type ExerciseRenderOverride = {
  frontmatter: ExerciseFrontmatter;
  content: string;
  override?: ExerciseLiveDocV2;
};

function isLiveDocV2(patch: unknown): patch is ExerciseLiveDocV2 {
  if (!patch || typeof patch !== "object") {
    return false;
  }
  const candidate = patch as ExerciseLiveDocV2;
  return (
    candidate.version === 2 &&
    !!candidate.doc &&
    Array.isArray(candidate.doc.sections)
  );
}

export function applyExercisePatch(
  base: { frontmatter: ExerciseFrontmatter; content: string },
  patch?: ExerciseOverridePatch | null,
): ExerciseRenderOverride {
  if (!patch) {
    return { ...base };
  }

  if (isLiveDocV2(patch)) {
    // Sprint E.3 — fusionne frontmatterPatch dans le frontmatter merged pour
    // que le rendu côté élève lise transparente `merged.frontmatter.<champ>`
    // sans connaître l'existence du patch override. Rétrocompatible : un
    // override v2 sans frontmatterPatch retourne exactement le base.frontmatter.
    const fmPatch = patch.doc.frontmatterPatch;
    if (fmPatch) {
      const mergedFrontmatter: ExerciseFrontmatter = {
        ...base.frontmatter,
        ...(fmPatch.methodes_compatibles !== undefined
          ? { methodes_compatibles: fmPatch.methodes_compatibles }
          : {}),
        ...(fmPatch.exercices_similaires !== undefined
          ? { exercices_similaires: fmPatch.exercices_similaires }
          : {}),
        ...(fmPatch.consignes_securite !== undefined
          ? { consignes_securite: fmPatch.consignes_securite }
          : {}),
      };
      return {
        frontmatter: mergedFrontmatter,
        content: base.content,
        override: patch,
      };
    }
    return {
      frontmatter: base.frontmatter,
      content: base.content,
      override: patch,
    };
  }

  return { ...base };
}
