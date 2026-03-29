import type { Metadata } from "next";
import { getAllMethodes } from "@/lib/content/fs";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { OnboardingWizard } from "./OnboardingWizard";
import type { Lang } from "@/lib/i18n/messages";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = await getServerLang(locale as Lang);
  const t = getServerT(lang);
  return { title: t("onboarding.title") };
}

export default async function OnboardingPage({ params }: Props) {
  const { locale } = await params;
  const lang = await getServerLang(locale as Lang);
  const [allMethodes, allExercices] = await Promise.all([
    getAllMethodes(lang),
    getExercisesIndex(lang),
  ]);

  // Filter methods for Seconde level
  const secondeMethodes = allMethodes
    .filter((m) => m.niveau_minimum === "seconde")
    .map((m) => ({ slug: m.slug, titre: m.titre, categorie: m.categorie }));

  // Simple exercise list with muscles
  const exerciceList = allExercices
    .filter((e) => e.level === "debutant" || e.level === "intermediaire")
    .slice(0, 40)
    .map((e) => ({ slug: e.slug, title: e.title, muscles: e.muscles ?? [] }));

  return <OnboardingWizard methodes={secondeMethodes} exercices={exerciceList} />;
}
