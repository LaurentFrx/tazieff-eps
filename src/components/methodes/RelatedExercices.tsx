import Link from "next/link";
import type { LiveExerciseListItem } from "@/lib/live/types";

type RelatedExercicesProps = {
  slugs: string[];
  allExercices: LiveExerciseListItem[];
  heading: string;
};

export function RelatedExercices({
  slugs,
  allExercices,
  heading,
}: RelatedExercicesProps) {
  const related = slugs
    .map((slug) => allExercices.find((e) => e.slug === slug))
    .filter((e): e is LiveExerciseListItem => e !== undefined);

  if (related.length === 0) return null;

  return (
    <div className="card">
      <h2 className="mb-3 text-base font-semibold text-[color:var(--ink)]">
        {heading}
      </h2>
      <ul className="flex flex-col divide-y divide-[color:var(--border)]">
        {related.map((exo) => (
          <li key={exo.slug}>
            <Link
              href={`/exercices/${exo.slug}`}
              className="flex items-center py-3 text-[color:var(--ink)] hover:text-[color:var(--accent)]"
            >
              <p className="truncate text-sm font-semibold">{exo.title}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
