import "server-only";
import { unstable_cache } from "next/cache";
import { getAllExercises } from "@/lib/content/fs";
import { fetchLiveExercises } from "@/lib/live/queries";
import type { ExerciseFrontmatter } from "@/lib/content/schema";
import type { LiveExerciseListItem, LiveExerciseRow } from "@/lib/live/types";

function mergeExercisesIndex(
  exercises: ExerciseFrontmatter[],
  liveRows: LiveExerciseRow[],
): LiveExerciseListItem[] {
  const mdxSlugs = new Set(exercises.map((exercise) => exercise.slug));
  const liveOnly = liveRows
    .map((row) => ({
      ...row.data_json.frontmatter,
      slug: row.slug,
      isLive: true,
    }))
    .filter((exercise) => !mdxSlugs.has(exercise.slug));

  return [
    ...exercises.map((exercise) => ({ ...exercise, isLive: false })),
    ...liveOnly,
  ].sort((a, b) => a.title.localeCompare(b.title, "fr"));
}

async function buildExercisesIndex(locale: string): Promise<LiveExerciseListItem[]> {
  const [exercises, liveRows] = await Promise.all([
    getAllExercises(),
    fetchLiveExercises(locale),
  ]);

  return mergeExercisesIndex(exercises, liveRows);
}

const getExercisesIndexCached = unstable_cache(
  async (locale: string) => buildExercisesIndex(locale),
  ["exercises-index"],
  { tags: ["exercises"] },
);

export async function getExercisesIndex(locale: string) {
  if (process.env.NODE_ENV === "development") {
    return buildExercisesIndex(locale);
  }
  return getExercisesIndexCached(locale);
}
