import type { Metadata } from "next";
import { getAllMethodes } from "@/lib/content/fs";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { CategoryBadge } from "@/components/methodes/CategoryBadge";
import { MethodeCard } from "@/components/methodes/MethodeCard";
import type { CategorieMethode } from "@/lib/content/schema";
import { SectionHero } from "@/components/SectionHero";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { IlluClipboard } from "@/components/illustrations";
import { LocaleLink as Link } from "@/components/LocaleLink";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);
  return { title: t("meta.methodesTitle"), description: t("meta.methodesDesc") };
}

const CATEGORY_ORDER: CategorieMethode[] = [
  "gain-de-volume",
  "endurance-de-force",
  "gain-de-puissance",
];

const OBJECTIF_TO_CATEGORY: Record<string, CategorieMethode> = {
  endurance: "endurance-de-force",
  volume: "gain-de-volume",
  puissance: "gain-de-puissance",
};

export default async function MethodesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ objectif?: string }>;
}) {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);
  const methodes = await getAllMethodes(lang);
  const resolvedSearchParams = await searchParams;

  const objectifParam = resolvedSearchParams.objectif ?? null;
  const activeCategory = objectifParam
    ? OBJECTIF_TO_CATEGORY[objectifParam] ?? null
    : null;

  const filteredCategories = activeCategory
    ? [activeCategory]
    : CATEGORY_ORDER;

  const grouped = filteredCategories.map((cat) => ({
    categorie: cat,
    label: t(`methodes.categories.${cat}`),
    items: methodes.filter((m) => m.categorie === cat),
  }));

  const displayedCount = activeCategory
    ? grouped.reduce((sum, g) => sum + g.items.length, 0)
    : methodes.length;

  const scoreLabels = {
    endurance: t("methodes.scores.endurance"),
    hypertrophie: t("methodes.scores.hypertrophie"),
    force: t("methodes.scores.force"),
    puissance: t("methodes.scores.puissance"),
  };

  return (
    <section className="page">
      <Breadcrumbs items={[{ label: t("nav.home.label"), href: "/" }, { label: t("pages.home.methodesLabel") }]} />
      <SectionHero
        title={
          activeCategory
            ? t(`methodes.categories.${activeCategory}`)
            : t("methodes.title")
        }
        count={displayedCount}
        subtitle={t("pages.home.heroMethodesSub")}
        gradient="from-blue-600 to-indigo-500"
        illustration={<IlluClipboard />}
      />

      {activeCategory && (
        <div className="mb-4">
          <Link
            href="/methodes"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← {t("methodes.showAll")}
          </Link>
        </div>
      )}

      <div className="stack-lg">
        {grouped.map(({ categorie, label, items }) =>
          items.length === 0 ? null : (
            <section key={categorie} id={categorie}>
              {!activeCategory && (
                <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-[color:var(--ink)]">
                  <CategoryBadge categorie={categorie} label={label} />
                  <span className="text-xs text-[color:var(--muted)]">
                    ({items.length})
                  </span>
                </h2>
              )}
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
