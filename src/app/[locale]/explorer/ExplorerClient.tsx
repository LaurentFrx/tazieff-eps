"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ExerciseListClient } from "@/app/[locale]/exercices/ExerciseListClient";
import { CategoryBadge } from "@/components/methodes/CategoryBadge";
import { MethodeCard } from "@/components/methodes/MethodeCard";
import { LocaleLink as Link } from "@/components/LocaleLink";
import type { Lang } from "@/lib/i18n/I18nProvider";
import type { LiveExerciseListItem, LiveExerciseRow } from "@/lib/live/types";
import type { CategorieMethode, MethodeFrontmatter } from "@/lib/content/schema";

/* ── Types ────────────────────────────────────────────────────────── */

type MethodeGroup = {
  categorie: CategorieMethode;
  label: string;
  items: MethodeFrontmatter[];
};

type LearnCard = {
  href: string;
  title: string;
  description: string;
};

type TabId = "exercices" | "methodes" | "theorie";

type Props = {
  exercises: LiveExerciseListItem[];
  liveExercises: LiveExerciseRow[];
  locale: Lang;
  methodesGrouped: MethodeGroup[];
  scoreLabels: { endurance: string; hypertrophie: string; force: string; puissance: string };
  learnCards: LearnCard[];
  initialTab: string;
};

/* ── Tab definitions ──────────────────────────────────────────────── */

const TABS: { id: TabId; labelKey: string; color: string }[] = [
  { id: "exercices", labelKey: "pages.home.exercicesLabel", color: "#f97316" },
  { id: "methodes",  labelKey: "pages.home.methodesLabel",  color: "#4f46e5" },
  { id: "theorie",   labelKey: "pages.home.apprendreLabel",  color: "#16a34a" },
];

/* ── Component ────────────────────────────────────────────────────── */

export function ExplorerClient({
  exercises,
  liveExercises,
  locale,
  methodesGrouped,
  scoreLabels,
  learnCards,
  initialTab,
}: Props) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabId>(
    (["exercices", "methodes", "theorie"].includes(initialTab) ? initialTab : "exercices") as TabId,
  );

  return (
    <div className="flex flex-col gap-0 pb-24">
      {/* ── Sticky tabs bar ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-b border-white/10">
        <div className="flex gap-0">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-3 text-center text-sm font-bold transition-colors min-h-[44px]"
                style={{
                  color: isActive ? tab.color : undefined,
                  borderBottom: isActive ? `3px solid ${tab.color}` : "3px solid transparent",
                }}
              >
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────────────── */}
      <div className="px-4 pt-4">
        {activeTab === "exercices" && (
          <ExerciseListClient
            exercises={exercises}
            liveExercises={liveExercises}
            locale={locale}
          />
        )}

        {activeTab === "methodes" && (
          <div className="stack-lg">
            {methodesGrouped.map(({ categorie, label, items }) =>
              items.length === 0 ? null : (
                <section key={categorie}>
                  <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-[color:var(--ink)]">
                    <CategoryBadge categorie={categorie} label={label} />
                    <span className="text-xs text-[color:var(--muted)]">({items.length})</span>
                  </h2>
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((methode) => (
                      <li key={methode.slug}>
                        <MethodeCard
                          slug={methode.slug}
                          titre={methode.titre}
                          soustitre={methode.soustitre}
                          description={methode.description}
                          categorie={methode.categorie}
                          categoryLabel={t(`methodes.categories.${methode.categorie}`)}
                          scores={methode.scores}
                          scoreLabels={scoreLabels}
                          niveauLabel={`${t("methodes.niveau")} : ${t(`methodes.niveaux.${methode.niveau_minimum}`)}`}
                          timerLabel={methode.timer ? t("methodes.timer.heading") : undefined}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ),
            )}
          </div>
        )}

        {activeTab === "theorie" && (
          <div className="card-grid">
            {learnCards.map((card) => (
              <Link key={card.href} href={card.href} className="card tap-feedback">
                <h2>{card.title}</h2>
                <p>{card.description}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
