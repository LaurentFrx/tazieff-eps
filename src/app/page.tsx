import { HomepageClient } from "@/components/HomepageClient";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { getAllMethodes, getAllLearnPages } from "@/lib/content/fs";
import { getServerLang } from "@/lib/i18n/server";

export default async function HomePage() {
  const lang = await getServerLang();
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
