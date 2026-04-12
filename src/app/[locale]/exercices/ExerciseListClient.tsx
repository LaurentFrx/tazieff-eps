"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import type { Difficulty } from "@/lib/content/schema";
import type { Lang } from "@/lib/i18n/I18nProvider";
import type { LiveExerciseListItem, LiveExerciseRow } from "@/lib/live/types";
import {
  mergeExercises,
  filterVisibleExercises,
  filterExercises,
  NO_EQUIPMENT_ID,
} from "@/lib/exercices/filters";
import { MUSCLE_GROUP_IDS, type MuscleGroupId } from "@/lib/exercices/muscleGroups";
import { useFavorites } from "@/hooks/useFavorites";
import { useTeacherMode } from "@/hooks/useTeacherMode";
import { useExercisesLiveSync } from "@/hooks/useExercisesLiveSync";
import { ExerciseFilters } from "@/components/exercices/ExerciseFilters";
import { ExerciseGrid } from "@/components/exercices/ExerciseGrid";
import { BackToAnatomy } from "./BackToAnatomy";
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

  // Read ?muscle= from URL (set by anatomy page link)
  const searchParams = useSearchParams();

  // Filter state
  const [query, setQuery] = useState("");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedLevels, setSelectedLevels] = useState<Difficulty[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<MuscleGroupId[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<ThemeOption[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Pre-select from URL query params (?muscle=X or ?session=s1)
  useEffect(() => {
    const muscle = searchParams.get("muscle");
    if (muscle) {
      const LEGACY_MAP: Record<string, MuscleGroupId> = {
        dos: "dorsaux",
        "membres-inferieurs": "cuisses",
        "membres-superieurs": "bras",
      };
      const resolved = LEGACY_MAP[muscle] ?? muscle;
      if (MUSCLE_GROUP_IDS.includes(resolved as MuscleGroupId)) {
        setSelectedMuscleGroups([resolved as MuscleGroupId]);
      }
    }
    const session = searchParams.get("session");
    if (session) {
      setSelectedSession(session);
    }
    const favs = searchParams.get("favs");
    if (favs === "1") {
      setOnlyFavorites(true);
    }
  }, [searchParams]);

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

  // Apply session filter first, then standard filters
  const sessionFiltered = useMemo(() => {
    if (!selectedSession) return visibleExercises;
    const prefix = selectedSession + "-";
    return visibleExercises.filter((ex) => ex.slug.startsWith(prefix));
  }, [visibleExercises, selectedSession]);

  const filtered = useMemo(
    () =>
      filterExercises(sessionFiltered, {
        query,
        levels: selectedLevels,
        equipment: selectedEquipment,
        muscleGroups: selectedMuscleGroups,
        themes: selectedThemes,
        onlyFavorites,
        favorites,
      }),
    [
      favorites,
      sessionFiltered,
      onlyFavorites,
      query,
      selectedEquipment,
      selectedLevels,
      selectedMuscleGroups,
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

  const toggleMuscleGroup = (group: MuscleGroupId) => {
    setSelectedMuscleGroups((prev) =>
      prev.includes(group) ? prev.filter((item) => item !== group) : [...prev, group],
    );
  };

  const toggleTheme = (themeValue: ThemeOption) => {
    setSelectedThemes((prev) =>
      prev.includes(themeValue)
        ? prev.filter((item) => item !== themeValue)
        : [...prev, themeValue],
    );
  };

  const handleReset = () => {
    setQuery("");
    setSelectedSession(null);
    setSelectedLevels([]);
    setSelectedEquipment([]);
    setSelectedMuscleGroups([]);
    setSelectedThemes([]);
    setOnlyFavorites(false);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const SESSION_TABS = [
    { id: null, label: "Tous" },
    { id: "s1", label: "S1", color: "#f97316" },
    { id: "s2", label: "S2", color: "#ef4444" },
    { id: "s3", label: "S3", color: "#3b82f6" },
    { id: "s4", label: "S4", color: "#22c55e" },
    { id: "s5", label: "S5", color: "#a855f7" },
    { id: "s6", label: "S6", color: "#ec4899" },
  ] as const;

  return (
    <div className="stack-lg">
      <BackToAnatomy />

      {/* ── Session tabs (scrollable) ───────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {SESSION_TABS.map((tab) => {
          const isActive = selectedSession === tab.id;
          const color = tab.id ? (tab as { color: string }).color : "#f97316";
          return (
            <button
              key={tab.id ?? "all"}
              type="button"
              onClick={() => setSelectedSession(tab.id)}
              className="shrink-0 rounded-full px-4 py-2 text-sm font-bold min-h-[44px] transition-all select-none"
              style={isActive
                ? { background: color, color: "white", boxShadow: `0 0 12px ${color}66` }
                : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

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
          selectedMuscleGroups={selectedMuscleGroups}
          onToggleMuscleGroup={toggleMuscleGroup}
          onClearMuscleGroups={() => setSelectedMuscleGroups([])}
          selectedThemes={selectedThemes}
          onToggleTheme={toggleTheme}
          onClearThemes={() => setSelectedThemes([])}
          onlyFavorites={onlyFavorites}
          onFavoritesChange={setOnlyFavorites}
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
