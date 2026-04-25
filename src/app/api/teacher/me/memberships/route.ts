// Phase E.2.3.1 — GET /api/teacher/me/memberships.
//
// Retourne la liste des organisations dont l'utilisateur est membre actif,
// avec son rôle dans chacune. Utilisé par le tableau de bord prof (E.2.3.3)
// et par le formulaire de création de classe (E.2.3.4) pour peupler le
// select "organisation".
//
// Sécurité : auth.getUser() obligatoire. La query elle-même est scopée
// par RLS (policies `memberships_self_*`) mais on filtre explicitement par
// user_id pour ne pas dépendre uniquement du RLS.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/api/responses";
import type { MembershipItem } from "@/lib/validation/teacher-me";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return jsonError(401, "unauthenticated");
  }

  const { data, error } = await supabase
    .from("memberships")
    .select(
      `
      role,
      created_at,
      organization:organizations!inner (
        id,
        name,
        type
      )
      `,
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[me/memberships GET] supabase error:", error.message);
    return jsonError(500, "internal");
  }

  const memberships: MembershipItem[] = (data ?? []).map((row) => {
    const org = Array.isArray(row.organization)
      ? row.organization[0]
      : row.organization;
    return {
      org_id: org?.id ?? "",
      org_name: org?.name ?? "",
      org_type: org?.type ?? null,
      role: row.role,
      joined_at: row.created_at ?? null,
    };
  });

  return NextResponse.json({ memberships });
}
