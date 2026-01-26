import { exercisesIndex } from "@/lib/content/fs";
import { ExerciseListClient } from "@/app/exercices/ExerciseListClient";

export default async function ExercicesPage() {
  const exercises = await exercisesIndex();

  return (
    <section className="page">
      <ExerciseListClient exercises={exercises} />
    </section>
  );
}
