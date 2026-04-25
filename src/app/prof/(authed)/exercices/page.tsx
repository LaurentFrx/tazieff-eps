// Phase E.2.3.5 — Catalogue exercices côté prof.
//
// Réutilise les mêmes fonctions de fetch que l'espace élève
// (getExercisesIndex + fetchLiveExercises) pour garantir l'alignement.
// Rendu client minimaliste avec filtres custom (pas de I18nProvider monté
// sur l'espace prof donc on ne peut pas réutiliser ExerciseFilters).

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { fetchLiveExercises } from "@/lib/live/queries";
import ProfExercisesClient from "./ProfExercisesClient";
import styles from "./exercices.module.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ProfExercicesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/connexion");

  // Les profs travaillent en français (UI prof mono-langue).
  const exercises = await getExercisesIndex("fr");
  const liveExercises = await fetchLiveExercises("fr");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Catalogue exercices</h1>
        <p className={styles.subtitle}>
          Parcourez le catalogue et ajoutez vos annotations pédagogiques.
          {exercises.length > 0 && ` ${exercises.length} exercices disponibles.`}
        </p>
      </header>
      <ProfExercisesClient
        exercises={exercises}
        liveExercises={liveExercises}
      />
    </div>
  );
}
