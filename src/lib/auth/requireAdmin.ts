// Phase P0.1 — Helper serveur : exiger un compte super_admin ou admin
// authentifié pour toute écriture sur la couche override (catalogue officiel).
//
// Référence : GOUVERNANCE_EDITORIALE.md §3.1, §7.
// Skill : .claude/skills/gouvernance-editoriale/SKILL.md (règle 1, règle 2).
//
// API :
//   - requireAdmin(supabase) → throw AuthError(401|403) si non authentifié /
//     non admin, sinon retourne { user, role }.
//   - isAdminUser(userId, supabase) → variant lookup pur, sans throw, qui
//     retourne { is_super_admin, is_admin } (utilisé par /api/me/role).
//
// Le caller (route handler) catch AuthError et choisit le format de réponse
// (NextResponse JSON ici, autre chose ailleurs).

import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type AdminRole = "super_admin" | "admin";

export class AuthError extends Error {
  status: 401 | 403;
  code: "unauthenticated" | "forbidden";

  constructor(status: 401 | 403, code: "unauthenticated" | "forbidden", message?: string) {
    super(message ?? code);
    this.status = status;
    this.code = code;
    this.name = "AuthError";
  }
}

/**
 * Garde-fou pour les routes qui exigent un compte super_admin / admin.
 *
 * Throw {@link AuthError} :
 *   - 401 `unauthenticated` si pas de user authentifié (pas de session cookie)
 *   - 403 `forbidden` si user authentifié mais absent de `app_admins`
 *
 * Sinon retourne `{ user, role }`.
 *
 * Le SELECT sur `app_admins` passe par le client utilisateur — la policy RLS
 * `app_admins_select_admins` (P0.2) autorise déjà les admins à lire la table,
 * donc pas besoin d'un service client. La fonction respecte le principe de
 * moindre privilège (pas de bypass RLS).
 */
export async function requireAdmin(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
): Promise<{ user: User; role: AdminRole }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new AuthError(401, "unauthenticated");
  }

  const { data, error } = await supabase
    .from("app_admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    // RLS peut renvoyer une row vide plutôt qu'une erreur. Une vraie erreur
    // ici (ex. table absente, contrainte) est traitée comme "non admin"
    // pour éviter d'exposer des détails infra.
    throw new AuthError(403, "forbidden");
  }

  if (!data || (data.role !== "super_admin" && data.role !== "admin")) {
    throw new AuthError(403, "forbidden");
  }

  return { user, role: data.role as AdminRole };
}

/**
 * Lookup pur du statut admin pour un user donné. Ne throw jamais, retourne
 * toujours un objet booléen. Conçu pour `/api/me/role` qui doit répondre 200
 * même pour un anonyme (pas de leak d'information).
 *
 * Le SELECT passe par le client fourni (typiquement `createSupabaseServerClient`
 * → policy RLS `app_admins_select_admins`). Si l'utilisateur n'est pas admin,
 * la policy lui renvoie une row vide → `{ is_super_admin: false, is_admin: false }`.
 */
export async function isAdminUser(
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
): Promise<{ is_super_admin: boolean; is_admin: boolean }> {
  if (!userId) {
    return { is_super_admin: false, is_admin: false };
  }
  const { data, error } = await supabase
    .from("app_admins")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return { is_super_admin: false, is_admin: false };
  }

  const isSuperAdmin = data.role === "super_admin";
  const isAdmin = isSuperAdmin || data.role === "admin";
  return { is_super_admin: isSuperAdmin, is_admin: isAdmin };
}
