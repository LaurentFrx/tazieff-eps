"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n/I18nProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";

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
  /** P0.1 — true ssi l'utilisateur courant est super_admin / admin. */
  isAdmin: boolean;
  existingSlugs: Set<string>;
  locale: Lang;
};

export function TeacherToolbar({
  isAdmin,
  existingSlugs,
  locale,
}: TeacherToolbarProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [createStatus, setCreateStatus] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  if (!isAdmin) {
    return null;
  }

  const handleCreateExercise = async () => {
    setCreateStatus(null);

    setIsCreating(true);
    setCreateStatus(t("exerciseEditor.creating"));

    const slug = getUniqueExerciseSlug(existingSlugs);

    let response: Response;
    try {
      response = await fetch("/api/teacher/live-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          locale,
          dataJson: {
            frontmatter: {
              title: t("exerciseEditor.untitled"),
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
      setCreateStatus(t("exerciseEditor.createFailed"));
      return;
    }

    if (!response.ok) {
      setIsCreating(false);
      setCreateStatus(
        response.status === 401 || response.status === 403
          ? t("exerciseEditor.adminRequired")
          : t("exerciseEditor.createFailed"),
      );
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
        {isCreating ? t("exerciseEditor.creating") : t("exerciseEditor.newExercise")}
      </button>
    </div>
  );
}
