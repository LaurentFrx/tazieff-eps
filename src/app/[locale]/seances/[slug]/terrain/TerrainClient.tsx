"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RestTimer } from "@/components/RestTimer";

type TerrainBlock = {
  exoSlug: string;
  title: string;
  muscles: string[];
  tags: string[];
  sets?: number;
  reps?: number | string;
  restSec?: number;
};

type TerrainClientProps = {
  seanceSlug: string;
  seanceTitle: string;
  blocks: TerrainBlock[];
};

export function TerrainClient({ seanceSlug, seanceTitle, blocks }: TerrainClientProps) {
  const [index, setIndex] = useState(0);
  const current = blocks[index];

  const repsLabel = useMemo(() => {
    if (!current?.reps) {
      return null;
    }
    return typeof current.reps === "number" ? `${current.reps} reps` : current.reps;
  }, [current?.reps]);

  if (!current) {
    return (
      <section className="page">
        <header className="page-header">
          <p className="eyebrow">Mode terrain</p>
          <h1>Bloc vide</h1>
          <p className="lede">Ajoutez des exercices pour démarrer la séance.</p>
        </header>
        <Link href={`/seances/${seanceSlug}`} className="primary-button">
          Retour à la séance
        </Link>
      </section>
    );
  }

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Mode terrain</p>
        <h1>{seanceTitle}</h1>
        <p className="lede">
          Exercice {index + 1} / {blocks.length}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/seances/${seanceSlug}`} className="chip chip-ghost">
            Quitter le mode terrain
          </Link>
        </div>
      </header>

      <div className="card">
        <h2 className="text-xl font-semibold">{current.title}</h2>
        <p className="text-sm text-[color:var(--muted)]">
          {current.muscles.length > 0 ? current.muscles.join(" • ") : "Muscles à renseigner"}
        </p>
        <div className="chip-row chip-row--compact">
          {current.tags.map((tag) => (
            <span key={tag} className="chip">
              {tag}
            </span>
          ))}
        </div>
        <div className="block-stats">
          {current.sets ? <span>{current.sets} séries</span> : null}
          {repsLabel ? <span>{repsLabel}</span> : null}
          {current.restSec ? <span>{current.restSec}s repos</span> : null}
        </div>
      </div>

      <RestTimer key={`${current.exoSlug}-${index}`} durationSec={current.restSec ?? 0} />

      <div className="terrain-controls">
        <button
          type="button"
          className="chip"
          onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
          disabled={index === 0}
        >
          Précédent
        </button>
        <button
          type="button"
          className="chip is-active"
          onClick={() => setIndex((prev) => Math.min(blocks.length - 1, prev + 1))}
          disabled={index === blocks.length - 1}
        >
          Suivant
        </button>
      </div>
    </section>
  );
}
