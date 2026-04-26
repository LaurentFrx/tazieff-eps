"use client";

// Sprint E1 — Vue informative de la classe rejointe.
// Pas d'action en v1 (pas de "quitter la classe", pas de liste élèves).

import { useI18n } from "@/lib/i18n/I18nProvider";
import type { ClassSummary } from "@/hooks/useMyClasses";

type Props = {
  classSummary: ClassSummary;
};

export function ClassDetail({ classSummary }: Props) {
  const { t } = useI18n();
  const teacherDisplay =
    classSummary.teacher_name?.trim() || t("maClasse.detail.teacherUnknown");

  return (
    <article
      className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6"
      style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
      aria-label={classSummary.name}
    >
      <h2
        className="text-xl font-bold text-[color:var(--ink)] mb-4"
        style={{ fontFamily: "var(--font-bebas), sans-serif", letterSpacing: "0.02em" }}
      >
        {classSummary.name}
      </h2>

      <dl className="space-y-3 text-sm">
        {classSummary.school_year ? (
          <div>
            <dt className="text-xs uppercase tracking-wider text-[color:var(--muted)] mb-0.5">
              {t("maClasse.detail.schoolYear")}
            </dt>
            <dd className="text-[color:var(--ink)]">{classSummary.school_year}</dd>
          </div>
        ) : null}

        <div>
          <dt className="text-xs uppercase tracking-wider text-[color:var(--muted)] mb-0.5">
            {t("maClasse.detail.teacher")}
          </dt>
          <dd className="text-[color:var(--ink)]">{teacherDisplay}</dd>
        </div>

        {classSummary.org_name ? (
          <div>
            <dt className="text-xs uppercase tracking-wider text-[color:var(--muted)] mb-0.5">
              {t("maClasse.detail.organization")}
            </dt>
            <dd className="text-[color:var(--ink)]">{classSummary.org_name}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}
