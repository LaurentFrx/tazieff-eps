// Phase E.2.2 — Route POST d'envoi d'un magic link à un email académique.
// Sécurité :
//   - Gate `isAcademicEmail` (refus 403 sinon)
//   - Réponse volontairement opaque même en cas d'erreur Supabase pour
//     éviter l'énumération d'emails existants (on log côté serveur)
//   - `emailRedirectTo` construit dynamiquement depuis `request.nextUrl.origin`
//     → pas d'URL hardcodée, s'adapte à design/prod/localhost
//
// NE PAS confondre avec l'ancien flow `TeacherAuth.tsx` qui utilise
// `supabase.auth.updateUser({email})` côté client pour PROMOUVOIR une session
// anonymous vers une session prof. Ici, c'est un vrai `signInWithOtp` serveur.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAcademicEmail } from "@/lib/auth/academic-domains";
import { jsonError } from "@/lib/api/responses";

export const runtime = "nodejs";

const BodySchema = z.object({
  email: z
    .string()
    .email()
    .max(254)
    .transform((s) => s.trim().toLowerCase()),
});

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const parsed = BodySchema.safeParse(payload);
  if (!parsed.success) {
    return jsonError(400, "validation", parsed.error.flatten());
  }
  const { email } = parsed.data;

  if (!isAcademicEmail(email)) {
    return NextResponse.json(
      {
        error: "not_academic",
        message:
          "Adresse email académique requise (@ac-*.fr, @education.gouv.fr, @ac-polynesie.pf, @ac-noumea.nc, @ac-wf.wf).",
      },
      { status: 403 },
    );
  }

  const origin = request.nextUrl.origin;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/tableau-de-bord`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    // Log côté serveur mais on masque au client (anti-énumération)
    console.error(
      `[teacher-magic-link] supabase error for ${email}:`,
      error.message,
    );
  }

  // Réponse toujours 200 opaque : ne révèle pas si l'email existait déjà
  return NextResponse.json({ ok: true });
}
