import "server-only";
import { unstable_cache } from "next/cache";
import { getAllExercises } from "@/lib/content/fs";
import { getV2ImportIndex } from "@/lib/exercices/getV2ImportIndex";
import { fetchLiveExercises } from "@/lib/live/queries";
import type { ExerciseFrontmatter } from "@/lib/content/schema";
import type { LiveExerciseListItem, LiveExerciseRow } from "@/lib/live/types";

function mergeExercisesIndex(
  exercises: ExerciseFrontmatter[],
  liveRows: LiveExerciseRow[],
  v2Imports: LiveExerciseListItem[],
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

  // Priorité de déduplication: MDX > LIVE > v2 import (v2 ne doit pas masquer).
  const v2Only = v2Imports.filter((exercise) => !takenSlugs.has(exercise.slug));

  return [...mdxItems, ...liveOnly, ...v2Only].sort((a, b) =>
    a.title.localeCompare(b.title, "fr"),
  );
}

async function buildExercisesIndex(locale: string): Promise<LiveExerciseListItem[]> {
  const [exercises, liveRows, v2Imports] = await Promise.all([
    getAllExercises(),
    fetchLiveExercises(locale),
    getV2ImportIndex(),
  ]);

  return mergeExercisesIndex(exercises, liveRows, v2Imports);
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
