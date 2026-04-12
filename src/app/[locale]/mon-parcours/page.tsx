import type { Metadata } from "next";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { MonParcoursClient } from "./MonParcoursClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = getServerT(getServerLang(locale));
  return { title: t("nav.monParcours.label") };
}

export default async function MonParcoursPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const exercises = await getExercisesIndex(lang);

  return <MonParcoursClient exercises={exercises} />;
}
