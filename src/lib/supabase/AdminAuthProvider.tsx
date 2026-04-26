"use client";

// Sprint P0.7 — Provider d'auth pour l'espace admin (sous-domaine
// admin.muscu-eps.fr). Calque sur TeacherAuthProvider :
//   - PAS de signInAnonymously au mount
//   - Lit la session existante (magic-link déjà consommé)
//   - Écoute onAuthStateChange pour réagir au login / logout
//
// En plus du provider de base, on hydrate `isAdmin` / `isSuperAdmin` via
// un fetch à /api/me/role, refetché à chaque changement de session.
//
// Référence : GOUVERNANCE_EDITORIALE.md §2.1, §2.2.

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
import { getSupabaseBrowserClient } from "./browser";

export type AdminAuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

const AdminAuthContext = createContext<AdminAuthContextValue>({
  user: null,
  isLoading: true,
  isAdmin: false,
  isSuperAdmin: false,
});

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Hydratation du statut admin via /api/me/role.
  const refreshRole = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/me/role", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });
      if (!response.ok) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        return;
      }
      const json = (await response.json()) as {
        is_admin?: boolean;
        is_super_admin?: boolean;
      };
      setIsAdmin(Boolean(json.is_admin));
      setIsSuperAdmin(Boolean(json.is_super_admin));
    } catch {
      setIsAdmin(false);
      setIsSuperAdmin(false);
    }
  }, []);

  // Initialisation : lecture session + hydratation rôle.
  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (cancelled) return;
        const sessionUser = data.session?.user ?? null;
        setUser(sessionUser);
        if (sessionUser) {
          await refreshRole();
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshRole]);

  // Souscription aux changements de session (login / logout / refresh token).
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        await refreshRole();
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshRole]);

  const value = useMemo<AdminAuthContextValue>(
    () => ({ user, isLoading, isAdmin, isSuperAdmin }),
    [user, isLoading, isAdmin, isSuperAdmin],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

/**
 * Hook de consommation du AdminAuthContext. À utiliser dans tout
 * composant du sous-arbre /admin/*.
 */
export function useAdminAuthContext(): AdminAuthContextValue {
  return useContext(AdminAuthContext);
}
