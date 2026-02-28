import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { getAllMethodes } from "@/lib/content/fs";
import { getServerLang } from "@/lib/i18n/server";
import AnatomyMap from "./AnatomyMap";

export default async function AnatomyPage() {
  const lang = await getServerLang();
  const [exercises, methodes] = await Promise.all([
    getExercisesIndex(lang),
    getAllMethodes(),
  ]);

  return <AnatomyMap exercises={exercises} methodes={methodes} />;
}
