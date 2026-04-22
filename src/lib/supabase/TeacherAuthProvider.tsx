"use client";

// Phase E.2.2.5 — Provider d'auth pour l'espace enseignant (sous-domaine prof).
//
// DIFFÉRENCE FONDAMENTALE avec AuthProvider (espace élève) :
//   - NE déclenche PAS `signInAnonymously()` au montage
//   - Écoute uniquement `onAuthStateChange` pour détecter les sessions magic link
//   - Expose un context dédié `TeacherAuthContext`
//
// Cela évite le bug E.2.2 où l'anonymous session préalable faisait interpréter
// le signInWithOtp comme un "Confirm Email Change" (updateUser-like).
//
// Utilisé par src/app/prof/layout.tsx uniquement. Le middleware garantit que
// ce layout est monté SEULEMENT sur les hosts prof.muscu-eps.fr et
// design-prof.muscu-eps.fr, jamais sur muscu-eps.fr/design.muscu-eps.fr.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./browser";

export type TeacherAuthContextValue = {
  /** User Supabase courant ou null. Pas d'anonymous sur l'espace prof. */
  user: User | null;
  /** True tant que la session n'a pas été résolue. */
  isLoading: boolean;
};

const TeacherAuthContext = createContext<TeacherAuthContextValue>({
  user: null,
  isLoading: true,
});

export function TeacherAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialisation : on lit la session existante (magic link déjà consommé)
  // mais on NE fait AUCUN sign-in automatique.
  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        setUser(data.session?.user ?? null);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Écoute des changements de session (retour depuis magic link, signOut, etc.)
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<TeacherAuthContextValue>(
    () => ({ user, isLoading }),
    [user, isLoading],
  );

  return (
    <TeacherAuthContext.Provider value={value}>
      {children}
    </TeacherAuthContext.Provider>
  );
}

/**
 * Hook de consommation du TeacherAuthContext. À utiliser dans tout composant
 * du sous-arbre /prof/* (layout, pages, composants enfants).
 *
 * Ne PAS confondre avec `useTeacherAuth()` de `src/hooks/useTeacherAuth.ts`
 * qui, lui, dépend du AuthContext anonymous (espace élève / flow hérité
 * TeacherAuth.tsx dans /reglages).
 */
export function useTeacherAuthContext(): TeacherAuthContextValue {
  return useContext(TeacherAuthContext);
}
