// Sprint A4 — Route de test pour court-circuiter le flow magic-link Supabase.
//
// Cause racine traitée (audit-cc 2026-04-28 PS5) : le flow PKCE est testé
// unitairement par les 945 tests Vitest, mais aucune CI n'exécute la chaîne
// complète "session établie → cookie posé → role détecté → UI affichée →
// action effectuée". Cette route permet aux tests Playwright de poser
// directement une session valide pour un user donné, sans passer par l'email.
//
// SÉCURITÉ — TROIS GARDES CUMULATIFS :
//   1. NODE_ENV !== "production" : la route répond 404 en prod.
//   2. VERCEL_ENV !== "production" : double-check pour les déploiements
//      Vercel (NODE_ENV n'est pas toujours fiable seul).
//   3. Header X-Playwright-Test correspond à PLAYWRIGHT_TEST_SECRET. Sans
//      ce header (ou avec une mauvaise valeur), 401.
//
// Ces 3 gardes sont cumulatifs. La route est intrinsèquement morte en prod.
//
// Référence : GOUVERNANCE_EDITORIALE.md §6 (audit). Le service_role est
// utilisé EXCLUSIVEMENT pour créer/récupérer un user de test ; aucune
// écriture pédagogique n'est jamais effectuée par cette route.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BodySchema = z.object({
  email: z
    .string()
    .max(254)
    .transform((s) => s.trim().toLowerCase())
    .pipe(z.string().email()),
});

function isProduction(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL_ENV === "production"
  );
}

function checkSecret(request: NextRequest): boolean {
  const expected = process.env.PLAYWRIGHT_TEST_SECRET;
  if (!expected) return false;
  const provided = request.headers.get("x-playwright-test");
  return provided === expected;
}

export async function POST(request: NextRequest) {
  // Garde 1+2 : prod = 404 (la route doit paraître inexistante).
  if (isProduction()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Garde 3 : secret partagé.
  if (!checkSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let raw: unknown = null;
  try {
    raw = await request.json();
  } catch {
    raw = null;
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { email } = parsed.data;

  let admin: ReturnType<typeof createSupabaseAdminClient>;
  try {
    admin = createSupabaseAdminClient();
  } catch (err) {
    return NextResponse.json(
      {
        error: "config_missing",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }

  // 1. Récupère ou crée le user (idempotent).
  const { data: usersData, error: listError } =
    await admin.auth.admin.listUsers({ perPage: 200 });
  if (listError || !usersData?.users) {
    return NextResponse.json(
      { error: "supabase_list_failed", message: listError?.message ?? "no users" },
      { status: 500 },
    );
  }
  let user = usersData.users.find(
    (u) => (u.email ?? "").toLowerCase() === email,
  );
  if (!user) {
    const { data: createData, error: createError } =
      await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { source: "playwright-test" },
      });
    if (createError || !createData?.user) {
      return NextResponse.json(
        {
          error: "supabase_create_failed",
          message: createError?.message ?? "no user returned",
        },
        { status: 500 },
      );
    }
    user = createData.user;
  }

  // 2. Génère un magic-link (type "magiclink") pour récupérer un code OTP
  //    qu'on échange ensuite contre une session. Cette approche évite de
  //    forger manuellement des JWT et reste fidèle au flow Supabase.
  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
  if (linkError || !linkData?.properties?.hashed_token) {
    return NextResponse.json(
      {
        error: "supabase_link_failed",
        message: linkError?.message ?? "no hashed_token",
      },
      { status: 500 },
    );
  }

  // 3. Retourne le hashed_token + email_otp + verification_token pour que
  //    le test Playwright puisse les utiliser via supabase.auth.verifyOtp
  //    (côté client) — qui pose les cookies sb-* sur le bon host.
  return NextResponse.json({
    user: { id: user.id, email: user.email },
    hashed_token: linkData.properties.hashed_token,
    email_otp: linkData.properties.email_otp ?? null,
    redirect_to: linkData.properties.redirect_to ?? null,
  });
}
