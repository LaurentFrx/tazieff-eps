import type { Metadata } from "next";
import { getAllMethodes } from "@/lib/content/fs";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { CategoryBadge } from "@/components/methodes/CategoryBadge";
import { MethodeCard } from "@/components/methodes/MethodeCard";
import type { CategorieMethode } from "@/lib/content/schema";
import { SectionHero } from "@/components/SectionHero";
import { IlluClipboard } from "@/components/illustrations";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  const t = getServerT(lang);
  return { title: t("methodes.title") };
}

const CATEGORY_ORDER: CategorieMethode[] = [
  "gain-de-volume",
  "endurance-de-force",
  "gain-de-puissance",
];

export default async function MethodesPage() {
  const lang = await getServerLang();
  const t = getServerT(lang);
  const methodes = await getAllMethodes(lang);

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
      <SectionHero
        title={t("methodes.title")}
        count={methodes.length}
        subtitle={t("pages.home.heroMethodesSub")}
        gradient="from-blue-600 to-indigo-500"
        illustration={<IlluClipboard />}
      />

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
    </section>
  );
}
