"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n/I18nProvider";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NEW_EXERCISE_CONTENT = `## Consignes
- À compléter

## Dosage
- À compléter

## Erreurs fréquentes
- À compléter

## Sécurité
- À compléter
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getUniqueExerciseSlug(existingSlugs: Set<string>) {
  let maxIndex = 0;
  existingSlugs.forEach((slug) => {
    const match = slug.match(/^s1-(\d+)$/);
    if (!match) {
      return;
    }
    const value = Number(match[1]);
    if (Number.isNaN(value)) {
      return;
    }
    maxIndex = Math.max(maxIndex, value);
  });

  const nextIndex = maxIndex + 1;
  const candidate = `s1-${String(nextIndex).padStart(3, "0")}`;
  if (!existingSlugs.has(candidate)) {
    return candidate;
  }

  const fallback = `exo-${Date.now()}`;
  if (!existingSlugs.has(fallback)) {
    return fallback;
  }

  return `exo-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
}

// ---------------------------------------------------------------------------
// TeacherToolbar
// ---------------------------------------------------------------------------

export type TeacherToolbarProps = {
  teacherUnlocked: boolean;
  teacherPin: string;
  existingSlugs: Set<string>;
  locale: Lang;
};

export function TeacherToolbar({
  teacherUnlocked,
  teacherPin,
  existingSlugs,
  locale,
}: TeacherToolbarProps) {
  const router = useRouter();
  const [createStatus, setCreateStatus] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  if (!teacherUnlocked) {
    return null;
  }

  const handleCreateExercise = async () => {
    setCreateStatus(null);
    if (!teacherPin) {
      setCreateStatus("PIN requis.");
      return;
    }

    setIsCreating(true);
    setCreateStatus("Création en cours...");

    const slug = getUniqueExerciseSlug(existingSlugs);

    let response: Response;
    try {
      response = await fetch("/api/teacher/live-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: teacherPin,
          slug,
          locale,
          dataJson: {
            frontmatter: {
              title: "Nouvel exercice",
              slug,
              tags: [],
              themeCompatibility: [1],
              muscles: [],
            },
            content: NEW_EXERCISE_CONTENT,
            status: "draft",
          },
        }),
      });
    } catch {
      setIsCreating(false);
      setCreateStatus("Échec de la création.");
      return;
    }

    if (!response.ok) {
      setIsCreating(false);
      setCreateStatus(response.status === 401 ? "PIN invalide." : "Échec de la création.");
      return;
    }

    setIsCreating(false);
    setCreateStatus(null);
    router.push(`/exercices/${encodeURIComponent(slug)}?edit=1`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {createStatus ? (
        <span className="text-xs text-[color:var(--muted)]">{createStatus}</span>
      ) : null}
      <button
        type="button"
        className="primary-button primary-button--wide"
        onClick={handleCreateExercise}
        disabled={isCreating}
      >
        {isCreating ? "Création..." : "+ Nouvel exercice"}
      </button>
    </div>
  );
}
