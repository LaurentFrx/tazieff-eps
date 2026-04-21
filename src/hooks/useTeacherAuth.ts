"use client";

// Phase E.2.2 — Hook auth prof basé sur magic link académique.
//
// Cohabite avec `useAuth()` (context anonymous élève) sans conflit :
//   - `useAuth()` fournit le user courant (anonymous OU prof) via Supabase
//   - `useTeacherAuth()` fournit le même user + helpers signin/signout prof
//   - `isTeacher = !!user?.email && isAcademicEmail(user.email)`
//
// Le user peut être :
//   1. null (non connecté du tout, rare — AuthProvider sign-in automatiquement
//      anonymous au chargement)
//   2. anonymous élève (`is_anonymous: true`)
//   3. prof académique (`email` académique + `is_anonymous: false`)
//
// signInWithEmail() déclenche le POST /api/auth/teacher-magic-link. On ne gère
// PAS le retour direct — l'utilisateur reçoit un email, clique, revient via
// /auth/callback qui établit la session. Le `onAuthStateChange` dans
// `AuthProvider` mettra alors le context à jour, et ce hook reflétera l'état.

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isAcademicEmail } from "@/lib/auth/academic-domains";

export type TeacherAuthState = {
  /** User courant (anonymous, prof, ou null). */
  user: User | null;
  /** `true` si l'email du user est académique. */
  isTeacher: boolean;
  /** `true` tant que la session Supabase n'a pas été résolue. */
  isLoading: boolean;
  /**
   * Demande un magic link via POST /api/auth/teacher-magic-link.
   * Résout avec `{ok: true}` même si Supabase a raté (anti-énumération).
   * Résout avec `{ok: false, error}` uniquement sur erreur client (400/403/réseau).
   */
  signInWithEmail: (email: string) => Promise<{ ok: boolean; error?: string }>;
  /** Déconnexion Supabase. Après coup, AuthProvider fera un re-anon sign-in automatique. */
  signOut: () => Promise<void>;
};

export function useTeacherAuth(): TeacherAuthState {
  const { user, isLoading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  const isTeacher = !!(user?.email && isAcademicEmail(user.email));

  const signInWithEmail = useCallback(
    async (email: string): Promise<{ ok: boolean; error?: string }> => {
      setSigningIn(true);
      try {
        const response = await fetch("/api/auth/teacher-magic-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (response.status === 403) {
          const body = await response.json().catch(() => ({}));
          return {
            ok: false,
            error:
              body?.message ?? "Email non académique. Utilisez @ac-*.fr.",
          };
        }
        if (!response.ok) {
          return { ok: false, error: `HTTP ${response.status}` };
        }
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Erreur réseau",
        };
      } finally {
        setSigningIn(false);
      }
    },
    [],
  );

  const signOut = useCallback(async (): Promise<void> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    // AuthProvider.onAuthStateChange captera l'event et fera re-sign-in anon.
  }, []);

  // Effet purement cosmétique : log dev pour aider à diagnostiquer quand
  // on passe de "anonymous" à "teacher" en preview. Retiré en prod.
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && user?.email && isTeacher) {
      // eslint-disable-next-line no-console
      console.info("[useTeacherAuth] prof connecté :", user.email);
    }
  }, [user, isTeacher]);

  return {
    user,
    isTeacher,
    isLoading: isLoading || signingIn,
    signInWithEmail,
    signOut,
  };
}
