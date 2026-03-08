import {
  MUSCLE_GROUPS,
  POSTERIOR_GROUPS,
  matchesGroup,
} from "@/app/apprendre/anatomie/anatomy-data";

/** Map exercise muscle tags (e.g. "Pectoraux", "Grand droit des abdominaux")
 *  to anatomy group keys (e.g. "pectoraux", "abdominaux"). */
export function getExerciseMuscleGroups(muscles: string[]): string[] {
  const groups = new Set<string>();
  for (const muscle of muscles) {
    for (const [key, group] of Object.entries(MUSCLE_GROUPS)) {
      if (matchesGroup(group, muscle)) {
        groups.add(key);
      }
    }
  }
  return Array.from(groups);
}

/** Returns true if the exercise muscles are predominantly on the posterior chain. */
export function isPosteriorDominant(groupKeys: string[]): boolean {
  if (groupKeys.length === 0) return false;
  const posteriorCount = groupKeys.filter((k) => POSTERIOR_GROUPS.has(k)).length;
  return posteriorCount > groupKeys.length / 2;
}
