import { Suspense } from "react";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { getServerLang } from "@/lib/i18n/server";
import AnatomyMap from "./AnatomyMap";

type Props = { params: Promise<{ locale: string }> };

export default async function AnatomyPage({ params }: Props) {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const exercises = await getExercisesIndex(lang);

  return (
    <Suspense fallback={<div className="anatomy-loading">Loading...</div>}>
      <AnatomyMap exercises={exercises} />
    </Suspense>
  );
}
