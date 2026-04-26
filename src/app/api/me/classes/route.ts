// Sprint E1 — GET /api/me/classes
//
// Retourne la liste des classes auxquelles l'utilisateur courant est inscrit
// (via user_class_ids()). Toujours 200 (un anonyme reçoit { classes: [] }).
//
// Référence : GOUVERNANCE_EDITORIALE.md §2.4 (rôle student), §3.3 (carnet
// personnel — la liste de classes fait partie de l'espace privé élève).

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ClassPayload = {
  id: string;
  name: string;
  school_year: string | null;
  teacher_name: string | null;
  org_name: string;
};

type ClassRow = {
  id: string;
  name: string;
  school_year: string | null;
  teacher_user_id: string;
  organizations: { name: string } | { name: string }[] | null;
};

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { classes: [] },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, must-revalidate" },
      },
    );
  }

  // Lit les classes via la policy classes_select_teacher_student_admin :
  // l'élève voit les classes où il est inscrit (id in user_class_ids()).
  const { data, error } = await supabase
    .from("classes")
    .select(
      `
      id,
      name,
      school_year,
      teacher_user_id,
      organizations!inner ( name )
      `,
    )
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[me/classes GET] supabase error:", error.message);
    return NextResponse.json(
      { classes: [] },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, must-revalidate" },
      },
    );
  }

  const classes: ClassPayload[] = ((data as ClassRow[]) ?? []).map((row) => {
    const org = Array.isArray(row.organizations)
      ? row.organizations[0]
      : row.organizations;
    return {
      id: row.id,
      name: row.name,
      school_year: row.school_year,
      // V1 : pas de table teacher_profiles, on retourne null. Le client
      // affichera un fallback générique. À enrichir dans un sprint ultérieur.
      teacher_name: null,
      org_name: org?.name ?? "",
    };
  });

  return NextResponse.json(
    { classes },
    {
      status: 200,
      headers: { "Cache-Control": "no-store, must-revalidate" },
    },
  );
}
