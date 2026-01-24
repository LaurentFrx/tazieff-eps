import { exercisesIndex } from "@/lib/content/fs";
import { ExerciseListClient } from "@/app/exercices/ExerciseListClient";

export default async function ExercicesPage() {
  const exercises = await exercisesIndex();

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Exercices</p>
        <h1>Bibliothèque d&apos;exercices</h1>
        <p className="lede">
          Explorez, filtrez et gardez vos mouvements préférés à portée de main.
        </p>
      </header>
      <ExerciseListClient exercises={exercises} />
    </section>
  );
}
