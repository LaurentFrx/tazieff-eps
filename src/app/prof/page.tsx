// Phase E.2.2.5 — Racine de l'espace prof (prof.muscu-eps.fr/).
//
// Comportement :
//   - Si session active → redirect vers /connexion?session_active=true
//     (temporaire le temps que /tableau-de-bord existe en E.2.3, cf. spec)
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
    // Session active avec email (prof authentifié)
    // TODO E.2.3 : remplacer par redirect("/tableau-de-bord") quand
    // cette page existera.
    redirect("/connexion?session_active=true");
  }

  redirect("/connexion");
}
