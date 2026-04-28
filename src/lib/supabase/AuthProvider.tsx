"use client";

// Sprint A3 — AuthProvider est désormais un alias d'IdentityProvider en
// mode="eleve". Conservé pour compat avec les ~5 consommateurs (useAuth,
// AppProviders) qui dépendent du context typé { user, isLoading, isAnonymous }.
//
// Nouveau code : préférer IdentityProvider + useIdentity / useStudentSession
// (cf. src/lib/auth/IdentityContext.tsx + src/lib/auth/sessions.ts).
//
// Cause racine traitée (audit-cc 2026-04-28 PS3) : 4 providers d'auth
// distincts → 1 provider unifié paramétré par mode.

import { createContext, useMemo, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import {
  IdentityProvider,
  useIdentity,
} from "@/lib/auth/IdentityContext";

export type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAnonymous: boolean;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAnonymous: false,
});

/**
 * Adapter qui mappe l'Identity unifié vers l'ancienne forme AuthContextValue.
 * Conservé pour ne pas casser les consommateurs `useAuth()` existants.
 */
function AuthContextAdapter({ children }: { children: ReactNode }) {
  const identity = useIdentity();
  const value = useMemo<AuthContextValue>(
    () => ({
      user: identity.user,
      isLoading: identity.isLoading,
      // ATTENTION : `isAnonymous` reflète user.is_anonymous (drapeau Supabase
      // explicite), pas le rôle "anonymous" dérivé. Quand user est null
      // (cas disableAnonymousFallback=true sans session), on retourne false
      // pour préserver le contrat historique testé en P0.7-septies :
      // « user null → isAnonymous=false (on ne sait pas) ».
      isAnonymous: !!identity.user?.is_anonymous,
    }),
    [identity.user, identity.isLoading],
  );
  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

type AuthProviderProps = {
  children: ReactNode;
  /**
   * P0.7-septies — Désactive le fallback `signInAnonymously()` quand aucune
   * session n'est trouvée. Propagé tel quel à IdentityProvider.
   *
   * Cf. GOUVERNANCE_EDITORIALE.md §2.1, §3.1.
   */
  disableAnonymousFallback?: boolean;
};

export function AuthProvider({
  children,
  disableAnonymousFallback = false,
}: AuthProviderProps) {
  return (
    <IdentityProvider
      mode="eleve"
      disableAnonymousFallback={disableAnonymousFallback}
    >
      <AuthContextAdapter>{children}</AuthContextAdapter>
    </IdentityProvider>
  );
}
