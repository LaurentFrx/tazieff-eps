import { HomepageClient } from "@/components/HomepageClient";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { getAllMethodes, getAllLearnPages } from "@/lib/content/fs";
import { getServerLang } from "@/lib/i18n/server";
import type { Lang } from "@/lib/i18n/messages";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const lang = await getServerLang(locale as Lang);
  const [exercises, methodes, learnPages] = await Promise.all([
    getExercisesIndex(lang),
    getAllMethodes(lang),
    getAllLearnPages(lang),
  ]);

  return (
    <HomepageClient
      exerciseCount={exercises.length}
      methodeCount={methodes.length}
      learnCount={learnPages.length}
    />
  );
}
