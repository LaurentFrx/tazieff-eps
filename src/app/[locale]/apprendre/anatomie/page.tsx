import { Suspense } from "react";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { getServerLang } from "@/lib/i18n/server";
import AnatomyMap from "./AnatomyMap";
import type { Lang } from "@/lib/i18n/messages";

type Props = { params: Promise<{ locale: string }> };

export default async function AnatomyPage({ params }: Props) {
  const { locale } = await params;
  const lang = await getServerLang(locale as Lang);
  const exercises = await getExercisesIndex(lang);

  return (
    <Suspense fallback={<div className="anatomy-loading">Initializing 3D...</div>}>
      <AnatomyMap exercises={exercises} />
    </Suspense>
  );
}
