// Phase E.2.2 — Callback magic link Supabase.
// Flux :
//   1. Email → Supabase envoie lien avec `?code=<otp>` vers cette route
//   2. On échange le code pour une session (pose les cookies sb-access-token)
//   3. Redirection vers `next` (défaut `/tableau-de-bord`)
//
// NE PAS confondre avec `/auth/route.ts` (GitHub OAuth start, hérité, supprimé en A5)
// ni `/callback/route.ts` (GitHub OAuth callback, supprimé en A5).

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  // `next` peut être fourni par le frontend au moment du magic link request.
  // Sécurisé : on ne garde que des chemins relatifs pour éviter les
  // open-redirects.
  const rawNext = request.nextUrl.searchParams.get("next") ?? "/tableau-de-bord";
  const next = rawNext.startsWith("/") ? rawNext : "/tableau-de-bord";

  // Sprint fix-pkce-prod (28 avril 2026) — logging diagnostic activable via
  // l'env `DEBUG_AUTH_CALLBACK=1`. Liste les noms de cookies reçus côté
  // serveur (sans les valeurs, pour ne pas leak de tokens). Permet de
  // diagnostiquer si le code_verifier PKCE est bien transmis du browser
  // au serveur lors du callback.
  if (process.env.DEBUG_AUTH_CALLBACK === "1") {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookieNames = allCookies.map((c) => c.name);
    const hasVerifier = cookieNames.some((n) => n.includes("code-verifier"));
    console.info(
      "[auth/callback] DEBUG cookies received:",
      JSON.stringify({
        host: request.headers.get("host"),
        path: request.nextUrl.pathname,
        hasCode: !!code,
        next,
        cookieCount: cookieNames.length,
        cookieNames,
        hasVerifier,
      }),
    );
  }

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
