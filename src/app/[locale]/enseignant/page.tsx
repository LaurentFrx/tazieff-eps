import type { Metadata } from "next";
import { getAllMethodes } from "@/lib/content/fs";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { EnseignantDashboard } from "./EnseignantDashboard";
import type { Lang } from "@/lib/i18n/messages";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = await getServerLang(locale as Lang);
  const t = getServerT(lang);
  return { title: t("enseignant.title") };
}

export default async function EnseignantPage({ params }: Props) {
  const { locale } = await params;
  const lang = await getServerLang(locale as Lang);
  const [allMethodes, allExercices] = await Promise.all([
    getAllMethodes(lang),
    getExercisesIndex(lang),
  ]);

  const methodeNames = allMethodes.map((m) => ({ slug: m.slug, titre: m.titre }));
  const exerciceNames = allExercices.map((e) => ({ slug: e.slug, title: e.title }));

  return <EnseignantDashboard methodeNames={methodeNames} exerciceNames={exerciceNames} />;
}
