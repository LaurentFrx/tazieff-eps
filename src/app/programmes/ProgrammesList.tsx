"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { CategorieMethode } from "@/lib/content/schema";

/* ── Programme data ── */

type Programme = {
  id: string;
  titleKey: string;
  objectifKey: string;
  frequencyKey: string;
  methodKey: string;
  paramsKey: string;
  exampleKey: string;
  objectifCategorie: CategorieMethode;
  methodSlugs: { slug: string; labelKey: string }[];
};

const PROGRAMMES: Programme[] = [
  {
    id: "p1",
    titleKey: "programmes.p1.title",
    objectifKey: "programmes.p1.objectif",
    frequencyKey: "programmes.p1.frequency",
    methodKey: "programmes.p1.method",
    paramsKey: "programmes.p1.params",
    exampleKey: "programmes.p1.example",
    objectifCategorie: "endurance-de-force",
    methodSlugs: [
      { slug: "charge-constante", labelKey: "programmes.methodNames.chargeConstante" },
      { slug: "pyramide", labelKey: "programmes.methodNames.pyramide" },
    ],
  },
  {
    id: "p2",
    titleKey: "programmes.p2.title",
    objectifKey: "programmes.p2.objectif",
    frequencyKey: "programmes.p2.frequency",
    methodKey: "programmes.p2.method",
    paramsKey: "programmes.p2.params",
    exampleKey: "programmes.p2.example",
    objectifCategorie: "endurance-de-force",
    methodSlugs: [
      { slug: "circuit-training", labelKey: "programmes.methodNames.circuitTraining" },
      { slug: "amrap", labelKey: "programmes.methodNames.amrap" },
    ],
  },
  {
    id: "p3",
    titleKey: "programmes.p3.title",
    objectifKey: "programmes.p3.objectif",
    frequencyKey: "programmes.p3.frequency",
    methodKey: "programmes.p3.method",
    paramsKey: "programmes.p3.params",
    exampleKey: "programmes.p3.example",
    objectifCategorie: "gain-de-puissance",
    methodSlugs: [
      { slug: "triple-tri-set", labelKey: "programmes.methodNames.triplTriSet" },
      { slug: "circuit-training", labelKey: "programmes.methodNames.circuitTraining" },
    ],
  },
];

/* ── Component ── */

export function ProgrammesList() {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState<string | null>(null);

  function toggle(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  return (
    <section className="page">
      <header className="page-header">
        <Link href="/ma-seance" className="eyebrow hover:text-[color:var(--accent)]">
          ← {t("programmes.backLabel")}
        </Link>
        <h1>{t("programmes.title")}</h1>
        <p className="text-sm text-[color:var(--muted)]">
          {t("programmes.subtitle")}
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {PROGRAMMES.map((prog) => {
          const isOpen = expanded === prog.id;
          return (
            <div key={prog.id} className="card">
              {/* Card header — always visible */}
              <button
                type="button"
                onClick={() => toggle(prog.id)}
                className="flex w-full items-start justify-between gap-3 text-left"
              >
                <div className="flex flex-col gap-1">
                  <h2 className="text-base font-bold text-[color:var(--ink)]">
                    {t(prog.titleKey)}
                  </h2>
                  <p className="text-xs text-[color:var(--muted)]">
                    {t(prog.objectifKey)}
                  </p>
                </div>
                <span className="mt-1 shrink-0 text-lg text-[color:var(--muted)] transition-transform"
                  style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}
                >
                  ▾
                </span>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="mt-3 flex flex-col gap-3 border-t border-[color:var(--border)] pt-3">
                  {/* Info rows */}
                  <dl className="grid grid-cols-1 gap-2">
                    <InfoRow label={t("programmes.objectifLabel")} value={t(prog.objectifKey)} />
                    <InfoRow label={t("programmes.frequencyLabel")} value={t(prog.frequencyKey)} />
                    <InfoRow label={t("programmes.methodLabel")} value={t(prog.methodKey)} />
                    <InfoRow label={t("programmes.parametresLabel")} value={t(prog.paramsKey)} />
                    <InfoRow label={t("programmes.exampleLabel")} value={t(prog.exampleKey)} />
                  </dl>

                  {/* Method links */}
                  <div className="flex flex-wrap gap-2">
                    {prog.methodSlugs.map(({ slug, labelKey }) => (
                      <Link
                        key={slug}
                        href={`/methodes/${slug}`}
                        className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs font-semibold text-[color:var(--accent)] transition-colors hover:border-[color:var(--accent)]"
                      >
                        {t(labelKey)}
                      </Link>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link
                      href={`/ma-seance?objectif=${prog.objectifCategorie}`}
                      className="flex-1 rounded-xl bg-[color:var(--accent)] py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
                    >
                      {t("programmes.useThisProgramme")}
                    </Link>
                    <Link
                      href="/apprendre/programmes-hebdomadaires"
                      className="flex-1 rounded-xl border border-[color:var(--border)] py-3 text-center text-sm font-semibold text-[color:var(--muted)] transition-colors hover:text-[color:var(--ink)]"
                    >
                      {t("programmes.detailLink")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer link */}
      <Link
        href="/methodes"
        className="card flex items-center justify-center py-3 text-sm font-semibold text-[color:var(--accent)] transition-colors hover:border-[color:var(--accent)]"
      >
        {t("programmes.seeAllMethods")}
      </Link>
    </section>
  );
}

/* ── Sub-component ── */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-xs text-[color:var(--muted)]">{label}</dt>
      <dd className="text-right text-sm font-semibold text-[color:var(--ink)]">{value}</dd>
    </div>
  );
}
