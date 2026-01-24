import Image from "next/image";
import DifficultyPill from "@/components/DifficultyPill";
import type { ExerciseFrontmatter } from "@/lib/content/schema";

export type ExerciseCardProps = {
  exercise: ExerciseFrontmatter;
};

function formatMuscles(muscles?: string[]) {
  if (!muscles || muscles.length === 0) {
    return null;
  }

  const cleaned = muscles.map((muscle) => muscle.trim()).filter(Boolean);
  if (cleaned.length === 0) {
    return null;
  }

  const visible = cleaned.slice(0, 3);
  const extra = cleaned.length - visible.length;
  return extra > 0
    ? `${visible.join(" • ")} • +${extra}`
    : visible.join(" • ");
}

function formatEquipment(equipment?: string[]) {
  return equipment && equipment.length > 0
    ? `Matériel: ${equipment.join(", ")}`
    : "Sans matériel spécifique.";
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const difficulty = exercise.level ?? "intermediaire";
  const muscles = formatMuscles(exercise.muscles);

  return (
    <div className="flex items-start gap-4">
      <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10">
        {exercise.media ? (
          <Image
            src={exercise.media}
            alt={exercise.title}
            fill
            sizes="72px"
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[color:var(--bg-2)]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold truncate">{exercise.title}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[color:var(--muted)]">
          <DifficultyPill level={difficulty} />
          <span>{formatEquipment(exercise.equipment)}</span>
        </div>
        {muscles ? (
          <p className="mt-1 text-xs text-[color:var(--muted)] opacity-70">
            {muscles}
          </p>
        ) : null}
      </div>
    </div>
  );
}
