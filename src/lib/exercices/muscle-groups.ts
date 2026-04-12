import { getMuscleGroups } from "@/lib/exercices/muscleGroups";

/** Map exercise muscle tags to the 8 filter group keys. */
export function getExerciseMuscleGroups(muscles: string[]): string[] {
  return getMuscleGroups(muscles);
}
