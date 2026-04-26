"use client";

// Sprint E1 — Hook client pour la liste des classes auxquelles l'élève
// est inscrit. Backend : GET /api/me/classes (toujours 200, retourne []
// pour un anonyme sans classe).
//
// Référence : GOUVERNANCE_EDITORIALE.md §2.4, §3.3.

import { useCallback, useEffect, useState } from "react";

export type ClassSummary = {
  id: string;
  name: string;
  school_year: string | null;
  teacher_name: string | null;
  org_name: string;
};

export type UseMyClassesResult = {
  classes: ClassSummary[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useMyClasses(): UseMyClassesResult {
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchClasses = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/me/classes", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });
      if (!response.ok) {
        // L'API retourne 200 même pour les anonymes ; un autre status est
        // une vraie erreur réseau ou serveur.
        setClasses([]);
        return;
      }
      const json = (await response.json()) as { classes?: ClassSummary[] };
      setClasses(json.classes ?? []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchClasses();
  }, [fetchClasses]);

  return { classes, isLoading, error, refetch: fetchClasses };
}
