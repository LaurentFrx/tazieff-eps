import type { Metadata } from "next";
import Link from "next/link";
import { getAllMethodes } from "@/lib/content/fs";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { CategoryBadge } from "@/components/methodes/CategoryBadge";
import { ScoresBlock } from "@/components/methodes/ScoreBar";
import type { CategorieMethode } from "@/lib/content/schema";

export const metadata: Metadata = {
  title: "Méthodes d'entraînement",
};

const CATEGORY_ORDER: CategorieMethode[] = [
  "endurance-de-force",
  "gain-de-volume",
  "gain-de-puissance",
];

export default async function MethodesPage() {
  const lang = await getServerLang();
  const t = getServerT(lang);
  const methodes = await getAllMethodes();

  const grouped = CATEGORY_ORDER.map((cat) => ({
    categorie: cat,
    label: t(`methodes.categories.${cat}`),
    items: methodes.filter((m) => m.categorie === cat),
  }));

  const scoreLabels = {
    endurance: t("methodes.scores.endurance"),
    hypertrophie: t("methodes.scores.hypertrophie"),
    force: t("methodes.scores.force"),
    puissance: t("methodes.scores.puissance"),
  };

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">{t("methodes.eyebrow")}</p>
        <h1>{t("methodes.title")}</h1>
        <p className="lede">{t("methodes.lede")}</p>
      </header>

      <div className="stack-lg">
        {grouped.map(({ categorie, label, items }) =>
          items.length === 0 ? null : (
            <section key={categorie}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-[color:var(--ink)]">
                <CategoryBadge categorie={categorie} label={label} />
                <span className="text-xs text-[color:var(--muted)]">
                  ({items.length})
                </span>
              </h2>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {items.map((methode) => (
                  <li key={methode.slug}>
                    <Link
                      href={`/methodes/${methode.slug}`}
                      className="card flex flex-col gap-3 p-4 transition-colors hover:border-[color:var(--accent)]"
                    >
                      <div>
                        <p className="text-sm font-bold text-[color:var(--ink)]">
                          {methode.titre}
                        </p>
                        {methode.soustitre ? (
                          <p className="text-xs text-[color:var(--muted)]">
                            {methode.soustitre}
                          </p>
                        ) : null}
                      </div>
                      <p className="line-clamp-2 text-xs text-[color:var(--muted)]">
                        {methode.description}
                      </p>
                      <ScoresBlock scores={methode.scores} labels={scoreLabels} />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[color:var(--muted)]">
                          {t("methodes.niveau")} :{" "}
                          <span className="font-semibold text-[color:var(--ink)]">
                            {t(`methodes.niveaux.${methode.niveau_minimum}`)}
                          </span>
                        </span>
                        {methode.timer ? (
                          <span className="rounded-full bg-[color:var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[color:var(--accent)]">
                            ⏱ Chrono
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ),
        )}
      </div>
    </section>
  );
}
