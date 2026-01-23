import Image from "next/image";
import Link from "next/link";
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
                <div className="flex items-center gap-4">
                  {exercise.image ? (
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                      <Image
                        src={exercise.image}
                        alt={exercise.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0">
                    <span className="pill">
                      {(exercise.muscles ?? []).slice(0, 2).join(" · ") || "Exercice"}
                    </span>
                    <h2>{exercise.title}</h2>
                    <p>
                      {(exercise.equipment ?? []).length > 0
                        ? `Matériel: ${exercise.equipment?.join(", ")}`
                        : "Sans matériel spécifique."}
                    </p>
                  </div>
                </div>
              </article>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
