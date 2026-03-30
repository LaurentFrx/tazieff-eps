import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { getServerLang } from "@/lib/i18n/server";
import AnatomyMap from "./AnatomyMap";

export default async function AnatomyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const exercises = await getExercisesIndex(lang);

  return <AnatomyMap exercises={exercises} />;
}
