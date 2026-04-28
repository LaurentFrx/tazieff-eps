"use client";

// Sprint A3 — AdminAuthProvider est désormais un alias d'IdentityProvider
// en mode="admin". Conservé pour compat avec /admin/layout.tsx qui le monte,
// et le hook useAdminAuthContext() (re-export de useIdentity sous l'ancien
// type `AdminAuthContextValue`).
//
// Nouveau code : préférer IdentityProvider mode="admin" + useAdminSession()
// (cf. src/lib/auth/IdentityContext.tsx + src/lib/auth/sessions.ts).
//
// Calque sur TeacherAuthProvider : pas de signInAnonymously au mount.
// Spécificité admin : l'IdentityProvider hydrate isAdmin / isSuperAdmin via
// fetch /api/me/role, refetché à chaque changement de session.

import { useMemo, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import {
  IdentityProvider,
  useIdentity,
} from "@/lib/auth/IdentityContext";

export type AdminAuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  return (
    <IdentityProvider mode="admin" disableAnonymousFallback>
      {children}
    </IdentityProvider>
  );
}

/**
 * Hook de consommation du AdminAuthContext. À utiliser dans tout
 * composant du sous-arbre /admin/*. Délègue désormais à useIdentity()
 * (Sprint A3).
 */
export function useAdminAuthContext(): AdminAuthContextValue {
  const identity = useIdentity();
  return useMemo<AdminAuthContextValue>(
    () => ({
      user: identity.user,
      isLoading: identity.isLoading,
      isAdmin: identity.isAdmin,
      isSuperAdmin: identity.isSuperAdmin,
    }),
    [identity.user, identity.isLoading, identity.isAdmin, identity.isSuperAdmin],
  );
}
