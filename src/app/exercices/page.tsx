export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { ExerciseListClient } from "@/app/exercices/ExerciseListClient";
import { fetchLiveExercises } from "@/lib/live/queries";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { SectionHero } from "@/components/SectionHero";
import { IlluDumbbell } from "@/components/illustrations";

export default async function ExercicesPage() {
  const locale = await getServerLang();
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
      <ExerciseListClient
        exercises={exercises}
        liveExercises={liveExercises}
        locale={locale}
      />
    </section>
  );
}
