// Sprint P0.7 — POST /api/auth/admin-magic-link
//
// Envoie un magic-link Supabase à un email présent dans la table app_admins.
// Anti-leak : la réponse est toujours 200 { ok: true } pour ne pas révéler
// si l'email existe ou non en base. Si l'email n'est pas un admin connu,
// AUCUN appel à signInWithOtp n'est fait (pas d'envoi d'email parasite).
//
// Choix d'implémentation : on utilise le service client pour le lookup
// `app_admins ⨝ auth.users` car la table `auth.users` n'est pas exposée
// aux clients via RLS standard. La route reste publique mais ne fait
// rien d'observable côté Supabase si l'email n'est pas admin.
//
// Référence : GOUVERNANCE_EDITORIALE.md §2.1, §2.2, §7.

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSupabaseServerClient,
  getSupabaseServiceClient,
} from "@/lib/supabase/server";

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

  // Lookup direct sur auth.users (accessible via service role).
  // L'API admin Supabase JS expose auth.admin.getUserById / listUsers ;
  // on utilise listUsers avec filtre email pour minimiser les calls.
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

  // 1. Lookup app_admins ⨝ auth.users via service client.
  let isAdmin: boolean;
  try {
    isAdmin = await isEmailAdmin(email);
  } catch (err) {
    console.error(
      "[admin-magic-link] admin lookup failed:",
      err instanceof Error ? err.message : String(err),
    );
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  // 2. Si non admin → réponse 200 opaque, pas d'envoi de magic-link.
  if (!isAdmin) {
    return NextResponse.json({ ok: true });
  }

  // 3. Admin reconnu → on envoie le magic-link via le client utilisateur
  //    (signInWithOtp ne nécessite pas le service role).
  const origin = new URL(request.url).origin;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/admin`,
      shouldCreateUser: false, // jamais créer un user via cette route
    },
  });

  if (error) {
    // Erreur Supabase réelle (rate limit, SMTP). On log mais on ne révèle
    // rien au client (anti-leak) → 500 générique.
    console.error("[admin-magic-link] supabase error:", error.message);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
