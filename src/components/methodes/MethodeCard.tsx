import Link from "next/link";
import type { CategorieMethode } from "@/lib/content/schema";
import { CategoryBadge } from "@/components/methodes/CategoryBadge";
import { AnimatedScoresBlock } from "@/components/methodes/AnimatedScoresBlock";

type MethodeCardProps = {
  slug: string;
  titre: string;
  soustitre?: string;
  description?: string;
  categorie: CategorieMethode;
  categoryLabel: string;
  scores: {
    endurance: number;
    hypertrophie: number;
    force: number;
    puissance: number;
  };
  scoreLabels: {
    endurance: string;
    hypertrophie: string;
    force: string;
    puissance: string;
  };
  niveauLabel?: string;
  timerLabel?: string;
};

export function MethodeCard({
  slug,
  titre,
  soustitre,
  description,
  categorie,
  categoryLabel,
  scores,
  scoreLabels,
  niveauLabel,
  timerLabel,
}: MethodeCardProps) {
  return (
    <Link
      href={`/methodes/${slug}`}
      className="card tap-feedback flex flex-col gap-3 p-4 transition-colors hover:border-[color:var(--accent)]"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[color:var(--ink)]">{titre}</p>
          {soustitre ? (
            <p className="text-xs text-[color:var(--muted)]">{soustitre}</p>
          ) : null}
        </div>
        <CategoryBadge categorie={categorie} label={categoryLabel} />
      </div>
      {description ? (
        <p className="line-clamp-2 text-xs text-[color:var(--muted)]">
          {description}
        </p>
      ) : null}
      <AnimatedScoresBlock scores={scores} labels={scoreLabels} />
      {niveauLabel || timerLabel ? (
        <div className="flex items-center justify-between">
          {niveauLabel ? (
            <span className="text-xs text-[color:var(--muted)]">
              {niveauLabel}
            </span>
          ) : null}
          {timerLabel ? (
            <span className="rounded-full bg-[color:var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[color:var(--accent)]">
              ⏱ {timerLabel}
            </span>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}
