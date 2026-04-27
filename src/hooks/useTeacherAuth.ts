"use client";

// Phase E.2.2 + Sprint P0.8 — Hook auth prof basé sur magic link académique.
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
// P0.8 : signInWithEmail() effectue désormais le flow client-initié canonique :
//   1. POST /api/auth/teacher-magic-link → pré-check d'éligibilité serveur
//   2. Si eligible → signInWithOtp côté navigateur (verifier PKCE posé
//      directement dans les cookies du host courant, pas via Set-Cookie
//      serveur — corrige le bug "PKCE code verifier not found in storage").
//   3. Si non eligible → on n'envoie pas de magic link, on remonte
//      `eligible: false` au composant qui décide du message à afficher.

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isAcademicEmail } from "@/lib/auth/academic-domains";

export type TeacherSignInResult = {
  /** `true` si le pré-check + signInWithOtp se sont déroulés sans erreur réseau. */
  ok: boolean;
  /** `true` si l'email est académique (donc magic link envoyé). */
  eligible: boolean;
  /** Message d'erreur réseau / Supabase. Vide en cas de succès. */
  error?: string;
};

export type TeacherAuthState = {
  user: User | null;
  isTeacher: boolean;
  isLoading: boolean;
  /**
   * Demande un magic link via flow client-initié.
   * Cf. {@link TeacherSignInResult}.
   */
  signInWithEmail: (email: string) => Promise<TeacherSignInResult>;
  signOut: () => Promise<void>;
};

export function useTeacherAuth(): TeacherAuthState {
  const { user, isLoading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  const isTeacher = !!(user?.email && isAcademicEmail(user.email));

  const signInWithEmail = useCallback(
    async (email: string): Promise<TeacherSignInResult> => {
      setSigningIn(true);
      try {
        const response = await fetch("/api/auth/teacher-magic-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email }),
        });
        if (!response.ok) {
          return {
            ok: false,
            eligible: false,
            error: `HTTP ${response.status}`,
          };
        }
        const body = (await response.json().catch(() => ({}))) as {
          eligible?: boolean;
        };
        const eligible = body.eligible === true;

        if (eligible) {
          const supabase = getSupabaseBrowserClient();
          if (!supabase) {
            return {
              ok: false,
              eligible: true,
              error: "Supabase indisponible côté navigateur.",
            };
          }
          const { error: otpError } = await supabase.auth.signInWithOtp({
            email: email.trim().toLowerCase(),
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback?next=/tableau-de-bord`,
              shouldCreateUser: true,
            },
          });
          if (otpError) {
            return { ok: false, eligible: true, error: otpError.message };
          }
        }

        return { ok: true, eligible };
      } catch (err) {
        return {
          ok: false,
          eligible: false,
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
