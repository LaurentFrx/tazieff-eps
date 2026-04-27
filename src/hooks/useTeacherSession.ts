"use client";

// Phase E.2.2.5 + Sprint P0.8 — Hook d'auth prof dédié au sous-domaine
// prof.muscu-eps.fr.
//
// Différence avec `useTeacherAuth` (E.2.2, espace élève / flow hérité) :
//   - `useTeacherAuth` utilise AuthContext (anonymous élève) → ne convient pas
//     au sous-domaine prof où ce context n'est PAS monté
//   - `useTeacherSession` utilise TeacherAuthContext de TeacherAuthProvider
//     (E.2.2.5) → fonctionne correctement sur le sous-domaine prof
//
// Interface identique (signInWithEmail, signOut, isTeacher) pour éviter la
// friction d'apprentissage et permettre une future unification.
//
// P0.8 : flow client-initié canonique (cf. useTeacherAuth.ts pour le détail
// du fix PKCE). signInWithEmail retourne désormais `{ ok, eligible, error }`.

import { useCallback, useState } from "react";
import { useTeacherAuthContext } from "@/lib/supabase/TeacherAuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isAcademicEmail } from "@/lib/auth/academic-domains";
import type { User } from "@supabase/supabase-js";
import type { TeacherSignInResult } from "@/hooks/useTeacherAuth";

export type TeacherSessionState = {
  user: User | null;
  isTeacher: boolean;
  isLoading: boolean;
  signInWithEmail: (email: string) => Promise<TeacherSignInResult>;
  signOut: () => Promise<void>;
};

export function useTeacherSession(): TeacherSessionState {
  const { user, isLoading } = useTeacherAuthContext();
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
    // TeacherAuthProvider.onAuthStateChange captera l'event → state cleared.
    // PAS de re-sign-in anonymous (différence clé avec l'espace élève).
  }, []);

  return {
    user,
    isTeacher,
    isLoading: isLoading || signingIn,
    signInWithEmail,
    signOut,
  };
}
