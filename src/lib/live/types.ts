import type { ExerciseFrontmatter } from "@/lib/content/schema";

export type ExercisePatch = {
  frontmatter?: Partial<ExerciseFrontmatter>;
  sections?: Record<string, string>;
};

export type ExerciseLiveMarkdownBlock = {
  type: "markdown";
  content: string;
};

export type ExerciseLiveBulletsBlock = {
  type: "bullets";
  items: string[];
};

export type ExerciseLiveMediaBlock =
  | {
      type: "media";
      mediaType: "image";
      mediaId?: string;
      url?: string;
      caption?: string;
    }
  | {
      type: "media";
      mediaType: "video" | "link";
      url: string;
      caption?: string;
    };

export type ExerciseLiveSection = {
  id: string;
  title: string;
  blocks: Array<ExerciseLiveMarkdownBlock | ExerciseLiveBulletsBlock | ExerciseLiveMediaBlock>;
};

/**
 * Sprint E.3 (28 avril 2026) — patch ciblé des champs frontmatter qui n'ont
 * pas de représentation native dans `pills` ou `sections`. Sert à persister
 * dans la couche override admin :
 *   - `methodes_compatibles` : slugs vers content/methodes/<slug>.<locale>.mdx
 *   - `exercices_similaires` : slugs vers content/exercices/<slug>.<locale>.mdx
 *   - `consignes_securite` : courte consigne affichée par ExerciseQuickInfo
 *
 * Optionnel et rétrocompatible : un override v2 sans `frontmatterPatch`
 * continue de fonctionner exactement comme avant. Côté lecture,
 * `applyExercisePatch()` fusionne ce patch dans le frontmatter pour que le
 * reste du rendu lise simplement `merged.frontmatter.<champ>`.
 */
export type ExerciseLiveFrontmatterPatch = {
  methodes_compatibles?: string[];
  exercices_similaires?: string[];
  consignes_securite?: string;
};

export type ExerciseLiveDocV2 = {
  version: 2;
  doc: {
    heroImage?: { url: string; alt?: string };
    pills?: Array<{ label: string; kind?: string }>;
    sections: ExerciseLiveSection[];
    /** Phase E.3 (28 avril 2026) — patch des champs frontmatter sans pills. */
    frontmatterPatch?: ExerciseLiveFrontmatterPatch;
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
