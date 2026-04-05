import type { ObjectifSlug } from "./data";
import { OBJECTIFS } from "./data";

/**
 * Returns the set of exercise slugs relevant for a given objectif.
 *
 * Uses two complementary paths:
 * 1. Exercises whose `methodes_compatibles` includes a method of this objectif
 * 2. Exercises listed in `exercices_compatibles` of the objectif's methods
 *
 * Both paths are unioned for maximum coverage.
 */
export function getExerciseSlugsForObjectif(
  objectifSlug: ObjectifSlug,
  exercices: { slug: string; methodes_compatibles?: string[] }[],
  methodes: { slug: string; exercices_compatibles: string[] }[],
): Set<string> {
  const objectif = OBJECTIFS.find((o) => o.slug === objectifSlug);
  if (!objectif) return new Set();

  const methodeSlugsSet = new Set(objectif.methodesSlugs);
  const result = new Set<string>();

  // Path 1: exercise → methodes_compatibles → objectif methods
  for (const ex of exercices) {
    if (ex.methodes_compatibles?.some((m) => methodeSlugsSet.has(m))) {
      result.add(ex.slug);
    }
  }

  // Path 2: objectif methods → exercices_compatibles
  for (const m of methodes) {
    if (methodeSlugsSet.has(m.slug)) {
      for (const slug of m.exercices_compatibles) {
        result.add(slug);
      }
    }
  }

  return result;
}

/** Map from internal objectif key ("endurance"/"volume"/"puissance") to ObjectifSlug */
export const OBJECTIF_KEY_TO_SLUG: Record<string, ObjectifSlug> = {
  endurance: "endurance-de-force",
  volume: "gain-de-volume",
  puissance: "gain-de-puissance",
};
