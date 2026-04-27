import { LocaleLink } from "@/components/LocaleLink";
import type { MethodeFrontmatter } from "@/lib/content/schema";
import { CategoryBadge } from "@/components/methodes/CategoryBadge";

type RelatedMethodsProps = {
  slugs: string[];
  allMethodes: MethodeFrontmatter[];
  heading: string;
  categoryLabels: Record<string, string>;
};

export function RelatedMethods({
  slugs,
  allMethodes,
  heading,
  categoryLabels,
}: RelatedMethodsProps) {
  const related = slugs
    .map((slug) => allMethodes.find((m) => m.slug === slug))
    .filter((m): m is MethodeFrontmatter => m !== undefined);

  if (related.length === 0) return null;

  return (
    <div className="card">
      {heading ? (
        <h2 className="mb-3 text-base font-semibold text-[color:var(--ink)]">{heading}</h2>
      ) : null}
      <ul className="flex flex-col divide-y divide-[color:var(--border)]">
        {related.map((methode) => (
          <li key={methode.slug}>
            <LocaleLink
              href={`/methodes/${methode.slug}`}
              className="flex items-center justify-between gap-3 py-3 text-[color:var(--ink)] hover:text-[color:var(--accent)]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{methode.titre}</p>
                {methode.soustitre ? (
                  <p className="text-xs text-[color:var(--muted)]">{methode.soustitre}</p>
                ) : null}
              </div>
              <CategoryBadge
                categorie={methode.categorie}
                label={categoryLabels[methode.categorie] ?? methode.categorie}
              />
            </LocaleLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
