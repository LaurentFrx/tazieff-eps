import type { Metadata } from "next";
import { getAllMethodes } from "@/lib/content/fs";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { OnboardingWizard } from "./OnboardingWizard";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  const t = getServerT(lang);
  return { title: t("onboarding.title") };
}

export default async function OnboardingPage() {
  const lang = await getServerLang();
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
