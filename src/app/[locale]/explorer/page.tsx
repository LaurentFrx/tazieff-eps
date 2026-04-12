export const dynamic = 'force-dynamic';
export const revalidate = 0;

import type { Metadata } from "next";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { getAllMethodes, getAllLearnPages } from "@/lib/content/fs";
import { fetchLiveExercises } from "@/lib/live/queries";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { ExplorerClient } from "./ExplorerClient";
import type { CategorieMethode } from "@/lib/content/schema";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = getServerT(getServerLang(locale));
  return { title: t("nav.explorer.label"), description: t("meta.exercicesDesc") };
}

const CATEGORY_ORDER: CategorieMethode[] = [
  "gain-de-volume",
  "endurance-de-force",
  "gain-de-puissance",
];

export default async function ExplorerPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string; objectif?: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = getServerLang(localeParam);
  const t = getServerT(locale);
  const resolvedSearchParams = await searchParams;

  const [exercises, liveExercises, methodes, learnPages] = await Promise.all([
    getExercisesIndex(locale),
    fetchLiveExercises(locale),
    getAllMethodes(locale),
    getAllLearnPages(locale),
  ]);

  // Group methods by category
  const grouped = CATEGORY_ORDER.map((cat) => ({
    categorie: cat,
    label: t(`methodes.categories.${cat}`),
    items: methodes.filter((m) => m.categorie === cat),
  }));

  // Build learn cards
  const bySlug = new Map(learnPages.map((p) => [p.slug, p]));
  const ORDERED_SLUGS = [
    "muscles", "rm-rir-rpe", "securite", "contractions",
    "glossaire", "programmes-hebdomadaires", "nutrition", "sante-prevention",
  ];
  type CardItem = { href: string; title: string; description: string };
  const learnCards: CardItem[] = [
    { href: "/apprendre/parametres", title: t("pages.apprendre.cards.parametres.title"), description: t("pages.apprendre.cards.parametres.description") },
    ...ORDERED_SLUGS.slice(0, 4).map((slug) => {
      const p = bySlug.get(slug);
      return { href: `/apprendre/${slug}`, title: p?.titre ?? slug, description: p?.description ?? "" };
    }),
    { href: "/apprendre/techniques", title: t("pages.apprendre.cards.techniques.title"), description: t("pages.apprendre.cards.techniques.description") },
    { href: "/apprendre/connaissances", title: t("pages.apprendre.cards.connaissances.title"), description: t("pages.apprendre.cards.connaissances.description") },
    ...ORDERED_SLUGS.slice(4).map((slug) => {
      const p = bySlug.get(slug);
      return { href: `/apprendre/${slug}`, title: p?.titre ?? slug, description: p?.description ?? "" };
    }),
    { href: "/apprendre/anatomie", title: t("pages.apprendre.cards.anatomie.title"), description: t("pages.apprendre.cards.anatomie.description") },
  ];

  const scoreLabels = {
    endurance: t("methodes.scores.endurance"),
    hypertrophie: t("methodes.scores.hypertrophie"),
    force: t("methodes.scores.force"),
    puissance: t("methodes.scores.puissance"),
  };

  return (
    <ExplorerClient
      exercises={exercises}
      liveExercises={liveExercises}
      locale={locale}
      methodesGrouped={grouped}
      scoreLabels={scoreLabels}
      learnCards={learnCards}
      initialTab={resolvedSearchParams.tab ?? "exercices"}
    />
  );
}
