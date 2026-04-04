"use client";

import { useMemo } from "react";
import { loadEntriesLocal, type CarnetEntry } from "@/lib/carnet-sync";

/**
 * Returns how many days ago the user last trained a given muscle group.
 * Reads from the local carnet (localStorage).
 */
export function useLastWorked(muscleGroup: string): { daysAgo: number | null; date: string | null } {
  return useMemo(() => {
    if (typeof window === "undefined" || !muscleGroup) return { daysAgo: null, date: null };

    const entries: CarnetEntry[] = loadEntriesLocal();
    if (entries.length === 0) return { daysAgo: null, date: null };

    const target = muscleGroup.toLowerCase();
    let latest: string | null = null;

    for (const entry of entries) {
      if (entry.deletedAt) continue;
      const matchesMuscle = entry.exercices.some((ex) =>
        ex.nom.toLowerCase().includes(target),
      );
      if (matchesMuscle) {
        if (!latest || entry.date > latest) {
          latest = entry.date;
        }
      }
    }

    if (!latest) return { daysAgo: null, date: null };

    const diff = Date.now() - new Date(latest).getTime();
    const daysAgo = Math.floor(diff / (1000 * 60 * 60 * 24));

    return { daysAgo, date: latest };
  }, [muscleGroup]);
}
