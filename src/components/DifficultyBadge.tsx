import type { Difficulty } from "@/lib/content/fs";

const LABELS: Record<Difficulty, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

const VARIANTS: Record<Difficulty, string> = {
  debutant:
    "bg-green-600/15 text-green-700 ring-1 ring-inset ring-green-600/25 dark:bg-green-400/10 dark:text-green-300 dark:ring-green-400/20",
  intermediaire:
    "bg-blue-600/15 text-blue-700 ring-1 ring-inset ring-blue-600/25 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20",
  avance:
    "bg-red-600/15 text-red-700 ring-1 ring-inset ring-red-600/25 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20",
};

type DifficultyBadgeProps = {
  difficulty: Difficulty;
};

export default function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANTS[difficulty]}`}
    >
      {LABELS[difficulty]}
    </span>
  );
}
