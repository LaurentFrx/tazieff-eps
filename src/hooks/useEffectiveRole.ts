"use client";

// Sprint fix-topbar-badges (30 avril 2026) — Hook qui retourne le rôle
// **effectif** de l'utilisateur, indépendant du `mode` du IdentityProvider.
//
// Pourquoi : le IdentityProvider est monté avec un `mode` figé selon le
// layout (mode="eleve" pour [locale]/, mode="prof" pour /prof, mode="admin"
// pour /admin). `refreshAdminRole()` (qui interroge /api/me/role) ne tourne
// que si mode==="admin" — donc sur le **miroir admin** (admin.muscu-eps.fr
// en pass-through du contenu élève, layout [locale] mode="eleve"), un
// super_admin authentifié voit son rôle redevenir "student" après le calcul.
//
// Symptôme corrigé : aucun pill ni section admin dans la TopBar pour un
// super_admin connecté navigant sur le miroir admin (audit Claude in Chrome
// 30 avril 2026).
//
// Solution : on combine useIdentity() (rôle déclaratif du provider) avec
// useAppAdmin() (fetch direct /api/me/role, indépendant du mode). Si le
// fetch confirme super_admin / admin, on upgrade le rôle ; sinon on garde
// celui du provider.
//
// Conformité GOUVERNANCE_EDITORIALE.md §2 : la présence d'une UI ne donne
// AUCUN privilège — c'est juste de l'affichage. Les permissions réelles
// sont vérifiées côté backend (RLS + requireAdmin + magic-link).

import { useAppAdmin } from "@/hooks/useAppAdmin";
import { useIdentity, type IdentityRole } from "@/lib/auth/IdentityContext";

export type UseEffectiveRoleResult = {
  role: IdentityRole;
  /** True tant qu'au moins une des deux sources est en chargement. */
  isLoading: boolean;
};

export function useEffectiveRole(): UseEffectiveRoleResult {
  const identity = useIdentity();
  const adminCheck = useAppAdmin();

  // Pendant le chargement (avant que /api/me/role ait répondu), on conserve
  // le rôle du IdentityContext pour ne pas faire clignoter l'UI. Le fetch
  // est non-bloquant (cache: no-store, mais asynchrone), donc le pire cas
  // est un upgrade visuel après ~50-200 ms.
  if (adminCheck.isLoading) {
    return {
      role: identity.role,
      isLoading: identity.isLoading || adminCheck.isLoading,
    };
  }

  // Upgrade : si le fetch a confirmé super_admin / admin, on remplace
  // le rôle déclaratif. Sinon on garde celui d'IdentityContext (qui peut
  // déjà valoir "teacher" si email académique, "student" si user
  // authentifié non académique, etc.).
  if (adminCheck.isSuperAdmin) {
    return { role: "super_admin", isLoading: false };
  }
  if (adminCheck.isAdmin) {
    return { role: "admin", isLoading: false };
  }

  return {
    role: identity.role,
    isLoading: identity.isLoading,
  };
}
