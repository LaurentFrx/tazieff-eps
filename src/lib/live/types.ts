import type { ExerciseFrontmatter } from "@/lib/content/schema";

export type ExercisePatch = {
  frontmatter?: Partial<ExerciseFrontmatter>;
  sections?: Record<string, string>;
};

export type ExerciseLiveMediaBlock = {
  type: "media";
  mediaType: "image" | "video" | "link";
  url: string;
  caption?: string;
};

export type ExerciseLiveMarkdownBlock = {
  type: "markdown";
  content: string;
};

export type ExerciseLiveBulletsBlock = {
  type: "bullets";
  items: string[];
};

export type ExerciseLiveSection = {
  id: string;
  title: string;
  blocks: Array<ExerciseLiveMarkdownBlock | ExerciseLiveBulletsBlock | ExerciseLiveMediaBlock>;
};

export type ExerciseLiveDocV2 = {
  version: 2;
  doc: {
    heroImage?: { url: string; alt?: string };
    pills?: Array<{ label: string; kind?: string }>;
    sections: ExerciseLiveSection[];
  };
};

export type ExerciseOverridePatch = ExercisePatch | ExerciseLiveDocV2;

export type LiveExerciseData = {
  frontmatter: ExerciseFrontmatter;
  content: string;
};

export type LiveExerciseRow = {
  slug: string;
  locale: string;
  data_json: LiveExerciseData;
  updated_at?: string | null;
};

export type ExerciseOverrideRow = {
  slug: string;
  locale: string;
  patch_json: ExerciseOverridePatch;
  updated_at?: string | null;
};

export type LiveExerciseListItem = ExerciseFrontmatter & {
  isLive?: boolean;
};
