import type { Metadata } from "next";
import { getAllMethodes } from "@/lib/content/fs";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { EnseignantDashboard } from "./EnseignantDashboard";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  const t = getServerT(lang);
  return { title: t("enseignant.title") };
}

export default async function EnseignantPage() {
  const lang = await getServerLang();
  const [allMethodes, allExercices] = await Promise.all([
    getAllMethodes(lang),
    getExercisesIndex(lang),
  ]);

  const methodeNames = allMethodes.map((m) => ({ slug: m.slug, titre: m.titre }));
  const exerciceNames = allExercices.map((e) => ({ slug: e.slug, title: e.title }));

  return <EnseignantDashboard methodeNames={methodeNames} exerciceNames={exerciceNames} />;
}
