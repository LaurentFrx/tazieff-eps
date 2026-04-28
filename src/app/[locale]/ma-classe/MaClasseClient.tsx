"use client";

// Sprint E1 — Orchestrateur client de la page /ma-classe.
//
// Comportement :
//   1. Au mount, lit useMyClasses().
//   2. isLoading → skeleton.
//   3. classes vide → JoinClassForm.
//   4. Au moins une classe → ClassDetail (la première — décision Laurent
//      du 26 avril : un élève = une seule classe en v1).
//
// Référence : GOUVERNANCE_EDITORIALE.md §2.4, §3.3.

import { useMyClasses } from "@/hooks/useMyClasses";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { JoinClassForm } from "./JoinClassForm";
import { ClassDetail } from "./ClassDetail";

export function MaClasseClient() {
  const { t } = useI18n();
  const { classes, isLoading, refetch } = useMyClasses();

  return (
    <section
      className="page mx-auto max-w-lg pb-12"
      aria-labelledby="ma-classe-title"
    >
      <h1
        id="ma-classe-title"
        className="text-2xl font-bold text-[color:var(--ink)] mb-6"
        style={{ fontFamily: "var(--font-bebas), sans-serif", letterSpacing: "0.02em" }}
      >
        {t("maClasse.title")}
      </h1>

      {isLoading ? (
        <div
          className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="h-4 w-1/3 rounded bg-white/10 mb-3 animate-pulse" />
          <div className="h-3 w-2/3 rounded bg-white/10 mb-2 animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-white/10 animate-pulse" />
          <span className="sr-only">{t("maClasse.detail.loading")}</span>
        </div>
      ) : classes.length === 0 ? (
        <JoinClassForm onJoined={refetch} />
      ) : (
        <ClassDetail classSummary={classes[0]} />
      )}
    </section>
  );
}
