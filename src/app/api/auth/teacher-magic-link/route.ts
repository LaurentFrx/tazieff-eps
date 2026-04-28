// Phase E.2.2 + Sprint P0.8 — Pré-check d'éligibilité magic-link prof.
//
// P0.8 : la route ne déclenche plus signInWithOtp côté serveur. Elle vérifie
// uniquement que l'email a un domaine académique reconnu et retourne
// 200 { eligible: boolean }. Le signInWithOtp PKCE est déclenché côté
// navigateur par useTeacherSession / useTeacherAuth pour permettre au SDK
// @supabase/ssr de poser le verifier directement dans les cookies du host.
//
// Anti-leak : la réponse est toujours 200 (200 { eligible: false } pour les
// emails non académiques au lieu d'un 403). Le composant client peut
// néanmoins afficher un message différencié subtil — l'éligibilité ne révèle
// que le format de l'email, pas l'existence d'un compte.
//
// Délai constant 1.5s avant retour, pour empêcher l'énumération via timing.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAcademicEmail } from "@/lib/auth/academic-domains";
import { jsonError } from "@/lib/api/responses";
import { constantResponseDelay } from "@/lib/auth/constantDelay";

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

  const delay = constantResponseDelay(1500);
  const eligible = isAcademicEmail(email);
  await delay;

  return NextResponse.json({ eligible });
}
