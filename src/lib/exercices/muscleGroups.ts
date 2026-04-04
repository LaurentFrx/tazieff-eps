import { normalizeForSearch as normalize } from "@/lib/text/normalize";

export type MuscleGroupId =
  | "dos"
  | "membres-inferieurs"
  | "membres-superieurs"
  | "abdominaux"
  | "pectoraux";

export const MUSCLE_GROUP_IDS: readonly MuscleGroupId[] = [
  "dos",
  "membres-inferieurs",
  "membres-superieurs",
  "abdominaux",
  "pectoraux",
];

// Lowercase + accent-stripped variants for each group.
// The matcher normalizes exercise muscle values before lookup.
const MUSCLE_GROUP_MAP: Record<MuscleGroupId, string[]> = {
  dos: [
    "grand dorsal",
    "dorsaux",
    "trapeze",
    "trapezes",
    "rhomboide",
    "rhomboides",
    "infra-epineux",
    "petit rond",
    "grand rond",
    "carre des lombes",
    "lombaires",
    "spinaux",
    "erector spinae",
    "dos",
    "latissimus",
    "back muscles",
    "erecteurs du rachis",
    "latissimus dorsi",
    "teres major",
    "trapezius",
    "rhomboids",
    "dorsal ancho",
    "redondo mayor",
    "trapecios",
    "romboides",
  ],
  "membres-inferieurs": [
    "quadriceps",
    "ischio-jambiers",
    "ischio jambiers",
    "ischios",
    "mollets",
    "triceps sural",
    "jumeaux",
    "soleaire",
    "soleaires",
    "gastrocnemiens",
    "adducteurs",
    "abducteurs",
    "fessiers",
    "grand fessier",
    "moyen fessier",
    "psoas",
    "psoas-iliaque",
    "jambier",
    "jambier anterieur",
    "long peronier",
    "cuisses",
    "jambes",
    "gluteus",
    "hamstrings",
    "calves",
    "tfl",
    "piriforme",
    "pyramidal",
  ],
  "membres-superieurs": [
    "deltoides",
    "deltoides anterieurs",
    "deltoides moyens",
    "deltoides posterieurs",
    "biceps",
    "triceps",
    "avant-bras",
    "brachio-radial",
    "brachial",
    "coiffe des rotateurs",
    "epaules",
    "bras",
    "biceps brachial",
    "triceps brachial",
    "shoulders",
    "arms",
    "anterior deltoids",
    "deltoids",
    "deltoides anteriores",
  ],
  abdominaux: [
    "grand droit",
    "grand droit des abdominaux",
    "abdominaux",
    "obliques",
    "transverse",
    "abdos",
    "core",
    "gainage",
    "obliques droits",
    "obliques gauches",
    "rectus abdominis",
    "stabilisateurs",
    "abdominales",
  ],
  pectoraux: [
    "pectoraux",
    "grand pectoral",
    "petit pectoral",
    "dentele",
    "denteles",
    "pecs",
    "chest",
    "pectoraux internes",
    "pectoraux superieurs",
    "pectoraux inferieurs",
    "pectoraux claviculaires",
    "pectorales",
  ],
};

// Precompute reverse lookup: normalized muscle string → group id
const reverseLookup = new Map<string, MuscleGroupId>();
for (const [groupId, muscles] of Object.entries(MUSCLE_GROUP_MAP) as [MuscleGroupId, string[]][]) {
  for (const muscle of muscles) {
    reverseLookup.set(normalize(muscle), groupId);
  }
}

/** Return the muscle group ID for a single muscle name, or null if unknown. */
export function getMuscleGroup(muscleName: string): MuscleGroupId | null {
  const key = normalize(muscleName);
  const group = reverseLookup.get(key) ?? null;
  return group;
}

/** Return all unique muscle group IDs that match at least one muscle from the exercise. */
export function getMuscleGroups(muscles: string[]): MuscleGroupId[] {
  const groups = new Set<MuscleGroupId>();
  for (const muscle of muscles) {
    const group = getMuscleGroup(muscle);
    if (group) groups.add(group);
  }
  return MUSCLE_GROUP_IDS.filter((id) => groups.has(id));
}

/** Alias for getMuscleGroups — named for clarity when mapping an exercise's muscle list. */
export const getMuscleGroupsForExercise = getMuscleGroups;

/** Check if an exercise's muscles match any of the selected groups. */
export function matchesMuscleGroups(
  exerciseMuscles: string[],
  selectedGroups: MuscleGroupId[],
): boolean {
  if (selectedGroups.length === 0) return true;
  const exerciseGroups = getMuscleGroups(exerciseMuscles);
  return selectedGroups.some((group) => exerciseGroups.includes(group));
}
