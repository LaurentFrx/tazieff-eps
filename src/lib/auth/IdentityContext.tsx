"use client";

// Sprint A3 — Source unique de vérité pour la session utilisateur côté client.
//
// Cause racine traitée (audit-cc 2026-04-28 PS3) : 4 contextes d'auth
// distincts (AuthProvider élève, TeacherAuthProvider, AdminAuthProvider,
// useAppAdmin) coexistaient avec 2 hooks signin quasi-identiques. Chaque
// sprint correctif touchait un seul des 4, garantissant la dérive.
//
// Cette implémentation expose UN provider unique paramétré par `mode`
// (eleve / prof / admin) et UN context unique `IdentityContext` qui produit
// la même Identity dans tous les sous-domaines :
//
//   { user, role, isLoading, mode, isSuperAdmin, isAcademic }
//
// Référence : GOUVERNANCE_EDITORIALE.md §2.1, §2.2, §2.3, §3.1.
// Skill : .claude/skills/gouvernance-editoriale/SKILL.md (règles 1, 6, 7).
//
// Migration : les anciens providers (AuthProvider, TeacherAuthProvider,
// AdminAuthProvider) délèguent désormais à IdentityProvider en passant le
// bon mode. Les anciens hooks (useAuth, useTeacherAuthContext,
// useAdminAuthContext) sont conservés comme alias pour compat (ils dérivent
// de useIdentity()) afin de ne pas casser les ~30 consommateurs existants.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isAcademicEmail } from "@/lib/auth/academic-domains";

/* ── Types publics ───────────────────────────────────────────────────── */

export type IdentityMode = "eleve" | "prof" | "admin";

export type IdentityRole =
  | "anonymous"
  | "student"
  | "teacher"
  | "admin"
  | "super_admin";

export type Identity = {
  /** User Supabase courant ou null. */
  user: User | null;
  /** Rôle dérivé (anonymous → super_admin). Calé sur GOUVERNANCE §2. */
  role: IdentityRole;
  /** True tant que la session n'a pas été résolue (premier fetch). */
  isLoading: boolean;
  /** Sous-domaine sur lequel le provider est monté. */
  mode: IdentityMode;
  /** Helper : true si role === "super_admin". */
  isSuperAdmin: boolean;
  /** Helper : true si role === "admin" || "super_admin". */
  isAdmin: boolean;
  /** Helper : true si user.email est académique reconnu. */
  isAcademic: boolean;
};

const DEFAULT_IDENTITY: Identity = {
  user: null,
  role: "anonymous",
  isLoading: true,
  mode: "eleve",
  isSuperAdmin: false,
  isAdmin: false,
  isAcademic: false,
};

const IdentityContext = createContext<Identity>(DEFAULT_IDENTITY);

/* ── Helpers internes ────────────────────────────────────────────────── */

/**
 * Calcule le rôle d'un user selon son état Supabase et le mode courant.
 *
 * - user null → anonymous (avant fallback signInAnonymously) OU loading
 * - user.is_anonymous === true → anonymous
 * - sur mode admin : appel /api/me/role pour distinguer admin / super_admin
 * - sur mode prof + email académique → teacher
 * - autres cas (user authentifié non admin/non académique) → student
 */
function deriveBaseRole(user: User | null): IdentityRole {
  if (!user) return "anonymous";
  if (user.is_anonymous) return "anonymous";
  if (user.email && isAcademicEmail(user.email)) return "teacher";
  return "student";
}

/* ── Provider unifié ─────────────────────────────────────────────────── */

type IdentityProviderProps = {
  children: ReactNode;
  /** Sous-domaine. Détermine le comportement par défaut. */
  mode: IdentityMode;
  /**
   * Désactive le fallback `signInAnonymously()` quand aucune session n'est
   * trouvée. Utile sur le miroir admin (cf. P0.7-septies) pour empêcher
   * l'écrasement des cookies admin par une session anonyme involontaire.
   *
   * Par défaut :
   *   - mode "eleve" → false (anonymous fallback ON)
   *   - mode "prof" → true (jamais d'anonymous sur l'espace prof)
   *   - mode "admin" → true (idem)
   */
  disableAnonymousFallback?: boolean;
};

export function IdentityProvider({
  children,
  mode,
  disableAnonymousFallback,
}: IdentityProviderProps) {
  // Convention : seul le mode "eleve" déclenche le fallback anonyme par défaut.
  // Les autres modes l'interdisent toujours.
  const effectiveDisable =
    disableAnonymousFallback ?? (mode !== "eleve");

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminFlag, setIsAdminFlag] = useState(false);
  const [isSuperAdminFlag, setIsSuperAdminFlag] = useState(false);

  /** Hydrate isAdmin / isSuperAdmin via /api/me/role. Mode admin uniquement. */
  const refreshAdminRole = useCallback(async (): Promise<void> => {
    if (mode !== "admin") {
      setIsAdminFlag(false);
      setIsSuperAdminFlag(false);
      return;
    }
    try {
      const response = await fetch("/api/me/role", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });
      if (!response.ok) {
        setIsAdminFlag(false);
        setIsSuperAdminFlag(false);
        return;
      }
      const json = (await response.json()) as {
        is_admin?: boolean;
        is_super_admin?: boolean;
      };
      setIsAdminFlag(Boolean(json.is_admin));
      setIsSuperAdminFlag(Boolean(json.is_super_admin));
    } catch {
      setIsAdminFlag(false);
      setIsSuperAdminFlag(false);
    }
  }, [mode]);

  /* Init session : lit la session existante, fallback anonyme si autorisé. */
  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;

        if (session?.user) {
          setUser(session.user);
          if (mode === "admin") {
            await refreshAdminRole();
          }
        } else if (!effectiveDisable) {
          // Mode élève sans disableAnonymousFallback → anonymous.
          const { data } = await supabase.auth.signInAnonymously();
          if (cancelled) return;
          setUser(data.user ?? null);
        } else {
          // Mode prof/admin sans session : on laisse user à null.
          setUser(null);
        }
      } catch {
        // Auth failed — app continues without auth.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, effectiveDisable, refreshAdminRole]);

  /* Souscription onAuthStateChange : capture login / logout / refresh. */
  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (mode === "admin") {
        if (sessionUser) {
          await refreshAdminRole();
        } else {
          setIsAdminFlag(false);
          setIsSuperAdminFlag(false);
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [mode, refreshAdminRole]);

  /* Calcule l'Identity exposée. */
  const value = useMemo<Identity>(() => {
    const baseRole = deriveBaseRole(user);
    let role: IdentityRole = baseRole;
    if (mode === "admin") {
      if (isSuperAdminFlag) role = "super_admin";
      else if (isAdminFlag) role = "admin";
    }
    return {
      user,
      role,
      isLoading,
      mode,
      isSuperAdmin: role === "super_admin",
      isAdmin: role === "super_admin" || role === "admin",
      isAcademic: !!(user?.email && isAcademicEmail(user.email)),
    };
  }, [user, isLoading, mode, isAdminFlag, isSuperAdminFlag]);

  return (
    <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>
  );
}

/* ── API publique d'accès au context ─────────────────────────────────── */

/**
 * Retourne l'Identity courante. À utiliser dans n'importe quel composant
 * client. Mode-agnostic — pour des actions spécifiques (signOut, signin),
 * utiliser useStudentSession / useTeacherSession / useAdminSession.
 */
export function useIdentity(): Identity {
  return useContext(IdentityContext);
}

/**
 * Vérifie que l'Identity courante correspond au mode attendu. Throw une
 * erreur explicite sinon. Permet aux hooks spécialisés (useTeacherSession,
 * useAdminSession) de refuser un usage hors contexte.
 *
 * Cf. tests E.5/E.6 : un useAdminSession() consommé sous IdentityProvider
 * mode="eleve" doit lever, pas retourner silencieusement.
 */
export function assertIdentityMode(
  identity: Identity,
  expected: IdentityMode,
): void {
  if (identity.mode !== expected) {
    throw new Error(
      `[IdentityContext] Hook attendu en mode "${expected}" mais le provider monté est en mode "${identity.mode}". Vérifie le sous-domaine ou le layout d'accueil.`,
    );
  }
}
