"use client";

// Sprint A3 — Hooks spécialisés par mode (élève / prof / admin).
//
// Tous dérivent de useIdentity() et exposent les actions spécifiques au mode :
//   - useStudentSession : signOut soft (re-anonymous fallback)
//   - useTeacherSession : signInWithEmail magic-link académique + signOut
//   - useAdminSession   : signOut + helpers admin
//
// Garde-fou : chaque hook vérifie le mode du provider monté et throw si
// utilisé hors contexte (ex : useAdminSession() depuis l'espace élève).
// Cf. assertIdentityMode dans IdentityContext.tsx.

import { useCallback, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isAcademicEmail } from "@/lib/auth/academic-domains";
import {
  useIdentity,
  assertIdentityMode,
  type Identity,
} from "@/lib/auth/IdentityContext";

/* ── Types partagés (anciennement dans useTeacherAuth.ts) ────────────── */

/**
 * Résultat d'une demande de magic-link prof. Le pré-check serveur retourne
 * `eligible: true` si l'email est académique reconnu (pas de leak sur
 * l'existence d'un compte). Si eligible, le client déclenche signInWithOtp
 * et `ok` reflète la réussite réseau.
 */
export type TeacherSignInResult = {
  /** True si pré-check + signInWithOtp se sont déroulés sans erreur réseau. */
  ok: boolean;
  /** True si l'email est académique (donc magic link envoyé). */
  eligible: boolean;
  /** Message d'erreur réseau / Supabase. Vide en cas de succès. */
  error?: string;
};

/* ── useStudentSession ───────────────────────────────────────────────── */

export type StudentSession = Identity & {
  signOut: () => Promise<void>;
};

export function useStudentSession(): StudentSession {
  const identity = useIdentity();
  assertIdentityMode(identity, "eleve");

  const signOut = useCallback(async (): Promise<void> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    // L'IdentityProvider mode="eleve" écoutera onAuthStateChange et
    // re-déclenchera signInAnonymously si disableAnonymousFallback=false.
  }, []);

  return { ...identity, signOut };
}

/* ── useTeacherSession ───────────────────────────────────────────────── */

export type TeacherSession = Identity & {
  /**
   * Demande un magic link via flow client-initié (P0.8) :
   *   1. POST /api/auth/teacher-magic-link → pré-check d'éligibilité.
   *   2. Si eligible → signInWithOtp côté navigateur (verifier PKCE posé
   *      directement dans les cookies du host).
   *   3. Sinon → on n'envoie pas de magic link, on remonte eligible:false.
   */
  signInWithEmail: (email: string) => Promise<TeacherSignInResult>;
  signOut: () => Promise<void>;
  /** True si l'email courant est académique reconnu. */
  isTeacher: boolean;
};

export function useTeacherSession(): TeacherSession {
  const identity = useIdentity();
  assertIdentityMode(identity, "prof");
  const [signingIn, setSigningIn] = useState(false);

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
    // IdentityProvider.onAuthStateChange captera l'event → state cleared.
    // PAS de re-sign-in anonymous (différence clé avec l'espace élève).
  }, []);

  const isTeacher = !!(
    identity.user?.email && isAcademicEmail(identity.user.email)
  );

  return {
    ...identity,
    isLoading: identity.isLoading || signingIn,
    signInWithEmail,
    signOut,
    isTeacher,
  };
}

/* ── useAdminSession ─────────────────────────────────────────────────── */

export type AdminSession = Identity & {
  signOut: () => Promise<void>;
};

export function useAdminSession(): AdminSession {
  const identity = useIdentity();
  assertIdentityMode(identity, "admin");

  const signOut = useCallback(async (): Promise<void> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  return { ...identity, signOut };
}
