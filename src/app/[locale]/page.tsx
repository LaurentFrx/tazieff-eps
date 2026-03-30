import { HomepageClient } from "@/components/HomepageClient";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { getAllMethodes, getAllLearnPages } from "@/lib/content/fs";
import { getServerLang } from "@/lib/i18n/server";

type Props = { params: Promise<{ locale: string }> };

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
      learnCount={learnPages.length}
    />
  );
}
