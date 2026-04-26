import { useEffect, useState } from "react";
import type { LiveExerciseRow } from "@/lib/live/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const POLL_INTERVAL_MS = 20_000;

export type UseExercisesLiveSyncReturn = {
  liveExercises: LiveExerciseRow[];
  isRealtimeReady: boolean;
};

export function useExercisesLiveSync(
  locale: string,
  initialData: LiveExerciseRow[],
): UseExercisesLiveSyncReturn {
  const supabase = getSupabaseBrowserClient();
  const [liveRows, setLiveRows] = useState<LiveExerciseRow[]>(initialData);
  const [realtimeReady, setRealtimeReady] = useState(false);

  // ---------------------------------------------------------------------------
  // Supabase realtime channel with exponential backoff retry
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;
    let retry = 0;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let channel = supabase.channel(`live-exercises-${locale}`);

    const upsertRow = (row: LiveExerciseRow) => {
      setLiveRows((prev) => {
        const next = prev.filter((item) => item.slug !== row.slug);
        next.push(row);
        return next;
      });
    };

    const setupChannel = () => {
      channel = supabase.channel(`live-exercises-${locale}`);
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_exercises",
          filter: `locale=eq.${locale}`,
        },
        (payload) => {
          if (!active) {
            return;
          }
          if (payload.eventType === "DELETE") {
            const deleted = payload.old as LiveExerciseRow;
            setLiveRows((prev) => prev.filter((item) => item.slug !== deleted.slug));
            return;
          }
          // P0.6 : un soft-delete arrive en UPDATE avec deleted_at non null.
          // On traite comme un retrait : exclut la row de la liste.
          const row = payload.new as LiveExerciseRow & {
            deleted_at?: string | null;
          };
          if (row.deleted_at) {
            setLiveRows((prev) => prev.filter((item) => item.slug !== row.slug));
            return;
          }
          upsertRow(row);
        },
      );

      channel.subscribe((status) => {
        if (!active) {
          return;
        }
        if (status === "SUBSCRIBED") {
          retry = 0;
          setRealtimeReady(true);
          return;
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setRealtimeReady(false);
          channel.unsubscribe();
          retryTimeout = setTimeout(
            setupChannel,
            Math.min(30_000, 2_000 * Math.pow(2, retry)),
          );
          retry += 1;
        }
      });
    };

    setupChannel();

    return () => {
      active = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      supabase.removeChannel(channel);
    };
  }, [locale, supabase]);

  // ---------------------------------------------------------------------------
  // Polling fallback (20s) when realtime is not ready
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!supabase || realtimeReady) {
      return;
    }

    let active = true;
    let interval: ReturnType<typeof setInterval> | null = null;

    const fetchLatest = async () => {
      if (!active || document.visibilityState !== "visible") {
        return;
      }
      // P0.6 : exclure les rows soft-deletées (la policy SELECT publique
      // le fait déjà côté DB, on double-garde côté client).
      const { data } = await supabase
        .from("live_exercises")
        .select("slug, locale, data_json, updated_at")
        .eq("locale", locale)
        .is("deleted_at", null);
      if (!active || !data) {
        return;
      }
      setLiveRows(data as LiveExerciseRow[]);
    };

    fetchLatest();
    interval = setInterval(fetchLatest, POLL_INTERVAL_MS);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchLatest();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      if (interval) {
        clearInterval(interval);
      }
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [locale, realtimeReady, supabase]);

  return { liveExercises: liveRows, isRealtimeReady: realtimeReady };
}
