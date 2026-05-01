import "server-only";

// Sprint C1 — Auto-login cross-domain via token éphémère.
//
// Helpers partagés entre les routes /api/auth/cross-domain/{generate,consume}.
// Couvre :
//   - Whitelist des hosts cibles autorisés (prod / preview / dev).
//   - Mapping host → rôle de sous-domaine.
//   - Calcul des rôles accessibles pour un user (super_admin = 3, teacher = 2,
//     autre = 1 = élève uniquement, pas d'auto-login pour les élèves simples
//     car ils ne sont autorisés que sur l'espace élève de toute façon).
//   - Extraction de l'IP et du User-Agent depuis la requête.
//
// La table `auth_cross_domain_tokens` n'étant pas dans le type Database
// auto-généré (créée en migration C1, sans regen), on définit ici un type
// local strict pour les opérations qu'on fait.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAcademicEmail } from "@/lib/auth/academic-domains";
import { isAdminHost, isProfHost } from "@/lib/admin-hosts";
import type { SupabaseClient, User } from "@supabase/supabase-js";

/* ── Types locaux ────────────────────────────────────────────────────── */

export type CrossDomainRole = "eleve" | "prof" | "admin";

export type CrossDomainTokenRow = {
  id: string;
  user_id: string;
  token: string;
  source_host: string;
  target_host: string;
  target_path: string;
  client_ip: string;
  client_user_agent: string;
  created_at: string;
  expires_at: string;
  consumed_at: string | null;
};

/* ── Whitelist hosts ─────────────────────────────────────────────────── */

const PROD_HOSTS = new Set<string>([
  "muscu-eps.fr",
  "prof.muscu-eps.fr",
  "admin.muscu-eps.fr",
]);

const PREVIEW_HOSTS = new Set<string>([
  "design.muscu-eps.fr",
  "design-prof.muscu-eps.fr",
  "design-admin.muscu-eps.fr",
]);

/**
 * Vérifie qu'un host est dans la whitelist des sous-domaines connus de
 * l'app. Couvre prod, preview et dev local.
 *
 * Les hosts dev sont reconnus par leur suffixe `localhost[:port]` ou
 * `prof.localhost[:port]` / `admin.localhost[:port]`. Le port est libre
 * car le dev tourne sur un port variable (extractPort dans env.ts).
 */
export function isAllowedHost(host: string): boolean {
  if (PROD_HOSTS.has(host) || PREVIEW_HOSTS.has(host)) return true;
  // Dev local — accepte localhost:*, prof.localhost:*, admin.localhost:*.
  if (host === "localhost" || host.startsWith("localhost:")) return true;
  if (host.startsWith("prof.localhost") || host.startsWith("admin.localhost")) {
    return true;
  }
  return false;
}

/**
 * Mappe un host autorisé vers le rôle de sous-domaine correspondant.
 * Suppose `isAllowedHost(host)` true (sinon retourne "eleve" par défaut,
 * ce qui est conservateur).
 */
export function hostToRole(host: string): CrossDomainRole {
  if (isAdminHost(host)) return "admin";
  if (isProfHost(host)) return "prof";
  return "eleve";
}

/* ── Calcul des rôles accessibles ────────────────────────────────────── */

/**
 * Retourne la liste des rôles de sous-domaine accessibles pour un user
 * authentifié. Aligné sur deriveAvailableRoles côté UI.
 *
 *   super_admin / admin → ["eleve", "prof", "admin"]
 *   teacher (email académique) → ["eleve", "prof"]
 *   student (authentifié non académique) → ["eleve"]
 *   anonymous (pas appelé ici, l'API rejette en amont) → []
 *
 * Le SELECT sur app_admins passe par le client utilisateur fourni : la
 * policy RLS app_admins_select_admins (P0.2) autorise les admins à se lire
 * eux-mêmes. Pour un non-admin, la policy renvoie une row vide.
 */
export async function computeAccessibleRoles(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  user: User,
): Promise<CrossDomainRole[]> {
  if (user.is_anonymous) return [];

  const { data: adminRow } = await supabase
    .from("app_admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = (adminRow as { role?: string } | null)?.role;
  if (role === "super_admin" || role === "admin") {
    return ["eleve", "prof", "admin"];
  }

  if (user.email && isAcademicEmail(user.email)) {
    return ["eleve", "prof"];
  }

  return ["eleve"];
}

/* ── Extraction IP / User-Agent ──────────────────────────────────────── */

/**
 * Extrait l'IP client depuis les headers de la requête. Gère le cas du
 * proxy Vercel (X-Forwarded-For) et le fallback sur x-real-ip.
 *
 * X-Forwarded-For peut contenir plusieurs IPs séparées par virgules :
 * la première est l'IP client originelle (cf. RFC 7239).
 */
export function extractClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

/**
 * Extrait le User-Agent en bornant la longueur à 500 caractères pour
 * éviter qu'un client malveillant pollue la BD avec un UA gigantesque.
 */
export function extractUserAgent(headers: Headers): string {
  const ua = headers.get("user-agent") ?? "unknown";
  return ua.slice(0, 500);
}

/* ── Validation du target_path ───────────────────────────────────────── */

/**
 * Normalise un chemin de redirection : doit commencer par /, max 1024
 * chars, pas de protocole ni de host (open-redirect protection).
 *
 * Retourne "/" si le path est invalide (fail-safe).
 */
export function sanitizeTargetPath(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.length > 1024) return "/";
  // Protection open-redirect : un path commençant par // est interprété
  // comme un host par le navigateur.
  if (raw.startsWith("//")) return "/";
  return raw;
}

/* ── Opérations BD (service_role, bypass RLS) ────────────────────────── */

/**
 * Insère un nouveau token dans auth_cross_domain_tokens via service_role.
 *
 * Throw si l'insertion échoue (collision, contrainte). Le caller doit
 * mapper l'erreur vers une réponse 500 — une collision sur le token
 * généré aléatoirement (crypto.randomBytes(32)) est statistiquement
 * négligeable, donc traitée comme une erreur infra.
 */
export async function insertCrossDomainToken(input: {
  user_id: string;
  token: string;
  source_host: string;
  target_host: string;
  target_path: string;
  client_ip: string;
  client_user_agent: string;
}): Promise<void> {
  const adminClient = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient as any)
    .from("auth_cross_domain_tokens")
    .insert(input);
  if (error) {
    throw new Error(`insertCrossDomainToken failed: ${error.message}`);
  }
}

/**
 * Cherche un token actif (non consommé, non expiré) par sa valeur.
 * Retourne la row complète ou null.
 *
 * Bypass RLS via service_role.
 */
export async function findActiveToken(
  token: string,
): Promise<CrossDomainTokenRow | null> {
  const adminClient = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any)
    .from("auth_cross_domain_tokens")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (error || !data) return null;
  return data as CrossDomainTokenRow;
}

/**
 * Marque un token comme consommé (consumed_at = now). Idempotent : si déjà
 * consommé, retourne false sans erreur. Le caller doit traiter le retour
 * false comme un cas "token already used" (replay attaqué).
 */
export async function markTokenConsumed(tokenId: string): Promise<boolean> {
  const adminClient = createSupabaseAdminClient();
  // Update conditionnel : on n'update que si consumed_at IS NULL pour éviter
  // les races (deux requêtes simultanées sur le même token).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any)
    .from("auth_cross_domain_tokens")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", tokenId)
    .is("consumed_at", null)
    .select("id")
    .maybeSingle();
  if (error || !data) return false;
  return true;
}

/* ── URL builders ────────────────────────────────────────────────────── */

/**
 * Détermine le protocole en fonction de l'host. localhost → http, sinon https.
 * Aligné avec resolveEnv côté client.
 */
export function protocolForHost(host: string): "http" | "https" {
  if (host === "localhost" || host.startsWith("localhost:")) return "http";
  if (host.startsWith("prof.localhost") || host.startsWith("admin.localhost")) {
    return "http";
  }
  return "https";
}

/**
 * Construit l'URL de consume sur le sous-domaine cible.
 */
export function buildConsumeUrl(
  targetHost: string,
  token: string,
  targetPath: string,
): string {
  const proto = protocolForHost(targetHost);
  const url = new URL(`${proto}://${targetHost}/api/auth/cross-domain/consume`);
  url.searchParams.set("token", token);
  url.searchParams.set("path", targetPath);
  return url.toString();
}
