"use client";

import type { Difficulty } from "@/lib/content/schema";
import { useI18n } from "@/lib/i18n/I18nProvider";

type DifficultyLevel = Difficulty | string;

const LABEL_KEYS: Record<Difficulty, string> = {
  debutant: "difficulty.debutant",
  intermediaire: "difficulty.intermediaire",
  avance: "difficulty.avance",
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
  const { t } = useI18n();
  const normalized = normalizeLevel(level);

  return (
    <span className={`pill pill--difficulty ${VARIANTS[normalized]}`}>
      {t(LABEL_KEYS[normalized])}
    </span>
  );
}
