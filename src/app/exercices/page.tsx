import { exercisesIndex } from "@/lib/content/fs";
import { ExerciseListClient } from "@/app/exercices/ExerciseListClient";
import { getCurrentLang } from "@/lib/i18n/server";

export default async function ExercicesPage() {
  const lang = await getCurrentLang();
  const exercises = await exercisesIndex(lang);

  return (
    <section className="page">
      <ExerciseListClient exercises={exercises} />
    </section>
  );
}
