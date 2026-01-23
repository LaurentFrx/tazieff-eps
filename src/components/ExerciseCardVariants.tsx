import Image from "next/image";
import DifficultyPill from "@/components/DifficultyPill";
import type { ExerciceFrontmatter } from "@/lib/content/fs";

export type ExerciseCardProps = {
  exercise: ExerciceFrontmatter;
};

type ThumbnailSize = "sm" | "md" | "lg";

const THUMB_SIZES: Record<ThumbnailSize, string> = {
  sm: "h-12 w-12",
  md: "h-14 w-14",
  lg: "h-16 w-16",
};

const THUMB_PIXELS: Record<ThumbnailSize, number> = {
  sm: 48,
  md: 56,
  lg: 64,
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

type ExerciseThumbnailProps = {
  src?: string;
  alt: string;
  size: ThumbnailSize;
  overlay?: React.ReactNode;
};

function ExerciseThumbnail({ src, alt, size, overlay }: ExerciseThumbnailProps) {
  const sizeClass = THUMB_SIZES[size];
  const pixelSize = THUMB_PIXELS[size];

  return (
    <div
      className={`relative ${sizeClass} shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10`}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={`${pixelSize}px`}
          className="object-cover"
        />
      ) : (
        <div className="h-full w-full bg-[color:var(--bg-2)]" />
      )}
      {overlay ? (
        <div className="absolute left-2 top-2 drop-shadow-sm">{overlay}</div>
      ) : null}
    </div>
  );
}

export function ExerciseCardVariantA({ exercise }: ExerciseCardProps) {
  const difficulty = exercise.difficulty ?? "intermediaire";
  const muscles = formatMuscles(exercise.muscles);

  return (
    <div className="flex items-start gap-4">
      <ExerciseThumbnail
        src={exercise.image}
        alt={exercise.title}
        size="lg"
      />
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold truncate">{exercise.title}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[color:var(--muted)]">
          <DifficultyPill level={difficulty} />
          <span>{formatEquipment(exercise.equipment)}</span>
        </div>
        {muscles ? (
          <p className="mt-2 text-xs text-[color:var(--muted)] opacity-70">
            {muscles}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ExerciseCardVariantB({ exercise }: ExerciseCardProps) {
  const difficulty = exercise.difficulty ?? "intermediaire";
  const muscles = formatMuscles(exercise.muscles);

  return (
    <div className="flex items-start gap-4">
      <ExerciseThumbnail
        src={exercise.image}
        alt={exercise.title}
        size="lg"
        overlay={<DifficultyPill level={difficulty} />}
      />
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold truncate">{exercise.title}</h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          {formatEquipment(exercise.equipment)}
        </p>
        {muscles ? (
          <p className="mt-2 text-xs text-[color:var(--muted)] opacity-70">
            {muscles}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ExerciseCardVariantC({ exercise }: ExerciseCardProps) {
  const difficulty = exercise.difficulty ?? "intermediaire";
  const muscles = formatMuscles(exercise.muscles);

  return (
    <div className="flex items-center gap-3">
      <ExerciseThumbnail
        src={exercise.image}
        alt={exercise.title}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-lg font-semibold truncate">{exercise.title}</h2>
          <div className="shrink-0">
            <DifficultyPill level={difficulty} />
          </div>
        </div>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          {formatEquipment(exercise.equipment)}
        </p>
        {muscles ? (
          <p className="mt-2 text-xs text-[color:var(--muted)] opacity-70">
            {muscles}
          </p>
        ) : null}
      </div>
    </div>
  );
}
