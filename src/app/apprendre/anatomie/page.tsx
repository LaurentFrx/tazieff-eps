import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { getServerLang } from "@/lib/i18n/server";
import AnatomyMap from "./AnatomyMap";

export default async function AnatomyPage() {
  const lang = await getServerLang();
  const exercises = await getExercisesIndex(lang);

  return <AnatomyMap exercises={exercises} />;
}
