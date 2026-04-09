import { getMuscleGroups } from "@/lib/exercices/muscleGroups";

const GROUP_COLORS: Record<string, string> = {
  dos: "#3b82f6",
  "membres-inferieurs": "#22c55e",
  "membres-superieurs": "#f97316",
  abdominaux: "#a855f7",
  pectoraux: "#ef4444",
};

export { GROUP_COLORS };

export type MuscleGroupWithColor = {
  id: string;
  color: string;
};

/** Map exercise muscle tags to the 5 filter group keys. */
export function getExerciseMuscleGroups(muscles: string[]): string[] {
  return getMuscleGroups(muscles);
}

/** Map exercise muscle tags to the 5 groups with their display colors. */
export function getExerciseMuscleGroupsWithColors(muscles: string[]): MuscleGroupWithColor[] {
  return getMuscleGroups(muscles).map((id) => ({
    id,
    color: GROUP_COLORS[id] ?? "#888",
  }));
}
