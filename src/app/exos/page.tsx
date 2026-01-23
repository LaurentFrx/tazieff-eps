import Link from "next/link";
import { ExerciseCard } from "@/components/ExerciseCard";
import { listMdx } from "@/lib/content/fs";

export default async function ExosPage() {
  const exercises = await listMdx("exos");

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Exos</p>
        <h1>Exercices disponibles</h1>
        <p className="lede">
          Consultez les fiches techniques et les repères de sécurité.
        </p>
      </header>
      <div className="card-grid">
        {exercises.length === 0 ? (
          <div className="card">
            <h2>Aucun exercice pour le moment</h2>
            <p>Ajoutez un fichier MDX pour enrichir la bibliothèque.</p>
          </div>
        ) : (
          exercises.map((exercise) => (
            <Link key={exercise.slug} href={`/exos/${exercise.slug}`}>
              <article className="card">
                <ExerciseCard exercise={exercise} />
              </article>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
