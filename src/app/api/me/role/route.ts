// Phase P0.1 — GET /api/me/role
//
// Retourne le statut admin de l'utilisateur courant, à destination du hook
// client `useAppAdmin`. Toujours 200 (même pour un anonyme) afin de ne pas
// fuiter d'information sur l'existence ou non d'une session.
//
// Référence : GOUVERNANCE_EDITORIALE.md §3.1, §7. Skill gouvernance-editoriale.

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/auth/requireAdmin";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // DEBUG_P0_7_SEXIES — instrumentation runtime pour diagnostiquer pourquoi
  // l'édition au clic reste inactive sur le miroir admin malgré la session
  // super_admin valide. À retirer dès que la cause racine est confirmée.
  let debugHost = "unknown";
  try {
    const h = await headers();
    debugHost = h.get("host") ?? "unknown";
  } catch {
    // headers() peut throw hors d'un Request scope (tests)
  }
  // eslint-disable-next-line no-console -- DEBUG_P0_7_SEXIES
  console.log("[DEBUG_P0_7_SEXIES] /api/me/role", {
    host: debugHost,
    hasUser: !!user,
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    userIsAnon: user?.is_anonymous ?? null,
  });

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
  // eslint-disable-next-line no-console -- DEBUG_P0_7_SEXIES
  console.log("[DEBUG_P0_7_SEXIES] /api/me/role lookup result", {
    host: debugHost,
    userId: user.id,
    is_super_admin: role.is_super_admin,
    is_admin: role.is_admin,
  });
  return NextResponse.json(role, {
    status: 200,
    headers: { "Cache-Control": "no-store, must-revalidate" },
  });
}
