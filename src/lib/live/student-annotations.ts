// Sprint E.4 (29 avril 2026) — helper serveur partagé pour récupérer les
// annotations prof visibles par un user (élève authentifié).
//
// Ce module est appelé :
//   - Par la route GET /api/exercises/[slug]/annotations (cf. route.ts)
//   - Par la page SSR /[locale]/exercices/[slug]/page.tsx (rendu initial,
//     évite un round-trip HTTP côté client et permet le SSR sans flash)
//
// Conformité GOUVERNANCE_EDITORIALE.md v1.1 §3.2 :
//   - Attribution explicite du prof via memberships.display_name (avec
//     fallback "Ton prof" si non renseigné)
//   - RLS filtre les annotations selon visibility_scope (private/class/school)
//
// Anonymes : retourne un array vide sans erreur.

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type StudentAnnotationItem = {
  id: string;
  content: unknown;
  scope: "private" | "class" | "school";
  section_target: string | null;
  author_display_name: string;
  author_user_id: string;
  organization_id: string;
  created_at: string | null;
};

export const FALLBACK_DISPLAY_NAME = "Ton prof";

export async function fetchStudentAnnotations(
  supabase: SupabaseClient,
  slug: string,
  locale: "fr" | "en" | "es",
): Promise<StudentAnnotationItem[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Anonyme : pas d'annotations visibles. La fiche élève reste affichée.
  if (!user) {
    return [];
  }

  const { data: rows, error } = await supabase
    .from("teacher_annotations")
    .select(
      "id, content, visibility_scope, section_target, author_user_id, organization_id, created_at",
    )
    .eq("exercise_slug", slug)
    .eq("locale", locale)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[student-annotations] supabase error:", error.message);
    return [];
  }
  if (!rows || rows.length === 0) {
    return [];
  }

  const authorIds = Array.from(new Set(rows.map((r) => r.author_user_id)));
  const orgIds = Array.from(new Set(rows.map((r) => r.organization_id)));

  const { data: memberships, error: mError } = await supabase
    .from("memberships")
    .select("user_id, organization_id, display_name")
    .in("user_id", authorIds)
    .in("organization_id", orgIds);

  if (mError) {
    console.error("[student-annotations] memberships error:", mError.message);
    // Continue avec fallback display_name.
  }

  const displayNameByKey = new Map<string, string>();
  for (const m of memberships ?? []) {
    if (m.display_name && m.display_name.trim().length > 0) {
      displayNameByKey.set(`${m.user_id}::${m.organization_id}`, m.display_name);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    scope: row.visibility_scope as "private" | "class" | "school",
    section_target: row.section_target ?? null,
    author_display_name:
      displayNameByKey.get(`${row.author_user_id}::${row.organization_id}`) ??
      FALLBACK_DISPLAY_NAME,
    author_user_id: row.author_user_id,
    organization_id: row.organization_id,
    created_at: row.created_at,
  }));
}
