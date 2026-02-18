import "server-only";
import { unstable_cache } from "next/cache";
import { getAllExercises } from "@/lib/content/fs";
import { getImportedExercisesIndex } from "@/lib/exercices/getImportedExercisesIndex";
import { fetchLiveExercises } from "@/lib/live/queries";
import type { ExerciseFrontmatter } from "@/lib/content/schema";
import type { LiveExerciseListItem, LiveExerciseRow } from "@/lib/live/types";
import type { Lang } from "@/lib/i18n/messages";

function mergeExercisesIndex(
  exercises: ExerciseFrontmatter[],
  liveRows: LiveExerciseRow[],
  importedExercises: LiveExerciseListItem[],
): LiveExerciseListItem[] {
  const mdxSlugs = new Set(exercises.map((exercise) => exercise.slug));
  const liveOnly = liveRows
    .map((row) => ({
      ...row.data_json.frontmatter,
      slug: row.slug,
      isLive: true,
    }))
    .filter((exercise) => !mdxSlugs.has(exercise.slug));

  const mdxItems = exercises.map((exercise) => ({ ...exercise, isLive: false }));
  const takenSlugs = new Set(mdxItems.map((exercise) => exercise.slug));
  liveOnly.forEach((exercise) => takenSlugs.add(exercise.slug));

  // Deduplication priority: MDX > Live > Imported
  const importedOnly = importedExercises.filter((exercise) => !takenSlugs.has(exercise.slug));

  return [...mdxItems, ...liveOnly, ...importedOnly].sort((a, b) =>
    a.title.localeCompare(b.title, "fr"),
  );
}

async function buildExercisesIndex(locale: Lang): Promise<LiveExerciseListItem[]> {
  const [exercises, liveRows, importedExercises] = await Promise.all([
    getAllExercises(locale),
    fetchLiveExercises(locale),
    getImportedExercisesIndex(),
  ]);

  return mergeExercisesIndex(exercises, liveRows, importedExercises);
}

const getExercisesIndexCached = unstable_cache(
  async (locale: Lang) => buildExercisesIndex(locale),
  ["exercises-index"],
  { tags: ["exercises"] },
);

export async function getExercisesIndex(locale: Lang) {
  if (process.env.NODE_ENV === "development") {
    return buildExercisesIndex(locale);
  }
  return getExercisesIndexCached(locale);
}
