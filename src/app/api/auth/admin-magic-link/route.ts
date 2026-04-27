// Sprint P0.7 + P0.8 — POST /api/auth/admin-magic-link
//
// P0.8 : pré-check d'éligibilité uniquement. Le signInWithOtp PKCE est
// déclenché côté navigateur par AdminLoginClient (cf. audit P0.8 : pattern
// canonique @supabase/ssr, le verifier est posé directement par le client
// sans dépendre du timing du Set-Cookie serveur).
//
// Anti-leak : la réponse est toujours 200 { eligible: boolean }, que l'email
// corresponde à un admin ou non. Délai artificiel constant de 1.5s avant
// retour pour empêcher l'énumération via timing attack.
//
// Référence : GOUVERNANCE_EDITORIALE.md §2.1, §2.2, §7.
//
// Note : on garde le service client UNIQUEMENT pour le lookup
// app_admins ⨝ auth.users, qui n'est pas exposé via RLS standard.
// Aucun cookie de session n'est posé ici.

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { constantResponseDelay } from "@/lib/auth/constantDelay";

export const runtime = "nodejs";

const BodySchema = z.object({
  email: z
    .string()
    .max(254)
    .transform((s) => s.trim().toLowerCase())
    .pipe(z.string().email()),
});

type AdminUserLookup = {
  user_id: string | null;
};

/**
 * Lookup robuste : on cherche dans app_admins l'utilisateur dont l'email
 * (auth.users.email) correspond. Retourne true si admin trouvé.
 *
 * Le service client est utilisé exclusivement pour ce lookup en lecture
 * seule sur auth.users, qui n'est pas exposée via le client utilisateur.
 */
async function isEmailAdmin(email: string): Promise<boolean> {
  let serviceClient: ReturnType<typeof getSupabaseServiceClient>;
  try {
    serviceClient = getSupabaseServiceClient();
  } catch {
    return false;
  }

  const { data, error } = await serviceClient
    .from("app_admins")
    .select("user_id")
    .returns<AdminUserLookup[]>();

  if (error || !data || data.length === 0) {
    return false;
  }

  const userIds = data.map((row) => row.user_id).filter((id): id is string => Boolean(id));
  if (userIds.length === 0) return false;

  const { data: userData, error: userError } =
    await serviceClient.auth.admin.listUsers({
      perPage: 100,
    });
  if (userError || !userData?.users) {
    return false;
  }
  const matchingUser = userData.users.find(
    (u) => (u.email ?? "").toLowerCase() === email,
  );
  if (!matchingUser) return false;
  return userIds.includes(matchingUser.id);
}

export async function POST(request: Request) {
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

  // Lookup en parallèle du délai constant pour amortir le coût.
  const delay = constantResponseDelay(1500);

  let eligible = false;
  try {
    eligible = await isEmailAdmin(email);
  } catch (err) {
    console.error(
      "[admin-magic-link] admin lookup failed:",
      err instanceof Error ? err.message : String(err),
    );
    await delay;
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  await delay;
  return NextResponse.json({ eligible });
}
