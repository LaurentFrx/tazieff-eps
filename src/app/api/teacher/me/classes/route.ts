// Phase E.2.3.1 — GET /api/teacher/me/classes.
//
// Retourne la liste des classes enseignées par l'utilisateur connecté
// (classes.teacher_user_id = user.id), avec le nom de l'organisation et
// le nombre d'élèves inscrits (via class_enrollments).
//
// Sécurité :
//   - auth.getUser() obligatoire (401)
//   - La query est filtrée par teacher_user_id + RLS classes.
//   - Aucune classe archivée (archived_at IS NULL) n'est remontée.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/api/responses";
import type { TeacherClassItem } from "@/lib/validation/teacher-me";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return jsonError(401, "unauthenticated");
  }

  // On récupère les classes enseignées + jointure organisations +
  // count des enrollments via la syntaxe `count: exact` sur une sous-sélection.
  const { data, error } = await supabase
    .from("classes")
    .select(
      `
      id,
      name,
      school_year,
      join_code,
      created_at,
      organization:organizations!inner (
        id,
        name
      ),
      enrollments:class_enrollments (
        student_user_id
      )
      `,
    )
    .eq("teacher_user_id", user.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[me/classes GET] supabase error:", error.message);
    return jsonError(500, "internal");
  }

  const classes: TeacherClassItem[] = (data ?? []).map((row) => {
    const org = Array.isArray(row.organization)
      ? row.organization[0]
      : row.organization;
    const enrollments = Array.isArray(row.enrollments) ? row.enrollments : [];
    return {
      id: row.id,
      name: row.name,
      level: row.school_year ?? null,
      org_id: org?.id ?? "",
      org_name: org?.name ?? "",
      code: row.join_code,
      students_count: enrollments.length,
      created_at: row.created_at ?? null,
    };
  });

  return NextResponse.json({ classes });
}
