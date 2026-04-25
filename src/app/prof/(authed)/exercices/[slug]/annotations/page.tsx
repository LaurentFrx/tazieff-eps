// Phase E.2.3.6 — Page d'annotation d'un exercice.
//
// Layout 1/3 sidebar + 2/3 éditeur. Server component pour le fetch initial
// (exercise + annotations du user + orgs + classes), délègue à
// AnnotationEditorClient pour les interactions (édition inline, create,
// delete).

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import AnnotationEditorClient from "./AnnotationEditorClient";
import styles from "./annotations.module.css";
import type { Database } from "@/types/database";

type AnnotationRow = Database["public"]["Tables"]["teacher_annotations"]["Row"];

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AnnotationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ annotation_id?: string }>;
}) {
  const { slug } = await params;
  const { annotation_id: focusedId } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/connexion");

  // 1. Exercice (mini-infos pour le preview)
  const allExercises = await getExercisesIndex("fr");
  const exercise = allExercises.find((e) => e.slug === slug);
  if (!exercise) notFound();

  // 2. Annotations existantes pour ce slug / locale (RLS filtre)
  const { data: annotationsData } = await supabase
    .from("teacher_annotations")
    .select("*")
    .eq("exercise_slug", slug)
    .eq("locale", "fr")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const annotations = (annotationsData ?? []) as AnnotationRow[];

  // 3. Memberships (pour le select org si school/private)
  const { data: memsData } = await supabase
    .from("memberships")
    .select(`role, organization:organizations!inner (id, name)`)
    .eq("user_id", user.id)
    .eq("status", "active");
  const organizations = (memsData ?? []).map((m) => {
    const org = Array.isArray(m.organization) ? m.organization[0] : m.organization;
    return { id: org?.id ?? "", name: org?.name ?? "" };
  }).filter((o) => o.id);

  // 4. Classes enseignées par l'user (pour scope=class)
  const { data: classesData } = await supabase
    .from("classes")
    .select("id, name, organization_id")
    .eq("teacher_user_id", user.id)
    .is("archived_at", null);
  const classes = (classesData ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    organization_id: c.organization_id,
  }));

  return (
    <div className={styles.page}>
      <nav className={styles.topNav}>
        <Link href="/exercices" className={styles.back}>
          ← Catalogue
        </Link>
      </nav>

      <AnnotationEditorClient
        exerciseSlug={slug}
        exerciseTitle={exercise.title}
        exerciseMuscles={exercise.muscles ?? []}
        exerciseLevel={exercise.level ?? null}
        initialAnnotations={annotations}
        organizations={organizations}
        classes={classes}
        focusedAnnotationId={focusedId ?? null}
      />
    </div>
  );
}
