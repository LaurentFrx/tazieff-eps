// Phase E.2.3.4 — GET /api/teacher/classes/[id].
//
// Retourne le détail d'une classe (owner only via teacher_user_id).
// Inclut la liste des student_user_ids enrollés (pas les emails, pas
// disponibles côté client sans service_role — les élèves sont anonymes).

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/api/responses";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError(401, "unauthenticated");

  const { data, error } = await supabase
    .from("classes")
    .select(
      `
      id, name, school_year, join_code, join_code_expires_at,
      archived_at, created_at, updated_at,
      organization:organizations!inner (id, name),
      enrollments:class_enrollments (student_user_id, joined_at)
      `,
    )
    .eq("id", id)
    .eq("teacher_user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[classes GET] supabase error:", error.message);
    return jsonError(500, "internal");
  }
  if (!data) return jsonError(404, "not_found");

  return NextResponse.json(data);
}
