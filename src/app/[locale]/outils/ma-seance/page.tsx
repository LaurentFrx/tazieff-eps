import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllMethodes } from "@/lib/content/fs";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { SessionGenerator } from "./SessionGenerator";
import type { Lang } from "@/lib/i18n/messages";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = await getServerLang(locale as Lang);
  const t = getServerT(lang);
  return { title: t("maSeance.title") };
}

export default async function MaSeancePage({ params }: Props) {
  const { locale } = await params;
  const lang = await getServerLang(locale as Lang);
  const t = getServerT(lang);
  const [allMethodes, allExercices] = await Promise.all([
    getAllMethodes(lang),
    getExercisesIndex(lang),
  ]);

  const categoryLabels: Record<string, string> = {
    "endurance-de-force": t("methodes.categories.endurance-de-force"),
    "gain-de-volume": t("methodes.categories.gain-de-volume"),
    "gain-de-puissance": t("methodes.categories.gain-de-puissance"),
  };

  const scoreLabels = {
    endurance: t("methodes.scores.endurance"),
    hypertrophie: t("methodes.scores.hypertrophie"),
    force: t("methodes.scores.force"),
    puissance: t("methodes.scores.puissance"),
  };

  const parametresLabels = {
    series: t("methodes.parametres.series"),
    repetitions: t("methodes.parametres.repetitions"),
    intensite: t("methodes.parametres.intensite"),
    recuperation: t("methodes.parametres.recuperation"),
    duree: t("methodes.parametres.duree"),
  };

  return (
    <Suspense>
      <SessionGenerator
        allMethodes={allMethodes}
        allExercices={allExercices}
        categoryLabels={categoryLabels}
        scoreLabels={scoreLabels}
        parametresLabels={parametresLabels}
      />
    </Suspense>
  );
}
