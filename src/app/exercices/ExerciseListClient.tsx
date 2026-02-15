"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { Difficulty } from "@/lib/content/schema";
import type { Lang } from "@/lib/i18n/I18nProvider";
import type { LiveExerciseListItem, LiveExerciseRow } from "@/lib/live/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  mergeExercises,
  filterVisibleExercises,
  filterExercises,
  NO_EQUIPMENT_ID,
} from "@/lib/exercices/filters";
import { useFavorites } from "@/hooks/useFavorites";
import { useTeacherMode } from "@/hooks/useTeacherMode";
import { ExerciseFilters } from "@/components/exercices/ExerciseFilters";
import { ExerciseGrid } from "@/components/exercices/ExerciseGrid";
import type { ViewMode } from "@/components/exercices/ExerciseGrid";
import { TeacherToolbar } from "@/components/exercices/TeacherToolbar";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type ExerciseListClientProps = {
  exercises: LiveExerciseListItem[];
  liveExercises: LiveExerciseRow[];
  locale: Lang;
};

// ---------------------------------------------------------------------------
// View mode store (localStorage + useSyncExternalStore)
// ---------------------------------------------------------------------------

const VIEW_MODE_STORAGE_KEY = "exercisesViewMode";
const DEFAULT_VIEW_MODE: ViewMode = "grid";
const POLL_INTERVAL_MS = 20000;

let cachedViewModeRaw: string | null = null;
let cachedViewMode: ViewMode = DEFAULT_VIEW_MODE;
const viewModeListeners = new Set<() => void>();

function emitViewMode() {
  viewModeListeners.forEach((listener) => listener());
}

function normalizeViewMode(value: string | null): ViewMode {
  return value === "grid" || value === "list" ? value : DEFAULT_VIEW_MODE;
}

function getViewModeSnapshot(): ViewMode {
  if (typeof window === "undefined") {
    return cachedViewMode;
  }

  const raw = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  if (raw === cachedViewModeRaw) {
    return cachedViewMode;
  }

  cachedViewModeRaw = raw;
  cachedViewMode = normalizeViewMode(raw);
  return cachedViewMode;
}

function setStoredViewMode(next: ViewMode) {
  if (cachedViewModeRaw === next && cachedViewMode === next) {
    return;
  }

  cachedViewMode = next;
  cachedViewModeRaw = next;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, next);
  }

  emitViewMode();
}

function onViewModeStorage(event: StorageEvent) {
  if (event.key !== VIEW_MODE_STORAGE_KEY) {
    return;
  }
  cachedViewModeRaw = null;
  getViewModeSnapshot();
  emitViewMode();
}

function subscribeViewMode(callback: () => void) {
  viewModeListeners.add(callback);

  if (typeof window !== "undefined" && viewModeListeners.size === 1) {
    window.addEventListener("storage", onViewModeStorage);
  }

  return () => {
    viewModeListeners.delete(callback);
    if (viewModeListeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", onViewModeStorage);
    }
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type ThemeOption = 1 | 2 | 3;

export function ExerciseListClient({
  exercises,
  liveExercises,
  locale,
}: ExerciseListClientProps) {
  const supabase = getSupabaseBrowserClient();
  const [liveRows, setLiveRows] = useState<LiveExerciseRow[]>(liveExercises);
  const [realtimeReady, setRealtimeReady] = useState(false);

  // Phase 2 hooks
  const { favorites } = useFavorites();
  const { unlocked: teacherUnlocked, pin: teacherPin } = useTeacherMode();

  // Filter state
  const [query, setQuery] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<Difficulty[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<ThemeOption[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [openFilter, setOpenFilter] = useState<
    "level" | "equipment" | "tags" | "themes" | "favorites" | null
  >(null);

  // View mode
  const viewMode = useSyncExternalStore(
    subscribeViewMode,
    getViewModeSnapshot,
    () => DEFAULT_VIEW_MODE,
  );

  // ---------------------------------------------------------------------------
  // Supabase realtime sync
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

  // ---------------------------------------------------------------------------
  // Polling fallback
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

  // ---------------------------------------------------------------------------
  // Memoized data pipeline (Phase 1 functions)
  // ---------------------------------------------------------------------------

  const mergedExercises = useMemo(
    () => mergeExercises(exercises, liveRows),
    [exercises, liveRows],
  );

  const visibleExercises = useMemo(
    () => filterVisibleExercises(mergedExercises, teacherUnlocked),
    [mergedExercises, teacherUnlocked],
  );

  const levelOptions = useMemo(() => {
    const levels = new Set<Difficulty>();
    visibleExercises.forEach((exercise) => {
      if (exercise.level) {
        levels.add(exercise.level);
      }
    });
    const levelOrder: Difficulty[] = ["debutant", "intermediaire", "avance"];
    return levelOrder.filter((level) => levels.has(level));
  }, [visibleExercises]);

  const equipmentOptions = useMemo(() => {
    const equipmentSet = new Set<string>();
    let hasNoEquipment = false;
    visibleExercises.forEach((exercise) => {
      const items = (exercise.equipment ?? [])
        .map((item) => item?.trim())
        .filter((item): item is string => Boolean(item));
      if (items.length === 0) {
        hasNoEquipment = true;
        return;
      }
      items.forEach((item) => equipmentSet.add(item));
    });
    const sorted = Array.from(equipmentSet).sort((a, b) => a.localeCompare(b, "fr"));
    return hasNoEquipment ? [NO_EQUIPMENT_ID, ...sorted] : sorted;
  }, [visibleExercises]);

  const tagOptions = useMemo(() => {
    const tagSet = new Set<string>();
    visibleExercises.forEach((exercise) => {
      exercise.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, "fr"));
  }, [visibleExercises]);

  const filtered = useMemo(
    () =>
      filterExercises(visibleExercises, {
        query,
        levels: selectedLevels,
        equipment: selectedEquipment,
        tags: selectedTags,
        themes: selectedThemes,
        onlyFavorites,
        favorites,
      }),
    [
      favorites,
      visibleExercises,
      onlyFavorites,
      query,
      selectedEquipment,
      selectedLevels,
      selectedTags,
      selectedThemes,
    ],
  );

  const existingSlugs = useMemo(
    () => new Set(mergedExercises.map((e) => e.slug)),
    [mergedExercises],
  );

  // ---------------------------------------------------------------------------
  // Filter handlers
  // ---------------------------------------------------------------------------

  const toggleLevel = (level: Difficulty) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((item) => item !== level) : [...prev, level],
    );
  };

  const toggleEquipment = (item: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item],
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  };

  const toggleTheme = (themeValue: ThemeOption) => {
    setSelectedThemes((prev) =>
      prev.includes(themeValue)
        ? prev.filter((item) => item !== themeValue)
        : [...prev, themeValue],
    );
  };

  const toggleFilter = (
    filter: "level" | "equipment" | "tags" | "themes" | "favorites",
  ) => {
    setOpenFilter((prev) => (prev === filter ? null : filter));
  };

  const handleReset = () => {
    setQuery("");
    setSelectedLevels([]);
    setSelectedEquipment([]);
    setSelectedTags([]);
    setSelectedThemes([]);
    setOnlyFavorites(false);
    setOpenFilter(null);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="stack-lg">
      <div className="filter-panel">
        <TeacherToolbar
          teacherUnlocked={teacherUnlocked}
          teacherPin={teacherPin}
          existingSlugs={existingSlugs}
          locale={locale}
        />
        <ExerciseFilters
          query={query}
          onQueryChange={setQuery}
          selectedLevels={selectedLevels}
          onToggleLevel={toggleLevel}
          onClearLevels={() => setSelectedLevels([])}
          levelOptions={levelOptions}
          selectedEquipment={selectedEquipment}
          onToggleEquipment={toggleEquipment}
          onClearEquipment={() => setSelectedEquipment([])}
          equipmentOptions={equipmentOptions}
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
          onClearTags={() => setSelectedTags([])}
          tagOptions={tagOptions}
          selectedThemes={selectedThemes}
          onToggleTheme={toggleTheme}
          onClearThemes={() => setSelectedThemes([])}
          onlyFavorites={onlyFavorites}
          onFavoritesChange={setOnlyFavorites}
          openFilter={openFilter}
          onToggleFilter={toggleFilter}
          onReset={handleReset}
        />
      </div>

      <ExerciseGrid
        exercises={filtered}
        favorites={favorites}
        viewMode={viewMode}
        onViewModeChange={setStoredViewMode}
      />
    </div>
  );
}
