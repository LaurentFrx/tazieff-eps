import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

/* ── Types ──────────────────────────────────────────────────────────── */

export type CarnetExercice = {
  nom: string;
  charge: number;
  series: number;
  reps: number;
  rir: number;
  ressenti: number;
};

export type CarnetEntry = {
  id: string;
  date: string;
  objectif: "endurance" | "volume" | "puissance";
  methodes: string[];
  exercices: CarnetExercice[];
  notes: string;
  /* sync fields */
  supabaseId?: string | null;
  syncedAt?: string | null;
  deletedAt?: string | null;
};

const STORAGE_KEY = "tazieff-carnet";

/* ── localStorage helpers ───────────────────────────────────────────── */

export function loadEntriesLocal(): CarnetEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as CarnetEntry[]).map(migrateEntry);
  } catch {
    return [];
  }
}

export function saveEntriesLocal(entries: CarnetEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* ignore */
  }
}

/** Migrate a legacy exercice from seriesReps string to series+reps numbers */
function migrateExercice(ex: Record<string, unknown>): CarnetExercice {
  if ("seriesReps" in ex && !("series" in ex)) {
    const parts = String(ex.seriesReps ?? "").split(/[x×*]/i);
    return {
      nom: String(ex.nom ?? ""),
      charge: Number(ex.charge) || 0,
      series: parseInt(parts[0]) || 0,
      reps: parseInt(parts[1]) || 0,
      rir: Number(ex.rir) || 0,
      ressenti: Number(ex.ressenti) || 3,
    };
  }
  return {
    nom: String(ex.nom ?? ""),
    charge: Number(ex.charge) || 0,
    series: Number(ex.series) || 0,
    reps: Number(ex.reps) || 0,
    rir: Number(ex.rir) || 0,
    ressenti: Number(ex.ressenti) || 3,
  };
}

/** Add sync fields to old entries and migrate exercise format */
function migrateEntry(entry: CarnetEntry): CarnetEntry {
  return {
    ...entry,
    exercices: entry.exercices.map((ex) =>
      migrateExercice(ex as unknown as Record<string, unknown>),
    ),
    supabaseId: entry.supabaseId ?? null,
    syncedAt: entry.syncedAt ?? null,
    deletedAt: entry.deletedAt ?? null,
  };
}

/* ── Supabase operations ────────────────────────────────────────────── */

type SupabaseRow = {
  id: string;
  date: string;
  objectif: string;
  methodes: string[];
  exercices: CarnetExercice[];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export async function saveEntryToSupabase(
  entry: CarnetEntry,
  userId: string,
): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("training_entries")
    .insert({
      user_id: userId,
      date: entry.date,
      objectif: entry.objectif,
      methodes: entry.methodes,
      exercices: entry.exercices,
      notes: entry.notes || null,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return data.id as string;
}

export async function loadEntriesFromSupabase(
  userId: string,
): Promise<CarnetEntry[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("training_entries")
    .select("id, date, objectif, methodes, exercices, notes, created_at, updated_at")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error || !data) return [];

  return (data as SupabaseRow[]).map((row) => ({
    id: row.id,
    date: row.date,
    objectif: row.objectif as CarnetEntry["objectif"],
    methodes: row.methodes ?? [],
    exercices: (row.exercices ?? []) as CarnetExercice[],
    notes: row.notes ?? "",
    supabaseId: row.id,
    syncedAt: row.updated_at,
    deletedAt: null,
  }));
}

export async function deleteEntryFromSupabase(
  supabaseId: string,
): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("training_entries")
    .delete()
    .eq("id", supabaseId);

  return !error;
}

/* ── Sync logic ─────────────────────────────────────────────────────── */

/**
 * Merge local entries with Supabase entries.
 * - Supabase is source of truth for entries that exist in both.
 * - Local-only entries (syncedAt === null) are preserved.
 * - Returns merged list sorted by date desc.
 */
export function mergeEntries(
  local: CarnetEntry[],
  remote: CarnetEntry[],
): CarnetEntry[] {
  const remoteMap = new Map<string, CarnetEntry>();
  for (const r of remote) {
    remoteMap.set(r.supabaseId ?? r.id, r);
  }

  // Start with all remote entries
  const merged = new Map<string, CarnetEntry>();
  for (const r of remote) {
    merged.set(r.supabaseId ?? r.id, r);
  }

  // Add local-only entries (not yet synced)
  for (const l of local) {
    if (!l.syncedAt && !l.supabaseId) {
      merged.set(l.id, l);
    }
  }

  return Array.from(merged.values()).sort(
    (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
  );
}

/**
 * Push unsynced local entries to Supabase.
 * Returns updated entries with sync metadata.
 */
export async function syncLocalToSupabase(
  entries: CarnetEntry[],
  userId: string,
): Promise<CarnetEntry[]> {
  const updated = [...entries];

  for (let i = 0; i < updated.length; i++) {
    const entry = updated[i];

    // Push unsynced, non-deleted entries
    if (!entry.syncedAt && !entry.supabaseId && !entry.deletedAt) {
      const supabaseId = await saveEntryToSupabase(entry, userId);
      if (supabaseId) {
        updated[i] = {
          ...entry,
          supabaseId,
          syncedAt: new Date().toISOString(),
        };
      }
    }

    // Process soft-deleted entries
    if (entry.deletedAt && entry.supabaseId) {
      const ok = await deleteEntryFromSupabase(entry.supabaseId);
      if (ok) {
        updated[i] = { ...entry, supabaseId: "deleted" };
      }
    }
  }

  // Remove fully deleted entries (soft-deleted + confirmed deleted from Supabase)
  return updated.filter((e) => !(e.deletedAt && e.supabaseId === "deleted"));
}
