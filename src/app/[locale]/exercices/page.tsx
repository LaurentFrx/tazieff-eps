export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense } from "react";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { ExerciseListClient } from "@/app/[locale]/exercices/ExerciseListClient";
import { fetchLiveExercises } from "@/lib/live/queries";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { SectionHero } from "@/components/SectionHero";
import { IlluDumbbell } from "@/components/illustrations";
import type { Lang } from "@/lib/i18n/messages";

type Props = { params: Promise<{ locale: string }> };

export default async function ExercicesPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = await getServerLang(localeParam as Lang);
  const t = getServerT(locale);
  const exercises = await getExercisesIndex(locale);
  const liveExercises = await fetchLiveExercises(locale);

  return (
    <section className="page">
      <SectionHero
        title={t("pages.home.exercicesLabel")}
        count={exercises.length}
        subtitle={t("pages.home.heroExercicesSub")}
        gradient="from-orange-500 to-amber-400"
        illustration={<IlluDumbbell />}
      />
      <Suspense>
        <ExerciseListClient
          exercises={exercises}
          liveExercises={liveExercises}
          locale={locale}
        />
      </Suspense>
    </section>
  );
}
