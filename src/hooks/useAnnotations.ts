"use client";

// Phase E.2.2 — Hook de consommation de l'API annotations côté UI.
// Usage linéaire (pas d'optimistic update ici — réservé à E.2.3 UI).
// Pas de SWR ni react-query : fetch natif + useState/useEffect, pour éviter
// d'ajouter une dépendance.

import { useCallback, useEffect, useState } from "react";
import type { Database } from "@/types/database";
import type {
  CreateAnnotationInput,
  UpdateAnnotationInput,
} from "@/lib/validation/annotations";

export type TeacherAnnotationRow =
  Database["public"]["Tables"]["teacher_annotations"]["Row"];

export type UseAnnotationsResult = {
  annotations: TeacherAnnotationRow[];
  isLoading: boolean;
  error: Error | null;
  createAnnotation: (
    input: CreateAnnotationInput,
  ) => Promise<TeacherAnnotationRow>;
  updateAnnotation: (
    id: string,
    input: UpdateAnnotationInput,
  ) => Promise<TeacherAnnotationRow>;
  deleteAnnotation: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

type Locale = "fr" | "en" | "es";

export function useAnnotations(
  exerciseSlug: string,
  locale: Locale,
): UseAnnotationsResult {
  const [annotations, setAnnotations] = useState<TeacherAnnotationRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchList = useCallback(async (): Promise<void> => {
    if (!exerciseSlug) {
      setAnnotations([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const url = `/api/teacher/annotations?slug=${encodeURIComponent(exerciseSlug)}&locale=${encodeURIComponent(locale)}`;
      const response = await fetch(url);
      if (response.status === 401) {
        // Non authentifié : on vide la liste silencieusement
        setAnnotations([]);
        return;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const json = (await response.json()) as {
        annotations: TeacherAnnotationRow[];
      };
      setAnnotations(json.annotations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [exerciseSlug, locale]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const createAnnotation = useCallback(
    async (input: CreateAnnotationInput): Promise<TeacherAnnotationRow> => {
      const response = await fetch("/api/teacher/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      const row = (await response.json()) as TeacherAnnotationRow;
      setAnnotations((prev) => [row, ...prev]);
      return row;
    },
    [],
  );

  const updateAnnotation = useCallback(
    async (
      id: string,
      input: UpdateAnnotationInput,
    ): Promise<TeacherAnnotationRow> => {
      const response = await fetch(`/api/teacher/annotations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      const row = (await response.json()) as TeacherAnnotationRow;
      setAnnotations((prev) => prev.map((a) => (a.id === id ? row : a)));
      return row;
    },
    [],
  );

  const deleteAnnotation = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`/api/teacher/annotations/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    // Soft delete côté DB : on retire la row du state local
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return {
    annotations,
    isLoading,
    error,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    refresh: fetchList,
  };
}
