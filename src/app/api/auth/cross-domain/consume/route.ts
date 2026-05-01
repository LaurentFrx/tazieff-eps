// Sprint C1 — GET /api/auth/cross-domain/consume
//
// Consomme un token éphémère (généré par /api/auth/cross-domain/generate
// sur le sous-domaine source) et matérialise une session Supabase sur le
// sous-domaine cible. Les cookies sb-* sont posés HOST-ONLY (pas de
// Domain attribute), ce qui préserve l'isolation E.2.3.8.
//
// Stratégie de matérialisation de session :
//   1. service_role.auth.admin.generateLink({ type: 'magiclink', email })
//      retourne un token_hash consommable côté serveur sans envoi d'email.
//   2. createSupabaseServerClient().auth.verifyOtp({ type: 'email',
//      token_hash }) consomme le hash et déclenche setAll() sur les
//      cookies sb-*. Comme @supabase/ssr est configuré sans `domain`,
//      les cookies sont host-only — exactement ce qu'on veut.
//
// Sécurité :
//   - Token à usage unique (consumed_at marqué avant verifyOtp).
//   - Expiration 30s (rejet si dépassée).
//   - Binding strict client_ip + client_user_agent (rejet si discordance).
//   - Redirect vers /login?error=... en cas de failure (UX claire).
//
// Référence : GOUVERNANCE_EDITORIALE.md §2, §7. Migration C1.

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminHost, isProfHost } from "@/lib/admin-hosts";
import {
  extractClientIp,
  extractUserAgent,
  findActiveToken,
  markTokenConsumed,
  protocolForHost,
  sanitizeTargetPath,
} from "@/lib/auth/crossDomain";

export const runtime = "nodejs";

/**
 * Détermine le path d'entrée d'auth pour un host donné. L'app n'a pas un
 * /login unique : chaque sous-domaine a son entrée propre.
 *
 *   admin.* → /admin/login
 *   prof.*  → /connexion (réécrit en /prof/connexion par le proxy)
 *   élève   → /          (l'élève n'a pas de login dédié, il part de
 *                          l'accueil et accède à /enseignant si besoin)
 */
function loginPathForHost(host: string): string {
  if (isAdminHost(host)) return "/admin/login";
  if (isProfHost(host)) return "/connexion";
  return "/";
}

/**
 * Construit l'URL de redirection avec un error code, sur l'host courant.
 * UX cohérente : l'utilisateur reste sur le sous-domaine cible mais voit
 * un message d'erreur compréhensible (?cross_domain_error=...).
 */
function redirectToLogin(
  request: NextRequest,
  errorCode:
    | "invalid_token"
    | "token_already_used"
    | "token_expired"
    | "token_security"
    | "internal_error",
): NextResponse {
  const host = request.headers.get("host") ?? "";
  const proto = protocolForHost(host);
  const loginUrl = new URL(`${proto}://${host}${loginPathForHost(host)}`);
  loginUrl.searchParams.set("cross_domain_error", errorCode);
  return NextResponse.redirect(loginUrl, { status: 302 });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const targetPath = sanitizeTargetPath(
    request.nextUrl.searchParams.get("path"),
  );

  if (!token || token.length !== 64) {
    return redirectToLogin(request, "invalid_token");
  }

  // 1) Lookup du token via service_role.
  const tokenRow = await findActiveToken(token);
  if (!tokenRow) {
    return redirectToLogin(request, "invalid_token");
  }

  // 2) Vérifications temporelles.
  if (tokenRow.consumed_at !== null) {
    return redirectToLogin(request, "token_already_used");
  }
  const expiresAt = new Date(tokenRow.expires_at).getTime();
  if (Number.isNaN(expiresAt) || expiresAt < Date.now()) {
    return redirectToLogin(request, "token_expired");
  }

  // 3) Vérification du host cible : la requête doit arriver sur le bon
  //    sous-domaine. Sinon attaque (ex: token volé et ouvert ailleurs).
  const currentHost = request.headers.get("host") ?? "";
  if (currentHost !== tokenRow.target_host) {
    return redirectToLogin(request, "token_security");
  }

  // 4) Binding IP + User-Agent : empêche la réutilisation d'un token
  //    capturé en transit par un autre client.
  const ip = extractClientIp(request.headers);
  const ua = extractUserAgent(request.headers);
  if (ip !== tokenRow.client_ip || ua !== tokenRow.client_user_agent) {
    return redirectToLogin(request, "token_security");
  }

  // 5) Marquer le token comme consommé AVANT la matérialisation de session.
  //    Stratégie défensive : si verifyOtp échoue ensuite, le token reste
  //    consommé (un nouveau magic-link sera nécessaire), mais aucune session
  //    n'est leak.
  const marked = await markTokenConsumed(tokenRow.id);
  if (!marked) {
    // Race : un autre concurrent a consommé le token entre findActiveToken
    // et markTokenConsumed.
    return redirectToLogin(request, "token_already_used");
  }

  // 6) Récupérer l'email du user via service_role (lookup direct par PK).
  const adminClient = createSupabaseAdminClient();
  const { data: userResult, error: userError } =
    await adminClient.auth.admin.getUserById(tokenRow.user_id);
  if (userError || !userResult?.user?.email) {
    console.error(
      "[cross-domain/consume] getUserById failed:",
      userError?.message ?? "no user",
    );
    return redirectToLogin(request, "internal_error");
  }
  const userEmail = userResult.user.email;

  // 7) Générer un magic-link headless via service_role. La réponse contient
  //    un `properties.hashed_token` consommable via verifyOtp côté serveur.
  //    L'email N'EST PAS envoyé : on utilise uniquement la valeur retournée.
  const { data: linkData, error: linkError } =
    await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: userEmail,
    });
  if (linkError || !linkData?.properties?.hashed_token) {
    console.error(
      "[cross-domain/consume] generateLink failed:",
      linkError?.message ?? "no hashed_token",
    );
    return redirectToLogin(request, "internal_error");
  }
  const tokenHash = linkData.properties.hashed_token;

  // 8) Consommer le hash via createSupabaseServerClient. Le client
  //    @supabase/ssr est configuré pour appeler setAll() sur les cookies
  //    sb-* — sans `domain`, ils sont posés HOST-ONLY.
  const supabase = await createSupabaseServerClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "email",
    token_hash: tokenHash,
  });
  if (verifyError) {
    console.error(
      "[cross-domain/consume] verifyOtp failed:",
      verifyError.message,
    );
    return redirectToLogin(request, "internal_error");
  }

  // 9) Redirect vers le path demandé sur le sous-domaine courant.
  const proto = protocolForHost(currentHost);
  const finalUrl = new URL(`${proto}://${currentHost}${targetPath}`);
  return NextResponse.redirect(finalUrl, { status: 302 });
}
