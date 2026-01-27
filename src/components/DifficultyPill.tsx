import type { Difficulty } from "@/lib/content/schema";

type DifficultyLevel = Difficulty | number | string;

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
  if (typeof level === "number") {
    if (level <= 1) {
      return "debutant";
    }
    if (level === 2) {
      return "intermediaire";
    }
    return "avance";
  }

  if (level === "debutant" || level === "intermediaire" || level === "avance") {
    return level;
  }

  if (typeof level !== "string") {
    return "intermediaire";
  }

  const normalized = level
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (normalized === "debutant") {
    return "debutant";
  }

  if (normalized === "1") {
    return "debutant";
  }

  if (normalized === "avance") {
    return "avance";
  }

  if (normalized === "3") {
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
