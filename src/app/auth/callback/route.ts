// Phase E.2.2 — Callback magic link Supabase.
// Flux :
//   1. Email → Supabase envoie lien avec `?code=<otp>` vers cette route
//   2. On échange le code pour une session (pose les cookies sb-access-token)
//   3. Redirection vers `next` (défaut `/dev/teacher-login`)
//
// NE PAS confondre avec `/auth/route.ts` (GitHub OAuth start, hérité) ni
// `/callback/route.ts` (GitHub OAuth callback, hérité). Les 3 routes vivent
// côte à côte sans conflit : Next.js route chaque chemin vers son handler.

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  // `next` peut être fourni par le frontend au moment du magic link request,
  // ou défini par défaut sur la page de dev. Sécurisé : on ne garde que des
  // chemins relatifs pour éviter les open-redirects.
  const rawNext = request.nextUrl.searchParams.get("next") ?? "/dev/teacher-login";
  const next = rawNext.startsWith("/") ? rawNext : "/dev/teacher-login";

  if (!code) {
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent("missing_code")}`, request.url),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchange error:", error.message);
    return NextResponse.redirect(
      new URL(
        `/?auth_error=${encodeURIComponent(error.message)}`,
        request.url,
      ),
    );
  }

  return NextResponse.redirect(new URL(next, request.url));
}
