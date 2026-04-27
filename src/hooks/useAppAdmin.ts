"use client";

// Phase P0.1 — Hook client : récupère le rôle admin de l'utilisateur courant.
//
// Source de vérité : GET /api/me/role (toujours 200, retourne deux booléens).
// Principe de moindre privilège : initialisation à `false` (deny by default),
// même pendant `isLoading` → l'UI ne déverrouille jamais l'édition tant que
// la réponse n'est pas confirmée.
//
// Référence : GOUVERNANCE_EDITORIALE.md §3.1, §7.

import { useCallback, useEffect, useState } from "react";

type RoleResponse = {
  is_super_admin: boolean;
  is_admin: boolean;
};

export type UseAppAdminResult = {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
};

export function useAppAdmin(): UseAppAdminResult {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRole = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/me/role", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });
      if (!response.ok) {
        // 4xx/5xx : on retombe en deny.
        setIsAdmin(false);
        setIsSuperAdmin(false);
        return;
      }
      const json = (await response.json()) as RoleResponse;
      setIsAdmin(Boolean(json.is_admin));
      setIsSuperAdmin(Boolean(json.is_super_admin));
    } catch {
      // Réseau / parse : deny.
      setIsAdmin(false);
      setIsSuperAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRole();
  }, [fetchRole]);

  return { isAdmin, isSuperAdmin, isLoading, refetch: fetchRole };
}
