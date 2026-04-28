"use client";

// Sprint A3 — TeacherAuthProvider est désormais un alias d'IdentityProvider
// en mode="prof". Conservé pour compat avec /prof/layout.tsx qui le monte,
// et le hook useTeacherAuthContext() (re-export de useIdentity sous l'ancien
// type `TeacherAuthContextValue`).
//
// Nouveau code : préférer IdentityProvider mode="prof" + useTeacherSession()
// (cf. src/lib/auth/IdentityContext.tsx + src/lib/auth/sessions.ts).
//
// Différence fonctionnelle préservée vs AuthProvider (espace élève) :
//   - Pas de signInAnonymously au montage (effectiveDisable = true)
//   - Évite le bug E.2.2 où l'anonymous session faisait interpréter
//     signInWithOtp comme un "Confirm Email Change" (updateUser-like).

import { useMemo, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import {
  IdentityProvider,
  useIdentity,
} from "@/lib/auth/IdentityContext";

export type TeacherAuthContextValue = {
  /** User Supabase courant ou null. Pas d'anonymous sur l'espace prof. */
  user: User | null;
  /** True tant que la session n'a pas été résolue. */
  isLoading: boolean;
};

export function TeacherAuthProvider({ children }: { children: ReactNode }) {
  return (
    <IdentityProvider mode="prof" disableAnonymousFallback>
      {children}
    </IdentityProvider>
  );
}

/**
 * Hook de consommation — alias de useIdentity() restreint au mode prof.
 *
 * Ne PAS confondre avec `useTeacherAuth()` (zombie supprimé en A3). Le hook
 * de référence pour l'espace prof est désormais `useTeacherSession()` dans
 * `@/lib/auth/sessions`, qui expose en plus signInWithEmail / signOut.
 */
export function useTeacherAuthContext(): TeacherAuthContextValue {
  const identity = useIdentity();
  return useMemo<TeacherAuthContextValue>(
    () => ({ user: identity.user, isLoading: identity.isLoading }),
    [identity.user, identity.isLoading],
  );
}
