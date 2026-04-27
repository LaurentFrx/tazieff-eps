// Phase P0.1 — GET /api/me/role
//
// Retourne le statut admin de l'utilisateur courant, à destination du hook
// client `useAppAdmin`. Toujours 200 (même pour un anonyme) afin de ne pas
// fuiter d'information sur l'existence ou non d'une session.
//
// Référence : GOUVERNANCE_EDITORIALE.md §3.1, §7. Skill gouvernance-editoriale.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/auth/requireAdmin";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { is_super_admin: false, is_admin: false },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, must-revalidate" },
      },
    );
  }

  const role = await isAdminUser(user.id, supabase);
  return NextResponse.json(role, {
    status: 200,
    headers: { "Cache-Control": "no-store, must-revalidate" },
  });
}
