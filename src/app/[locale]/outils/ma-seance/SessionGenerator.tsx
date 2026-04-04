"use client";

import { LocaleLink as Link } from "@/components/LocaleLink";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { CategoryBadge } from "@/components/methodes/CategoryBadge";
import { ScoresBlock } from "@/components/methodes/ScoreBar";
import { ParametresTable } from "@/components/methodes/ParametresTable";
import { checkBalance, type Zone } from "@/lib/exercices/zoneMap";
import type { CategorieMethode, MethodeFrontmatter } from "@/lib/content/schema";
import type { LiveExerciseListItem } from "@/lib/live/types";
import { ExoThumb } from "@/components/ExoThumb";

/* ── Types ───────────────────────────────── */

type Step = 1 | 2 | 3 | "result";

const OBJECTIF_ACCENT: Record<string, string> = {
  "endurance-de-force": "#34d399",
  "gain-de-volume": "#60a5fa",
  "gain-de-puissance": "#fb923c",
};

type SavedSession = {
  objectif: CategorieMethode;
  selectedMethodes: string[];
  selectedExercices: string[];
};

const STORAGE_KEY = "eps_session";

const MIN_METHODES = 1;
const MAX_EXERCICES = 6;

/* ── Props ───────────────────────────────── */

type SessionGeneratorProps = {
  allMethodes: MethodeFrontmatter[];
  allExercices: LiveExerciseListItem[];
  categoryLabels: Record<string, string>;
  scoreLabels: {
    endurance: string;
    hypertrophie: string;
    force: string;
    puissance: string;
  };
  parametresLabels: {
    series: string;
    repetitions: string;
    intensite: string;
    recuperation: string;
    duree: string;
  };
};

/* ── Component ───────────────────────────── */

export function SessionGenerator({
  allMethodes,
  allExercices,
  categoryLabels,
  scoreLabels,
  parametresLabels,
}: SessionGeneratorProps) {
  const { t } = useI18n();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>(1);
  const [objectif, setObjectif] = useState<CategorieMethode | null>(null);
  const [selectedMethodes, setSelectedMethodes] = useState<string[]>([]);
  const [selectedExercices, setSelectedExercices] = useState<string[]>([]);

  /* ── localStorage restore or query param pre-select ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: SavedSession = JSON.parse(raw);
        if (saved.objectif && saved.selectedMethodes?.length && saved.selectedExercices?.length === MAX_EXERCICES) {
          setObjectif(saved.objectif);
          setSelectedMethodes(saved.selectedMethodes);
          setSelectedExercices(saved.selectedExercices);
          setStep("result");
          return;
        }
      }
    } catch { /* ignore */ }

    // Pre-select objectif from query param (e.g. ?objectif=endurance-de-force)
    const qObjectif = searchParams.get("objectif");
    const validObjectifs: CategorieMethode[] = ["endurance-de-force", "gain-de-volume", "gain-de-puissance"];
    if (qObjectif && validObjectifs.includes(qObjectif as CategorieMethode)) {
      setObjectif(qObjectif as CategorieMethode);
      setStep(2);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── localStorage save ── */
  function saveSession() {
    if (!objectif) return;
    try {
      const data: SavedSession = { objectif, selectedMethodes, selectedExercices };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
  }

  /* ── Filtered data ── */
  const filteredMethodes = useMemo(() => {
    if (!objectif) return [];
    return allMethodes.filter((m) => m.categorie === objectif);
  }, [allMethodes, objectif]);

  const { recommended, others } = useMemo(() => {
    const compatSlugs = new Set(
      selectedMethodes.flatMap((slug) => {
        const m = allMethodes.find((me) => me.slug === slug);
        return m?.exercices_compatibles ?? [];
      }),
    );
    const rec: LiveExerciseListItem[] = [];
    const oth: LiveExerciseListItem[] = [];
    for (const ex of allExercices) {
      if (compatSlugs.has(ex.slug)) rec.push(ex);
      else oth.push(ex);
    }
    // If no compatible exercises found, show all as recommended
    if (rec.length === 0) return { recommended: allExercices, others: [] };
    return { recommended: rec, others: oth };
  }, [allExercices, allMethodes, selectedMethodes]);

  const balanceWarnings = useMemo(() => {
    const muscleArrays = selectedExercices.map((slug) => {
      const ex = allExercices.find((e) => e.slug === slug);
      return ex?.muscles ?? [];
    });
    return checkBalance(muscleArrays);
  }, [allExercices, selectedExercices]);

  /* ── Helpers ── */
  const minMethodes = MIN_METHODES;

  function toggleMethode(slug: string) {
    setSelectedMethodes((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
    setSelectedExercices([]);
  }

  function toggleExercice(slug: string) {
    setSelectedExercices((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX_EXERCICES) return prev;
      return [...prev, slug];
    });
  }

  const zoneLabels: Record<Zone, string> = {
    haut: t("maSeance.zoneHaut"),
    milieu: t("maSeance.zoneMilieu"),
    bas: t("maSeance.zoneBas"),
  };

  /* ── Stepper indicator ── */
  const stepLabels = [
    { num: 1, label: t("maSeance.stepObjectif") },
    { num: 2, label: t("maSeance.stepMethodes") },
    { num: 3, label: t("maSeance.stepExercices") },
  ];

  const currentStepNum = step === "result" ? 4 : step;

  /* ── Render ── */
  return (
    <section className="page">
      <header className="page-header no-print">
        <Link href="/outils" className="eyebrow hover:text-[color:var(--accent)]">
          ← {t("outils.backLabel")}
        </Link>
        <h1>{t("maSeance.title")}</h1>
      </header>

      {/* Stepper */}
      {step !== "result" && (
        <div className="no-print flex items-center gap-2">
          {stepLabels.map(({ num, label }) => (
            <div key={num} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full items-center gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    num < currentStepNum
                      ? "bg-[color:var(--accent)] text-white"
                      : num === currentStepNum
                      ? "border-2 border-[color:var(--accent)] text-[color:var(--accent)]"
                      : "border border-[color:var(--border)] text-[color:var(--muted)]"
                  }`}
                >
                  {num < currentStepNum ? "✓" : num}
                </span>
                <div
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    num <= currentStepNum
                      ? "bg-[color:var(--accent)]"
                      : "bg-[color:var(--border)]"
                  }`}
                />
              </div>
              <span
                className={`text-[10px] font-semibold ${
                  num === currentStepNum
                    ? "text-[color:var(--accent)]"
                    : "text-[color:var(--muted)]"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── STEP 1: Objectif ── */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          {/* Objectif cards */}
          {([
            { cat: "endurance-de-force" as const, titleKey: "maSeance.objectifEndurance", descKey: "maSeance.objectifEnduranceDesc" },
            { cat: "gain-de-volume" as const, titleKey: "maSeance.objectifVolume", descKey: "maSeance.objectifVolumeDesc" },
            { cat: "gain-de-puissance" as const, titleKey: "maSeance.objectifPuissance", descKey: "maSeance.objectifPuissanceDesc" },
          ]).map(({ cat, titleKey, descKey }) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setObjectif(cat);
                setSelectedMethodes([]);
                setSelectedExercices([]);
                setStep(2);
              }}
              className="tool-card flex flex-col gap-2 text-left"
              style={{ "--tool-accent": OBJECTIF_ACCENT[cat] ?? "var(--accent)" } as React.CSSProperties}
            >
              <CategoryBadge categorie={cat} label={categoryLabels[cat] ?? cat} />
              <h2 className="text-lg font-bold text-[color:var(--ink)]">
                {t(titleKey)}
              </h2>
              <p className="text-sm text-[color:var(--muted)]">{t(descKey)}</p>
            </button>
          ))}

          {/* Programmes hint */}
          <Link
            href="/programmes"
            className="text-center text-xs font-semibold text-[color:var(--accent)] transition-opacity hover:opacity-75"
          >
            {t("maSeance.programmesHint")}
          </Link>
        </div>
      )}

      {/* ── STEP 2: Méthodes ── */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[color:var(--muted)]">
            {t("maSeance.methodesMin")} {minMethodes}
          </p>

          {filteredMethodes.map((m) => {
            const isSelected = selectedMethodes.includes(m.slug);
            return (
              <button
                key={m.slug}
                type="button"
                onClick={() => toggleMethode(m.slug)}
                className={`card flex flex-col gap-3 text-left transition-colors ${
                  isSelected
                    ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]"
                    : ""
                }`}
              >
                <div>
                  <h3 className="text-base font-bold text-[color:var(--ink)]">
                    {m.titre}
                  </h3>
                  {m.description ? (
                    <p className="mt-1 text-xs text-[color:var(--muted)]">
                      {m.description}
                    </p>
                  ) : null}
                </div>
                <ScoresBlock scores={m.scores} labels={scoreLabels} />
              </button>
            );
          })}

          {filteredMethodes.length === 0 && (
            <p className="text-center text-sm text-[color:var(--muted)]">
              —
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 rounded-2xl border border-[color:var(--border)] py-3.5 text-sm font-semibold text-[color:var(--muted)] transition-all hover:text-[color:var(--ink)] hover:border-[color:var(--ink)] active:scale-[0.97]"
            >
              {t("maSeance.previous")}
            </button>
            <button
              type="button"
              disabled={selectedMethodes.length < minMethodes}
              onClick={() => setStep(3)}
              className="flex-1 rounded-2xl bg-[color:var(--accent)] py-3.5 text-sm font-black text-white shadow-lg transition-all disabled:opacity-30 active:scale-[0.97]"
            >
              {t("maSeance.next")}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Exercices ── */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-[color:var(--accent)]">
            {selectedExercices.length} / {MAX_EXERCICES} {t("maSeance.exercicesCount")}
          </p>

          {/* Balance warnings */}
          {balanceWarnings.map(({ zone, count }) => (
            <p
              key={zone}
              className="rounded-lg border border-orange-400/40 bg-orange-400/10 px-3 py-2 text-xs font-semibold text-orange-500"
            >
              {t("maSeance.balanceWarning")} {zoneLabels[zone]} ({count})
            </p>
          ))}

          {/* Recommended */}
          {recommended.length > 0 && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--muted)]">
                {t("maSeance.recommended")}
              </h2>
              <div className="flex flex-col gap-2">
                {recommended.map((ex) => (
                  <ExerciceToggle
                    key={ex.slug}
                    exercice={ex}
                    selected={selectedExercices.includes(ex.slug)}
                    disabled={!selectedExercices.includes(ex.slug) && selectedExercices.length >= MAX_EXERCICES}
                    onToggle={() => toggleExercice(ex.slug)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Others */}
          {others.length > 0 && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--muted)]">
                {t("maSeance.allExercises")}
              </h2>
              <div className="flex flex-col gap-2">
                {others.map((ex) => (
                  <ExerciceToggle
                    key={ex.slug}
                    exercice={ex}
                    selected={selectedExercices.includes(ex.slug)}
                    disabled={!selectedExercices.includes(ex.slug) && selectedExercices.length >= MAX_EXERCICES}
                    onToggle={() => toggleExercice(ex.slug)}
                  />
                ))}
              </div>
            </>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 rounded-2xl border border-[color:var(--border)] py-3.5 text-sm font-semibold text-[color:var(--muted)] transition-all hover:text-[color:var(--ink)] hover:border-[color:var(--ink)] active:scale-[0.97]"
            >
              {t("maSeance.previous")}
            </button>
            <button
              type="button"
              disabled={selectedExercices.length !== MAX_EXERCICES}
              onClick={() => {
                saveSession();
                setStep("result");
              }}
              className="flex-1 rounded-2xl bg-[color:var(--accent)] py-3.5 text-sm font-black text-white shadow-lg transition-all disabled:opacity-30 active:scale-[0.97]"
            >
              {t("maSeance.generate")}
            </button>
          </div>
        </div>
      )}

      {/* ── RESULT ── */}
      {step === "result" && objectif && (
        <div className="flex flex-col gap-4">
          {/* Print-only header */}
          <div className="print-only print-header">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/branding/logo-eps.webp" alt="Tazieff EPS" className="print-logo" />
            <h1>{t("maSeance.result.heading")}</h1>
            <p>
              {t("maSeance.result.objectifLabel")} : {categoryLabels[objectif] ?? objectif}
              {" — "}
              {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Header */}
          <div className="card flex flex-col gap-2">
            <h2 className="text-lg font-bold text-[color:var(--ink)]">
              {t("maSeance.result.heading")}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge
                categorie={objectif}
                label={categoryLabels[objectif] ?? objectif}
              />
            </div>
          </div>

          {/* Méthodes */}
          <div className="card flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--muted)]">
              {t("maSeance.result.methodesHeading")}
            </h2>
            {selectedMethodes.map((slug) => {
              const m = allMethodes.find((me) => me.slug === slug);
              if (!m) return null;
              return (
                <div key={slug} className="flex flex-col gap-2 border-b border-[color:var(--border)] pb-3 last:border-0 last:pb-0">
                  <h3 className="text-base font-bold text-[color:var(--ink)]">
                    {m.titre}
                  </h3>
                  <ParametresTable parametres={m.parametres} labels={parametresLabels} />
                </div>
              );
            })}
          </div>

          {/* Exercices */}
          <div className="card flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--muted)]">
              {t("maSeance.result.exercicesHeading")}
            </h2>
            <div className="flex flex-col divide-y divide-[color:var(--border)]">
              {selectedExercices.map((slug, i) => {
                const ex = allExercices.find((e) => e.slug === slug);
                if (!ex) return null;
                return (
                  <div key={slug} className="flex items-center gap-3 py-2.5">
                    <ExoThumb slug={slug} size={36} />
                    <div className="min-w-0 flex-1">
                      <span className="mr-2 text-xs font-bold text-[color:var(--accent)]">
                        {i + 1}.
                      </span>
                      <span className="text-sm font-semibold text-[color:var(--ink)]">
                        {ex.title}
                      </span>
                      <p className="mt-0.5 text-xs text-[color:var(--muted)]">
                        {t("maSeance.result.musclesLabel")} : {ex.muscles.join(", ")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timer link */}
          {selectedMethodes.some((slug) => {
            const m = allMethodes.find((me) => me.slug === slug);
            return m?.timer;
          }) && (
            <Link
              href="/outils/timer"
              className="no-print card flex items-center justify-center py-3 text-sm font-semibold text-[color:var(--accent)] transition-colors hover:border-[color:var(--accent)]"
            >
              {t("maSeance.result.timerLink")}
            </Link>
          )}

          {/* Actions */}
          <div className="no-print flex gap-3">
            <button
              type="button"
              onClick={() => {
                try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
                setStep(1);
              }}
              className="flex-1 rounded-2xl border border-[color:var(--border)] py-3.5 text-sm font-semibold text-[color:var(--muted)] transition-all hover:text-[color:var(--ink)] hover:border-[color:var(--ink)] active:scale-[0.97]"
            >
              {t("maSeance.result.modify")}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 rounded-2xl bg-[color:var(--accent)] py-3.5 text-sm font-black text-white shadow-lg transition-all active:scale-[0.97]"
            >
              {t("maSeance.result.print")}
            </button>
          </div>

          {/* Print-only footer */}
          <div className="print-only print-footer">
            Lycée Haroun Tazieff — guide-musculation.vercel.app
          </div>
        </div>
      )}
    </section>
  );
}

/* ── ExerciceToggle sub-component ── */

function ExerciceToggle({
  exercice,
  selected,
  disabled,
  onToggle,
}: {
  exercice: LiveExerciseListItem;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={`card flex items-center gap-3 p-3 text-left transition-all disabled:opacity-40 ${
        selected
          ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] shadow-[0_0_20px_rgba(240,90,43,0.12)]"
          : "hover:border-[color:var(--accent)]"
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
          selected
            ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
            : "border-[color:var(--border)] text-[color:var(--muted)]"
        }`}
      >
        {selected ? "✓" : ""}
      </span>
      <ExoThumb slug={exercice.slug} size={36} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[color:var(--ink)]">
          {exercice.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-[color:var(--muted)]">
          {exercice.muscles.join(", ")}
        </p>
      </div>
    </button>
  );
}
