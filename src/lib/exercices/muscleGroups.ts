export type MuscleGroupId =
  | "abdominaux"
  | "pectoraux"
  | "dos"
  | "epaules"
  | "bras"
  | "fessiers"
  | "cuisses"
  | "mollets";

export const MUSCLE_GROUP_IDS: readonly MuscleGroupId[] = [
  "abdominaux",
  "pectoraux",
  "dos",
  "epaules",
  "bras",
  "fessiers",
  "cuisses",
  "mollets",
];

// Lowercase + accent-stripped variants for each group.
// The matcher normalizes exercise muscle values before lookup.
const MUSCLE_GROUP_MAP: Record<MuscleGroupId, string[]> = {
  abdominaux: [
    "grand droit",
    "grand droit des abdominaux",
    "transverse",
    "obliques",
    "obliques droits",
    "obliques gauches",
    "stabilisateurs",
  ],
  pectoraux: [
    "pectoraux",
    "pectoraux internes",
    "pectoraux superieurs",
    "pectoraux inferieurs",
    "pectoraux claviculaires",
    "denteles",
    "denteles",
  ],
  dos: [
    "grand dorsal",
    "trapezes",
    "rhomboides",
    "erecteurs du rachis",
    "carre des lombes",
    "dorsaux",
    "lombaires",
  ],
  epaules: [
    "deltoides",
    "deltoides anterieurs",
    "deltoides moyens",
    "deltoides posterieurs",
    "coiffe des rotateurs",
  ],
  bras: [
    "biceps",
    "biceps brachial",
    "brachial",
    "brachio-radial",
    "triceps",
    "triceps brachial",
    "avant-bras",
  ],
  fessiers: [
    "grand fessier",
    "moyen fessier",
    "piriforme",
    "pyramidal",
  ],
  cuisses: [
    "quadriceps",
    "ischio-jambiers",
    "ischio jambiers",
    "adducteurs",
    "abducteurs",
    "psoas",
    "psoas-iliaque",
    "tfl",
  ],
  mollets: [
    "mollets",
    "gastrocnemiens",
    "soleaires",
  ],
};

// Precompute reverse lookup: normalized muscle string → group id
const reverseLookup = new Map<string, MuscleGroupId>();
for (const [groupId, muscles] of Object.entries(MUSCLE_GROUP_MAP) as [MuscleGroupId, string[]][]) {
  for (const muscle of muscles) {
    reverseLookup.set(muscle, groupId);
  }
}

import { normalizeForSearch as normalize } from "@/lib/text/normalize";

/** Return all muscle group IDs that match at least one muscle from the exercise. */
export function getMuscleGroups(muscles: string[]): MuscleGroupId[] {
  const groups = new Set<MuscleGroupId>();
  for (const muscle of muscles) {
    const key = normalize(muscle);
    const group = reverseLookup.get(key);
    if (group) groups.add(group);
  }
  return MUSCLE_GROUP_IDS.filter((id) => groups.has(id));
}

/** Check if an exercise's muscles match any of the selected groups. */
export function matchesMuscleGroups(
  exerciseMuscles: string[],
  selectedGroups: MuscleGroupId[],
): boolean {
  if (selectedGroups.length === 0) return true;
  const exerciseGroups = getMuscleGroups(exerciseMuscles);
  return selectedGroups.some((group) => exerciseGroups.includes(group));
}
