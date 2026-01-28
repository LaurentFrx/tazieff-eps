import type { ExerciseLiveDocV2, ExercisePatch } from "@/lib/live/types";
import type { ExerciseFrontmatter } from "@/lib/content/schema";

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
  patch?: ExercisePatch | ExerciseLiveDocV2 | null,
): ExerciseRenderOverride {
  if (!patch) {
    return { ...base };
  }

  if (isLiveDocV2(patch)) {
    return {
      frontmatter: base.frontmatter,
      content: base.content,
      override: patch,
    };
  }

  return { ...base };
}
