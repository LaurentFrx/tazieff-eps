import type { ExerciseFrontmatter } from "@/lib/content/schema";
import type { ExercisePatch } from "@/lib/live/types";

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

function buildMarkdownContent({ intro, sections }: MarkdownSections) {
  const chunks: string[] = [];
  const introTrimmed = intro.trim();

  if (introTrimmed) {
    chunks.push(introTrimmed);
  }

  for (const section of sections) {
    const heading = section.heading.trim();
    const body = section.body.trim();
    if (!heading) {
      continue;
    }
    chunks.push(body ? `## ${heading}\n${body}` : `## ${heading}`);
  }

  return chunks.join("\n\n").trim();
}

export function applyExercisePatch(
  base: { frontmatter: ExerciseFrontmatter; content: string },
  patch?: ExercisePatch | null,
): { frontmatter: ExerciseFrontmatter; content: string } {
  if (!patch) {
    return base;
  }

  const nextFrontmatter = patch.frontmatter
    ? { ...base.frontmatter, ...patch.frontmatter }
    : base.frontmatter;

  if (!patch.sections || Object.keys(patch.sections).length === 0) {
    return {
      frontmatter: nextFrontmatter,
      content: base.content,
    };
  }

  const parsed = splitMarkdownSections(base.content);
  const sections = [...parsed.sections];
  const index = new Map(sections.map((section, idx) => [section.heading, idx]));

  for (const [heading, body] of Object.entries(patch.sections)) {
    const normalizedHeading = heading.trim();
    if (!normalizedHeading) {
      continue;
    }
    const value = typeof body === "string" ? body : "";
    const existingIndex = index.get(normalizedHeading);
    if (existingIndex !== undefined) {
      sections[existingIndex] = { heading: normalizedHeading, body: value };
    } else {
      sections.push({ heading: normalizedHeading, body: value });
      index.set(normalizedHeading, sections.length - 1);
    }
  }

  return {
    frontmatter: nextFrontmatter,
    content: buildMarkdownContent({ intro: parsed.intro, sections }),
  };
}
