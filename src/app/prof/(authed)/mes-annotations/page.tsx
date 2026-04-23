// Phase E.2.3.7 — Liste agrégée des annotations du prof.
//
// Server component. Fetch toutes les annotations de l'user (RLS scope
// author_user_id=user.id via policy). Enrichit avec le titre de l'exercice
// à partir de l'index MDX. Pagination offset/limit (20 par page).
// Passe à un client pour les filtres interactifs.

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import MesAnnotationsClient from "./MesAnnotationsClient";
import type { Database } from "@/types/database";
import styles from "./mes-annotations.module.css";

type AnnotationRow = Database["public"]["Tables"]["teacher_annotations"]["Row"];

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PAGE_SIZE = 20;

export default async function MesAnnotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/connexion");

  // Fetch annotations paginées + count total
  const { data, count, error } = await supabase
    .from("teacher_annotations")
    .select("*", { count: "exact" })
    .eq("author_user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.errorBox}>Erreur de chargement. Réessayez.</p>
      </div>
    );
  }

  const annotations = (data ?? []) as AnnotationRow[];
  const total = count ?? annotations.length;

  // Classes de l'user pour résoudre les noms en scope=class
  const { data: classesData } = await supabase
    .from("classes")
    .select("id, name")
    .eq("teacher_user_id", user.id);
  const classesById = new Map(
    (classesData ?? []).map((c) => [c.id, c.name] as const),
  );

  // Index exercices (fr) pour lookup des titres
  const exercises = await getExercisesIndex("fr");
  const exerciseTitleBySlug = new Map(exercises.map((e) => [e.slug, e.title]));

  // Enrichissement des annotations
  const enriched = annotations.map((a) => ({
    id: a.id,
    exercise_slug: a.exercise_slug,
    exercise_title:
      exerciseTitleBySlug.get(a.exercise_slug) ?? a.exercise_slug,
    visibility_scope: a.visibility_scope,
    scope_id: a.scope_id,
    class_name:
      a.visibility_scope === "class" && a.scope_id
        ? classesById.get(a.scope_id) ?? null
        : null,
    content: a.content,
    created_at: a.created_at,
  }));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Mes annotations</h1>
          <p className={styles.subtitle}>
            {total} annotation{total > 1 ? "s" : ""} au total.
          </p>
        </div>
      </header>

      <MesAnnotationsClient
        annotations={enriched}
        totalCount={total}
        pageSize={PAGE_SIZE}
        currentPage={page}
      />
    </div>
  );
}
