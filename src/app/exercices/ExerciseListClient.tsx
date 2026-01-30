"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ExerciseCard } from "@/components/ExerciseCard";
import { Chips } from "@/components/Chips";
import type { ExerciseFrontmatter } from "@/lib/content/schema";
import type { Lang } from "@/lib/i18n/I18nProvider";
import type { LiveExerciseListItem, LiveExerciseRow } from "@/lib/live/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  getTheme,
  onThemeChange,
  type ThemePreference,
} from "@/lib/storage";
import {
  EMPTY_FAVORITES_SERVER_SNAPSHOT,
  getFavoritesSnapshot,
  subscribeFavorites,
} from "@/lib/favoritesStore";

type ExerciseListClientProps = {
  exercises: ExerciseFrontmatter[];
  liveExercises: LiveExerciseRow[];
  locale: Lang;
};

const POLL_INTERVAL_MS = 20000;

function mergeExercises(
  exercises: ExerciseFrontmatter[],
  liveExercises: LiveExerciseRow[],
): LiveExerciseListItem[] {
  const existing = new Set(exercises.map((exercise) => exercise.slug));
  const liveItems = liveExercises
    .map((row) => ({
      ...row.data_json.frontmatter,
      slug: row.slug,
      isLive: true,
    }))
    .filter((exercise) => !existing.has(exercise.slug));

  return [
    ...exercises.map((exercise) => ({ ...exercise, isLive: false })),
    ...liveItems,
  ].sort((a, b) => a.title.localeCompare(b.title, "fr"));
}

export function ExerciseListClient({
  exercises,
  liveExercises,
  locale,
}: ExerciseListClientProps) {
  const supabase = getSupabaseBrowserClient();
  const [liveRows, setLiveRows] = useState<LiveExerciseRow[]>(liveExercises);
  const [realtimeReady, setRealtimeReady] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyCompatible, setOnlyCompatible] = useState(false);
  const favorites = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    () => EMPTY_FAVORITES_SERVER_SNAPSHOT,
  );
  const theme = useSyncExternalStore<ThemePreference>(
    (callback) => onThemeChange(() => callback()),
    getTheme,
    () => 1 as ThemePreference,
  );

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
          const row = payload.new as LiveExerciseRow;
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
            Math.min(30000, 2000 * Math.pow(2, retry)),
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
      const { data } = await supabase
        .from("live_exercises")
        .select("slug, locale, data_json, updated_at")
        .eq("locale", locale);
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

  const mergedExercises = useMemo(
    () => mergeExercises(exercises, liveRows),
    [exercises, liveRows],
  );

  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    mergedExercises.forEach((exercise) => {
      exercise.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, "fr"));
  }, [mergedExercises]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return mergedExercises.filter((exercise) => {
      if (onlyFavorites && !favorites.includes(exercise.slug)) {
        return false;
      }

      if (
        onlyCompatible &&
        !exercise.themeCompatibility.includes(theme)
      ) {
        return false;
      }

      if (selectedTags.length > 0) {
        const hasTag = selectedTags.some((tag) => exercise.tags.includes(tag));
        if (!hasTag) {
          return false;
        }
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = `${exercise.title} ${exercise.tags.join(" ")} ${exercise.muscles.join(" ")}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [
    favorites,
    mergedExercises,
    onlyCompatible,
    onlyFavorites,
    query,
    selectedTags,
    theme,
  ]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  };

  return (
    <div className="stack-lg">
      <div className="filter-panel">
        <input
          className="field-input"
          type="search"
          placeholder="Rechercher un exercice"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="chip-row">
          <button
            type="button"
            className={`chip${onlyFavorites ? " is-active" : ""}`}
            onClick={() => setOnlyFavorites((prev) => !prev)}
          >
            Favoris
          </button>
          <button
            type="button"
            className={`chip${onlyCompatible ? " is-active" : ""}`}
            onClick={() => setOnlyCompatible((prev) => !prev)}
          >
            Compatibles thème {theme}
          </button>
          <button
            type="button"
            className="chip chip-clear"
            onClick={() => {
              setQuery("");
              setSelectedTags([]);
              setOnlyFavorites(false);
              setOnlyCompatible(false);
            }}
          >
            Réinitialiser
          </button>
        </div>
        <Chips
          label="Tags"
          items={tags}
          activeItems={selectedTags}
          onToggle={toggleTag}
          onClear={() => setSelectedTags([])}
        />
      </div>

      <p className="text-sm text-[color:var(--muted)]">
        {filtered.length} exercice{filtered.length > 1 ? "s" : ""} trouvé
        {filtered.length > 1 ? "s" : ""}
      </p>

      <div className="card-grid">
        {filtered.length === 0 ? (
          <div className="card">
            <h2>Aucun exercice ne correspond</h2>
            <p>Ajustez vos filtres ou vos mots-clés.</p>
          </div>
        ) : (
          filtered.map((exercise) => (
            <Link key={exercise.slug} href={`/exercices/${exercise.slug}`}>
              <article className="card">
                <ExerciseCard exercise={exercise} isLive={exercise.isLive} />
                <div className="chip-row chip-row--compact">
                  {exercise.isLive === true ? (
                    <span className="pill pill-live">LIVE</span>
                  ) : null}
                  {exercise.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="chip">
                      {tag}
                    </span>
                  ))}
                  <span className="chip chip-ghost">
                    Thèmes {exercise.themeCompatibility.join(", ")}
                  </span>
                </div>
              </article>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
