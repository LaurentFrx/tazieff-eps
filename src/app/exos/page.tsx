import type { ComponentType } from "react";
import Link from "next/link";
import type { ExerciseCardProps } from "@/components/ExerciseCardVariants";
import {
  ExerciseCardVariantA,
  ExerciseCardVariantB,
  ExerciseCardVariantC,
} from "@/components/ExerciseCardVariants";
import { listMdx } from "@/lib/content/fs";

type ExoCardVariant = "A" | "B" | "C";

const EXO_CARD_VARIANT: ExoCardVariant = "A";

const CARD_VARIANTS: Record<ExoCardVariant, ComponentType<ExerciseCardProps>> = {
  A: ExerciseCardVariantA,
  B: ExerciseCardVariantB,
  C: ExerciseCardVariantC,
};

export default async function ExosPage() {
  const exercises = await listMdx("exos");
  const ExerciseCard = CARD_VARIANTS[EXO_CARD_VARIANT];

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
