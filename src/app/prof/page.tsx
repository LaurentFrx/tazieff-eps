// Phase E.2.3.3 — Racine de l'espace prof (prof.muscu-eps.fr/).
//
// Comportement :
//   - Session active → redirect vers /tableau-de-bord
//   - Sinon → redirect vers /connexion
//
// Le middleware garantit que cette page n'est atteinte que via le sous-domaine
// prof. Sur muscu-eps.fr/prof ou design.muscu-eps.fr/prof → 404 (protection
// croisée).

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ProfRootPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && user.email) {
    redirect("/tableau-de-bord");
  }

  redirect("/connexion");
}
