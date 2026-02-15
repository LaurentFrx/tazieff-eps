"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { Difficulty } from "@/lib/content/schema";
import type { Lang } from "@/lib/i18n/I18nProvider";
import type { LiveExerciseListItem, LiveExerciseRow } from "@/lib/live/types";
import {
  mergeExercises,
  filterVisibleExercises,
  filterExercises,
  NO_EQUIPMENT_ID,
} from "@/lib/exercices/filters";
import { useFavorites } from "@/hooks/useFavorites";
import { useTeacherMode } from "@/hooks/useTeacherMode";
import { useExercisesLiveSync } from "@/hooks/useExercisesLiveSync";
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
  // Phase 4 hook — Supabase realtime + polling
  const { liveExercises: liveRows } = useExercisesLiveSync(locale, liveExercises);

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
