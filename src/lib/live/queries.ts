import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ExerciseOverrideRow, LiveExerciseRow } from "@/lib/live/types";

export async function fetchLiveExercises(locale: string): Promise<LiveExerciseRow[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("live_exercises")
    .select("slug, locale, data_json, updated_at")
    .eq("locale", locale);

  if (error || !data) {
    return [];
  }

  return data as LiveExerciseRow[];
}

export async function fetchLiveExercise(
  slug: string,
  locale: string,
): Promise<LiveExerciseRow | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("live_exercises")
    .select("slug, locale, data_json, updated_at")
    .eq("slug", slug)
    .eq("locale", locale)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as LiveExerciseRow;
}

export async function fetchExerciseOverride(
  slug: string,
  locale: string,
): Promise<ExerciseOverrideRow | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  // P0.2 : on ignore les lignes soft-deleted (deleted_at IS NOT NULL).
  // La policy SELECT publique le filtre déjà côté DB, mais on double-garde
  // côté client pour éviter qu'un changement de policy ne casse le fallback.
  const { data, error } = await supabase
    .from("exercise_overrides")
    .select("slug, locale, patch_json, updated_at")
    .eq("slug", slug)
    .eq("locale", locale)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as ExerciseOverrideRow;
}
