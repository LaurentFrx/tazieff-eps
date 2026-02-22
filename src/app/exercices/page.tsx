import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { ExerciseListClient } from "@/app/exercices/ExerciseListClient";
import { fetchLiveExercises } from "@/lib/live/queries";
import { getServerLang } from "@/lib/i18n/server";

export default async function ExercicesPage() {
  const locale = await getServerLang();
  const exercises = await getExercisesIndex(locale);
  const liveExercises = await fetchLiveExercises(locale);

  return (
    <section className="page">
      <ExerciseListClient
        exercises={exercises}
        liveExercises={liveExercises}
        locale={locale}
      />
    </section>
  );
}
