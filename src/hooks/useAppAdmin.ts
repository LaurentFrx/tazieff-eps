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
        // eslint-disable-next-line no-console -- DEBUG_P0_7_SEXIES
        console.warn("[DEBUG_P0_7_SEXIES] useAppAdmin: response not ok", {
          status: response.status,
          host: typeof window !== "undefined" ? window.location.host : null,
        });
        setIsAdmin(false);
        setIsSuperAdmin(false);
        return;
      }
      const json = (await response.json()) as RoleResponse;
      // eslint-disable-next-line no-console -- DEBUG_P0_7_SEXIES
      console.log("[DEBUG_P0_7_SEXIES] useAppAdmin: role response", {
        host: typeof window !== "undefined" ? window.location.host : null,
        path: typeof window !== "undefined" ? window.location.pathname : null,
        is_admin: json.is_admin,
        is_super_admin: json.is_super_admin,
      });
      setIsAdmin(Boolean(json.is_admin));
      setIsSuperAdmin(Boolean(json.is_super_admin));
    } catch (err) {
      // eslint-disable-next-line no-console -- DEBUG_P0_7_SEXIES
      console.error("[DEBUG_P0_7_SEXIES] useAppAdmin: fetch threw", err);
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
