import type { ExerciseFrontmatter } from "@/lib/content/schema";

export type ExercisePatch = {
  frontmatter?: Partial<ExerciseFrontmatter>;
  sections?: Record<string, string>;
};

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
  patch_json: ExercisePatch;
  updated_at?: string | null;
};

export type LiveExerciseListItem = ExerciseFrontmatter & {
  isLive?: boolean;
};
