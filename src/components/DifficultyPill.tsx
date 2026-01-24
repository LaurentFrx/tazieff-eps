import type { Difficulty } from "@/lib/content/schema";

type DifficultyLevel = Difficulty | string;

const LABELS: Record<Difficulty, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

const VARIANTS: Record<Difficulty, string> = {
  debutant: "pill--debutant",
  intermediaire: "pill--intermediaire",
  avance: "pill--avance",
};

function normalizeLevel(level: DifficultyLevel): Difficulty {
  if (level === "debutant" || level === "intermediaire" || level === "avance") {
    return level;
  }

  const normalized = level
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (normalized === "debutant") {
    return "debutant";
  }

  if (normalized === "avance") {
    return "avance";
  }

  return "intermediaire";
}

type DifficultyPillProps = {
  level: DifficultyLevel;
};

export default function DifficultyPill({ level }: DifficultyPillProps) {
  const normalized = normalizeLevel(level);

  return (
    <span className={`pill pill--difficulty ${VARIANTS[normalized]}`}>
      {LABELS[normalized]}
    </span>
  );
}
