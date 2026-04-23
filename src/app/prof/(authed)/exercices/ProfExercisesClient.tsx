"use client";

// Phase E.2.3.5 — Catalogue exercices — client prof.
// Réutilise `filterExercises` / `mergeExercises` / `filterVisibleExercises`
// pour rester aligné sur la logique élève. Filtres UI dédiés (pas d'i18n).

import { useMemo, useState } from "react";
import Link from "next/link";
import type { LiveExerciseListItem, LiveExerciseRow } from "@/lib/live/types";
import type { Difficulty } from "@/lib/content/schema";
import {
  mergeExercises,
  filterVisibleExercises,
  filterExercises,
} from "@/lib/exercices/filters";
import {
  MUSCLE_GROUP_IDS,
  MUSCLE_GROUP_COLORS,
  type MuscleGroupId,
} from "@/lib/exercices/muscleGroups";
import styles from "./exercices.module.css";

type Props = {
  exercises: LiveExerciseListItem[];
  liveExercises: LiveExerciseRow[];
};

const LEVEL_LABELS: Record<Difficulty, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

const MUSCLE_LABELS: Record<MuscleGroupId, string> = {
  pectoraux: "Pectoraux",
  dorsaux: "Dos",
  epaules: "Épaules",
  bras: "Bras",
  abdominaux: "Abdos",
  cuisses: "Cuisses",
  fessiers: "Fessiers",
  mollets: "Mollets",
};

export default function ProfExercisesClient({
  exercises,
  liveExercises,
}: Props) {
  const [query, setQuery] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<Difficulty[]>([]);
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroupId[]>([]);

  const merged = useMemo(
    () => mergeExercises(exercises, liveExercises),
    [exercises, liveExercises],
  );
  // teacherUnlocked=false en prof : pas besoin de révéler les drafts côté
  // élève. L'espace prof verra donc les exercices "publiés" uniquement.
  const visible = useMemo(
    () => filterVisibleExercises(merged, false),
    [merged],
  );

  const filtered = useMemo(
    () =>
      filterExercises(visible, {
        query,
        levels: selectedLevels,
        equipment: [],
        muscleGroups: selectedMuscles,
        themes: [],
        onlyFavorites: false,
        favorites: [],
      }),
    [visible, query, selectedLevels, selectedMuscles],
  );

  const toggleLevel = (lvl: Difficulty) =>
    setSelectedLevels((prev) =>
      prev.includes(lvl) ? prev.filter((l) => l !== lvl) : [...prev, lvl],
    );

  const toggleMuscle = (m: MuscleGroupId) =>
    setSelectedMuscles((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    );

  const resetFilters = () => {
    setQuery("");
    setSelectedLevels([]);
    setSelectedMuscles([]);
  };

  const hasActiveFilters =
    query !== "" || selectedLevels.length > 0 || selectedMuscles.length > 0;

  return (
    <div className={styles.catalogue}>
      <div className={styles.toolbar}>
        <input
          type="search"
          placeholder="Rechercher un exercice…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.search}
          aria-label="Rechercher un exercice"
        />
        <span className={styles.count}>
          {filtered.length} / {visible.length}
        </span>
        {hasActiveFilters && (
          <button type="button" onClick={resetFilters} className={styles.reset}>
            Réinitialiser
          </button>
        )}
      </div>

      <div className={styles.chipRow} aria-label="Niveaux">
        {(Object.keys(LEVEL_LABELS) as Difficulty[]).map((lvl) => {
          const active = selectedLevels.includes(lvl);
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => toggleLevel(lvl)}
              className={active ? `${styles.chip} ${styles.chipActive}` : styles.chip}
            >
              {LEVEL_LABELS[lvl]}
            </button>
          );
        })}
      </div>

      <div className={styles.chipRow} aria-label="Groupes musculaires">
        {MUSCLE_GROUP_IDS.map((m) => {
          const active = selectedMuscles.includes(m);
          return (
            <button
              key={m}
              type="button"
              onClick={() => toggleMuscle(m)}
              className={active ? `${styles.chip} ${styles.chipActive}` : styles.chip}
              style={active ? { borderColor: MUSCLE_GROUP_COLORS[m] } : undefined}
            >
              <span
                className={styles.colorDot}
                style={{ background: MUSCLE_GROUP_COLORS[m] }}
              />
              {MUSCLE_LABELS[m]}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className={styles.emptyState}>
          Aucun exercice ne correspond aux filtres actifs.
        </p>
      ) : (
        <div className={styles.grid}>
          {filtered.map((ex) => (
            <article key={ex.slug} className={styles.card}>
              <h3 className={styles.cardTitle}>{ex.title}</h3>
              {ex.level && (
                <span className={styles.cardLevel}>{LEVEL_LABELS[ex.level]}</span>
              )}
              {ex.muscles && ex.muscles.length > 0 && (
                <p className={styles.cardMuscles}>
                  {ex.muscles.slice(0, 3).join(" · ")}
                </p>
              )}
              <Link
                href={`/exercices/${ex.slug}/annotations`}
                className={styles.annotateBtn}
              >
                Annoter
                <span aria-hidden="true"> →</span>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
