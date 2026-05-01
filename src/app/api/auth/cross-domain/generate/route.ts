// Sprint C1 — POST /api/auth/cross-domain/generate
//
// Génère un token éphémère permettant à l'utilisateur authentifié sur le
// sous-domaine source de switcher vers un autre sous-domaine sans nouveau
// magic-link. Préserve l'isolation E.2.3.8 : aucun cookie partagé n'est
// posé. Le token transite uniquement dans l'URL de redirection et est
// consommé en 30 secondes max via /api/auth/cross-domain/consume.
//
// Référence : GOUVERNANCE_EDITORIALE.md §2 (UI sans privilège), §7
// (isolation host-only). Migration C1 (auth_cross_domain_tokens).
//
// Sécurité :
//   1. Vérifie que l'utilisateur est authentifié (cookie sb-* sur ce host).
//   2. Vérifie que target_host est whitelisté (les 6 hosts officiels).
//   3. Vérifie que le rôle target est dans les rôles accessibles du user
//      (super_admin = all, teacher = eleve+prof, student = eleve only).
//   4. Capture client_ip (X-Forwarded-For) + client_user_agent pour
//      binding strict côté /consume.
//   5. Token = crypto.randomBytes(32).toString('hex') — 256 bits d'entropie.
//   6. INSERT via service_role (RLS deny-all sur la table).
//
// Anti-leak : la réponse ne révèle rien sur l'existence d'autres comptes
// ou d'autres rôles. Si l'utilisateur n'est pas autorisé, on retourne 403
// sans détail.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/api/responses";
import {
  buildConsumeUrl,
  computeAccessibleRoles,
  extractClientIp,
  extractUserAgent,
  hostToRole,
  insertCrossDomainToken,
  isAllowedHost,
  sanitizeTargetPath,
} from "@/lib/auth/crossDomain";

export const runtime = "nodejs";

const BodySchema = z.object({
  target_host: z.string().min(1).max(100),
  target_path: z.string().max(1024).optional(),
});

export async function POST(request: NextRequest) {
  // 1) Validation du body.
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    raw = null;
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, "validation", parsed.error.flatten());
  }
  const { target_host } = parsed.data;
  const target_path = sanitizeTargetPath(parsed.data.target_path ?? "/");

  // 2) Whitelist du host cible (open-redirect protection).
  if (!isAllowedHost(target_host)) {
    return jsonError(400, "validation", { target_host: "not_allowed" });
  }

  // 3) Authentification : on doit avoir un user authentifié non-anonymous
  //    sur ce sous-domaine.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) {
    return jsonError(401, "unauthenticated");
  }

  // 4) Vérification d'autorisation : le rôle cible doit être dans la liste
  //    des rôles accessibles au user.
  const accessibleRoles = await computeAccessibleRoles(supabase, user);
  const targetRole = hostToRole(target_host);
  if (!accessibleRoles.includes(targetRole)) {
    return jsonError(403, "forbidden");
  }

  // 5) Refus si le host source = host cible (cas qui ne devrait pas
  //    arriver depuis l'UI mais qui bloque les abus). On ne génère pas
  //    de token pour rester sur le même host.
  const source_host = request.headers.get("host") ?? "";
  if (source_host === target_host) {
    return jsonError(400, "validation", { target_host: "same_host" });
  }

  // 6) Génération du token + capture du contexte réseau.
  const token = randomBytes(32).toString("hex");
  const client_ip = extractClientIp(request.headers);
  const client_user_agent = extractUserAgent(request.headers);

  try {
    await insertCrossDomainToken({
      user_id: user.id,
      token,
      source_host,
      target_host,
      target_path,
      client_ip,
      client_user_agent,
    });
  } catch (err) {
    console.error(
      "[cross-domain/generate] insert failed:",
      err instanceof Error ? err.message : String(err),
    );
    return jsonError(500, "internal");
  }

  // 7) URL de redirection vers /consume sur le sous-domaine cible.
  const redirect_url = buildConsumeUrl(target_host, token, target_path);
  return NextResponse.json({ redirect_url });
}
