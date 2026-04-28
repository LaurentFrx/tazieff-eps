'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ScoresBlock } from '@/components/methodes/ScoreBar';
import { ExoThumb } from '@/components/ExoThumb';
import { clientLocalizedHref } from '@/lib/i18n/locale-path';
import type { Locale } from '@/lib/i18n/constants';

type MethodeData = {
  slug: string;
  titre: string;
  scores: { endurance: number; hypertrophie: number; force: number; puissance: number };
};

type ExerciseData = {
  slug: string;
  title: string;
};

type MethodAccordionProps = {
  methodes: MethodeData[];
  scoreLabels: { endurance: string; hypertrophie: string; force: string; puissance: string };
  colorAccent: string;
  locale: string;
  expandLabel: string;
  collapseLabel: string;
  seeMethodLabel: string;
};

// Sprint A2 — Le helper lp() divergent (préfixait sauf fr) a été supprimé au
// profit de clientLocalizedHref() qui s'aligne sur LocaleLink (préfixe en fr
// quand on est sur le miroir admin, conserve le path nu sur l'élève).

export function MethodAccordion({
  methodes,
  scoreLabels,
  colorAccent,
  locale,
  expandLabel,
  collapseLabel,
  seeMethodLabel,
}: MethodAccordionProps) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const pathname = usePathname();

  const toggle = (slug: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {methodes.map((m) => {
        const isOpen = open.has(m.slug);
        return (
          <div
            key={m.slug}
            className="rounded-xl border overflow-hidden"
            style={{
              backgroundColor: `${colorAccent}08`,
              borderColor: `${colorAccent}25`,
            }}
          >
            <button
              onClick={() => toggle(m.slug)}
              className="w-full flex items-center justify-between px-4 py-3 bg-transparent border-none cursor-pointer text-left"
            >
              <span className="text-sm font-bold text-[color:var(--ink)]">{m.titre}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 transition-transform duration-200"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: colorAccent }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-3">
                <ScoresBlock scores={m.scores} labels={scoreLabels} />
                <a
                  href={clientLocalizedHref(`/methodes/${m.slug}`, locale as Locale, pathname)}
                  className="inline-flex items-center gap-1 text-xs font-semibold"
                  style={{ color: colorAccent }}
                >
                  {seeMethodLabel} →
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

type ExerciseListProps = {
  exercises: ExerciseData[];
  locale: string;
  seeAllLabel: string;
  seeAllHref: string;
  maxItems?: number;
};

export function ExerciseList({
  exercises,
  locale,
  seeAllLabel,
  seeAllHref,
  maxItems = 12,
}: ExerciseListProps) {
  const shown = exercises.slice(0, maxItems);
  const pathname = usePathname();

  return (
    <div>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {shown.map((exo) => (
          <li key={exo.slug}>
            <a
              href={clientLocalizedHref(`/exercices/${exo.slug}`, locale as Locale, pathname)}
              className="flex items-center gap-3 rounded-xl p-2.5 border border-[color:var(--border)] hover:border-[color:var(--accent)] transition-colors"
            >
              <ExoThumb slug={exo.slug} size={44} />
              <p className="text-xs font-semibold text-[color:var(--ink)] truncate">{exo.title}</p>
            </a>
          </li>
        ))}
      </ul>
      {exercises.length > maxItems && (
        <div className="mt-3 text-center">
          <a
            href={clientLocalizedHref(seeAllHref, locale as Locale, pathname)}
            className="text-xs font-semibold text-[color:var(--accent)]"
          >
            {seeAllLabel} →
          </a>
        </div>
      )}
    </div>
  );
}
