import type { Metadata } from "next";
import { HomepageClient } from "@/components/HomepageClient";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { getAllMethodes, getAllLearnPages } from "@/lib/content/fs";
import { getServerLang, getServerT } from "@/lib/i18n/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);
  return { title: t("meta.homeTitle"), description: t("meta.homeDesc") };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const [exercises, methodes, learnPages] = await Promise.all([
    getExercisesIndex(lang),
    getAllMethodes(lang),
    getAllLearnPages(lang),
  ]);

  return (
    <HomepageClient
      exerciseCount={exercises.length}
      methodeCount={methodes.length}
      learnCount={learnPages.length + 4}
    />
  );
}
