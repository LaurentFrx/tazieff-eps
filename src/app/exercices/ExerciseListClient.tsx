"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState, useSyncExternalStore } from "react";
import { ExerciseCard } from "@/components/ExerciseCard";
import type { Difficulty } from "@/lib/content/schema";
import type { Lang } from "@/lib/i18n/I18nProvider";
import type { LiveExerciseListItem, LiveExerciseRow } from "@/lib/live/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  EMPTY_FAVORITES_SERVER_SNAPSHOT,
  getFavoritesSnapshot,
  subscribeFavorites,
  toggleFavorite,
} from "@/lib/favoritesStore";

type ExerciseListClientProps = {
  exercises: LiveExerciseListItem[];
  liveExercises: LiveExerciseRow[];
  locale: Lang;
};

type ExerciseStatus = "draft" | "ready";
type ViewMode = "grid" | "list";

type TeacherModeSnapshot = {
  unlocked: boolean;
  pin: string;
};

declare global {
  interface Window {
    __teacherMode?: TeacherModeSnapshot;
  }
}

const POLL_INTERVAL_MS = 20000;
const THEME_OPTIONS = [1, 2, 3] as const;
const NO_EQUIPMENT_ID = "sans-materiel";
const NO_EQUIPMENT_LABEL = "Sans matériel";
const VIEW_MODE_STORAGE_KEY = "exercisesViewMode";
const DEFAULT_VIEW_MODE: ViewMode = "grid";
const CHIP_VARIANTS = [
  "bg-blue-500/10 border-blue-400/30 text-blue-100",
  "bg-emerald-500/10 border-emerald-400/30 text-emerald-100",
  "bg-violet-500/10 border-violet-400/30 text-violet-100",
  "bg-amber-500/10 border-amber-400/30 text-amber-100",
  "bg-cyan-500/10 border-cyan-400/30 text-cyan-100",
  "bg-rose-500/10 border-rose-400/30 text-rose-100",
] as const;
type ThemeOption = (typeof THEME_OPTIONS)[number];
const LEVEL_LABELS: Record<Difficulty, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};
const DEFAULT_TEACHER_MODE: TeacherModeSnapshot = { unlocked: false, pin: "" };
const NEW_EXERCISE_CONTENT = `## Consignes
- À compléter

## Dosage
- À compléter

## Erreurs fréquentes
- À compléter

## Sécurité
- À compléter
`;

function getTeacherModeSnapshot(): TeacherModeSnapshot {
  if (typeof window === "undefined") {
    return { ...DEFAULT_TEACHER_MODE };
  }
  const snapshot = window.__teacherMode;
  if (!snapshot) {
    return { ...DEFAULT_TEACHER_MODE };
  }
  return {
    unlocked: Boolean(snapshot.unlocked),
    pin: snapshot.pin ?? "",
  };
}

function getUniqueExerciseSlug(existingSlugs: Set<string>) {
  let maxIndex = 0;
  existingSlugs.forEach((slug) => {
    const match = slug.match(/^s1-(\d+)$/);
    if (!match) {
      return;
    }
    const value = Number(match[1]);
    if (Number.isNaN(value)) {
      return;
    }
    maxIndex = Math.max(maxIndex, value);
  });

  const nextIndex = maxIndex + 1;
  const candidate = `s1-${String(nextIndex).padStart(3, "0")}`;
  if (!existingSlugs.has(candidate)) {
    return candidate;
  }

  const fallback = `exo-${Date.now()}`;
  if (!existingSlugs.has(fallback)) {
    return fallback;
  }

  return `exo-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
}

type MultiSelectValue = string | number;
type MultiSelectMenuProps<T extends MultiSelectValue> = {
  label: string;
  options: readonly T[];
  selected: readonly T[];
  onToggleOption: (value: T) => void;
  onClear: () => void;
  formatLabel?: (value: T) => string;
  open: boolean;
  onToggle: () => void;
};

type ExerciseListItem = LiveExerciseListItem & { status?: ExerciseStatus };

type SingleSelectMenuProps<T> = {
  label: string;
  options: readonly T[];
  selected: T;
  onSelect: (value: T) => void;
  formatLabel?: (value: T) => string;
  open: boolean;
  onToggle: () => void;
};

function chipVariant(id: MultiSelectValue) {
  const key = String(id);
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash += key.charCodeAt(index);
  }
  return CHIP_VARIANTS[hash % CHIP_VARIANTS.length];
}

function renderSelectedChips<T extends MultiSelectValue>(
  selected: readonly T[],
  options: readonly T[],
  formatLabel?: (value: T) => string,
) {
  if (selected.length === 0) {
    return <span className="text-xs text-[color:var(--muted)]">Tous</span>;
  }

  const selectedSet = new Set(selected);
  const orderedValues = options.filter((option) => selectedSet.has(option));
  const values = orderedValues.length > 0 ? orderedValues : selected;
  const getLabel = (value: T) => (formatLabel ? formatLabel(value) : String(value));

  return values.map((value) => (
    <span
      key={`chip-${String(value)}`}
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${chipVariant(value)}`}
    >
      {getLabel(value)}
    </span>
  ));
}

function MultiSelectMenu<T extends MultiSelectValue>({
  label,
  options,
  selected,
  onToggleOption,
  onClear,
  formatLabel,
  open,
  onToggle,
}: MultiSelectMenuProps<T>) {
  const ringClass = open ? "ring-2 ring-red-400/60" : "ring-1 ring-white/10";

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        className={`field-input flex items-center justify-between gap-3 ${ringClass}`}
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="flex min-w-0 flex-1 flex-col items-start gap-2">
          <span className="text-sm font-medium">{label}</span>
          <span className="flex w-full flex-wrap items-center gap-2">
            {renderSelectedChips(selected, options, formatLabel)}
          </span>
        </span>
        <span aria-hidden="true">▾</span>
      </button>
      {open ? (
        <div className="mt-2 w-full rounded-2xl border border-white/10 bg-[color:var(--bg-2)] p-2 shadow-lg">
          <div className="flex items-center justify-between px-2 pb-2">
            <span className="text-xs text-[color:var(--muted)]">
              {options.length} option{options.length > 1 ? "s" : ""}
            </span>
            {selected.length > 0 ? (
              <button type="button" className="chip chip-clear" onClick={onClear}>
                Tout effacer
              </button>
            ) : null}
          </div>
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {options.map((option) => {
              const isActive = selected.includes(option);
              const labelValue = formatLabel ? formatLabel(option) : String(option);

              return (
                <label
                  key={`${label}-${labelValue}`}
                  className="flex min-h-[36px] items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-white/10"
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => onToggleOption(option)}
                  />
                  <span>{labelValue}</span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SingleSelectMenu<T>({
  label,
  options,
  selected,
  onSelect,
  formatLabel,
  open,
  onToggle,
}: SingleSelectMenuProps<T>) {
  const menuId = useId();
  const summary = formatLabel ? formatLabel(selected) : String(selected);
  const ringClass = open ? "ring-2 ring-red-400/60" : "ring-1 ring-white/10";

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        className={`field-input flex items-center justify-between gap-3 ${ringClass}`}
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="flex min-w-0 flex-col items-start">
          <span className="text-sm font-medium">{label}</span>
          <span className="truncate text-xs text-[color:var(--muted)]">{summary}</span>
        </span>
        <span aria-hidden="true">▾</span>
      </button>
      {open ? (
        <div className="mt-2 w-full rounded-2xl border border-white/10 bg-[color:var(--bg-2)] p-2 shadow-lg">
          <div className="flex items-center justify-between px-2 pb-2">
            <span className="text-xs text-[color:var(--muted)]">
              {options.length} option{options.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {options.map((option, index) => {
              const isActive = Object.is(selected, option);
              const labelValue = formatLabel ? formatLabel(option) : String(option);

              return (
                <label
                  key={`${menuId}-${index}`}
                  className="flex min-h-[36px] items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-white/10"
                >
                  <input
                    type="radio"
                    name={menuId}
                    checked={isActive}
                    onChange={() => onSelect(option)}
                  />
                  <span>{labelValue}</span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

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

type FavoriteIconButtonProps = {
  slug: string;
  active: boolean;
  variant?: "overlay" | "inline";
};

function FavoriteIconButton({
  slug,
  active,
  variant = "inline",
}: FavoriteIconButtonProps) {
  const sizeClass = variant === "overlay" ? "h-8 w-8 text-sm" : "h-9 w-9 text-base";
  const variantClass =
    variant === "overlay"
      ? "border-white/20 bg-black/40 text-white backdrop-blur-sm"
      : "border-white/10 bg-[color:var(--card)] text-[color:var(--ink)]";
  const stateClass = active ? "ring-2 ring-white/30" : "opacity-70 hover:opacity-100";
  const label = active ? "Retirer des favoris" : "Ajouter aux favoris";

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)] ${sizeClass} ${variantClass} ${stateClass}`}
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(slug);
      }}
    >
      <span aria-hidden="true">{active ? "★" : "☆"}</span>
    </button>
  );
}

function mergeExercises(
  exercises: LiveExerciseListItem[],
  liveExercises: LiveExerciseRow[],
): ExerciseListItem[] {
  if (liveExercises.length === 0) {
    return exercises;
  }

  const mdxItems = exercises.filter((exercise) => !exercise.isLive);
  const existing = new Set(mdxItems.map((exercise) => exercise.slug));
  const liveItems = liveExercises
    .map((row) => ({
      ...(row.data_json as LiveExerciseRow["data_json"] & { status?: ExerciseStatus })
        .frontmatter,
      slug: row.slug,
      isLive: true,
      status: (row.data_json as LiveExerciseRow["data_json"] & { status?: ExerciseStatus })
        .status,
    }))
    .filter((exercise) => !existing.has(exercise.slug));

  return [
    ...mdxItems,
    ...liveItems,
  ].sort((a, b) => {
    const statusA = (a as ExerciseListItem).status ?? "ready";
    const statusB = (b as ExerciseListItem).status ?? "ready";
    if (statusA !== statusB) {
      return statusA === "draft" ? 1 : -1;
    }
    return a.title.localeCompare(b.title, "fr");
  });
}

export function ExerciseListClient({
  exercises,
  liveExercises,
  locale,
}: ExerciseListClientProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [liveRows, setLiveRows] = useState<LiveExerciseRow[]>(liveExercises);
  const [realtimeReady, setRealtimeReady] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<Difficulty[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<ThemeOption[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [openFilter, setOpenFilter] = useState<
    "level" | "equipment" | "tags" | "themes" | "favorites" | null
  >(null);
  const [teacherMode] = useState<TeacherModeSnapshot>(() => getTeacherModeSnapshot());
  const [createStatus, setCreateStatus] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const favorites = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    () => EMPTY_FAVORITES_SERVER_SNAPSHOT,
  );
  const teacherUnlocked = teacherMode.unlocked;
  const teacherPin = teacherMode.pin;

  const viewMode = useSyncExternalStore(
    subscribeViewMode,
    getViewModeSnapshot,
    () => DEFAULT_VIEW_MODE,
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
  const visibleExercises = useMemo(
    () =>
      teacherUnlocked
        ? mergedExercises
        : mergedExercises.filter((exercise) => exercise.status !== "draft"),
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

  const themeOptions = THEME_OPTIONS;

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const selectedHasNoEquipment = selectedEquipment.includes(NO_EQUIPMENT_ID);
    const selectedEquipmentValues = selectedEquipment.filter(
      (item) => item !== NO_EQUIPMENT_ID,
    );

    return visibleExercises.filter((exercise) => {
      if (onlyFavorites && !favorites.includes(exercise.slug)) {
        return false;
      }

      if (selectedLevels.length > 0) {
        if (!exercise.level || !selectedLevels.includes(exercise.level)) {
          return false;
        }
      }

      if (selectedEquipment.length > 0) {
        const exEquipments = (exercise.equipment ?? [])
          .map((item) => item?.trim())
          .filter((item): item is string => Boolean(item));
        const isNoEquipment = exEquipments.length === 0;
        const hasSelectedEquipment =
          selectedEquipmentValues.length > 0 &&
          exEquipments.some((item) => selectedEquipmentValues.includes(item));
        const matches =
          (selectedHasNoEquipment && isNoEquipment) || hasSelectedEquipment;
        if (!matches) {
          return false;
        }
      }

      if (selectedTags.length > 0) {
        const hasTag = selectedTags.some((tag) => exercise.tags.includes(tag));
        if (!hasTag) {
          return false;
        }
      }

      if (selectedThemes.length > 0) {
        const compat = exercise.themeCompatibility ?? [];
        if (compat.length === 0) {
          return false;
        }
        const hasTheme = selectedThemes.some((item) => compat.includes(item));
        if (!hasTheme) {
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
    visibleExercises,
    onlyFavorites,
    query,
    selectedEquipment,
    selectedLevels,
    selectedTags,
    selectedThemes,
  ]);

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

  const handleCreateExercise = async () => {
    if (!teacherUnlocked) {
      return;
    }
    setCreateStatus(null);
    if (!teacherPin) {
      setCreateStatus("PIN requis.");
      return;
    }

    setIsCreating(true);
    setCreateStatus("Création en cours...");

    const existingSlugs = new Set(mergedExercises.map((exercise) => exercise.slug));
    const slug = getUniqueExerciseSlug(existingSlugs);

    let response: Response;
    try {
      response = await fetch("/api/teacher/live-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: teacherPin,
          slug,
          locale,
          dataJson: {
            frontmatter: {
              title: "Nouvel exercice",
              slug,
              tags: [],
              themeCompatibility: [1],
              muscles: [],
            },
            content: NEW_EXERCISE_CONTENT,
            status: "draft",
          },
        }),
      });
    } catch {
      setIsCreating(false);
      setCreateStatus("Échec de la création.");
      return;
    }

    if (!response.ok) {
      setIsCreating(false);
      setCreateStatus(response.status === 401 ? "PIN invalide." : "Échec de la création.");
      return;
    }

    setIsCreating(false);
    setCreateStatus(null);
    router.push(`/exercices/${encodeURIComponent(slug)}?edit=1`);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setStoredViewMode(mode);
  };

  const isGridView = viewMode === "grid";

  return (
    <div className="stack-lg">
      <div className="filter-panel">
        {teacherUnlocked ? (
          <div className="flex flex-wrap items-center gap-3">
            {createStatus ? (
              <span className="text-xs text-[color:var(--muted)]">{createStatus}</span>
            ) : null}
            <button
              type="button"
              className="primary-button primary-button--wide"
              onClick={handleCreateExercise}
              disabled={isCreating}
            >
              {isCreating ? "Création..." : "+ Nouvel exercice"}
            </button>
          </div>
        ) : null}
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
            className="chip chip-clear"
            onClick={() => {
              setQuery("");
              setSelectedLevels([]);
              setSelectedEquipment([]);
              setSelectedTags([]);
              setSelectedThemes([]);
              setOnlyFavorites(false);
              setOpenFilter(null);
            }}
          >
            Réinitialiser
          </button>
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          <MultiSelectMenu
            label="Niveau"
            options={levelOptions}
            selected={selectedLevels}
            onToggleOption={toggleLevel}
            onClear={() => setSelectedLevels([])}
            formatLabel={(value) => LEVEL_LABELS[value]}
            open={openFilter === "level"}
            onToggle={() => toggleFilter("level")}
          />
          <MultiSelectMenu
            label="Matériel"
            options={equipmentOptions}
            selected={selectedEquipment}
            onToggleOption={toggleEquipment}
            onClear={() => setSelectedEquipment([])}
            formatLabel={(value) =>
              value === NO_EQUIPMENT_ID ? NO_EQUIPMENT_LABEL : value
            }
            open={openFilter === "equipment"}
            onToggle={() => toggleFilter("equipment")}
          />
          <MultiSelectMenu
            label="Tags"
            options={tagOptions}
            selected={selectedTags}
            onToggleOption={toggleTag}
            onClear={() => setSelectedTags([])}
            open={openFilter === "tags"}
            onToggle={() => toggleFilter("tags")}
          />
          <MultiSelectMenu
            label="Thèmes"
            options={themeOptions}
            selected={selectedThemes}
            onToggleOption={toggleTheme}
            onClear={() => setSelectedThemes([])}
            formatLabel={(value) => `Thème ${value}`}
            open={openFilter === "themes"}
            onToggle={() => toggleFilter("themes")}
          />
          <SingleSelectMenu
            label="Favoris"
            options={[false, true]}
            selected={onlyFavorites}
            onSelect={(value) => setOnlyFavorites(value)}
            formatLabel={(value) => (value ? "Favoris uniquement" : "Tous")}
            open={openFilter === "favorites"}
            onToggle={() => toggleFilter("favorites")}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[color:var(--muted)]">
          {filtered.length} exercice{filtered.length > 1 ? "s" : ""} trouvé
          {filtered.length > 1 ? "s" : ""}
        </p>
        <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[color:var(--card)] p-1">
          <button
            type="button"
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)] ${
              isGridView
                ? "border-white/20 bg-[color:var(--bg-2)] text-[color:var(--ink)] opacity-100 ring-1 ring-white/30"
                : "border-transparent text-[color:var(--muted)] opacity-60 hover:opacity-100"
            }`}
            aria-pressed={isGridView}
            aria-label="Vue grille"
            title="Vue grille"
            onClick={() => handleViewModeChange("grid")}
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
              <rect x="3" y="3" width="6" height="6" rx="1.5" />
              <rect x="11" y="3" width="6" height="6" rx="1.5" />
              <rect x="3" y="11" width="6" height="6" rx="1.5" />
              <rect x="11" y="11" width="6" height="6" rx="1.5" />
            </svg>
          </button>
          <button
            type="button"
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)] ${
              !isGridView
                ? "border-white/20 bg-[color:var(--bg-2)] text-[color:var(--ink)] opacity-100 ring-1 ring-white/30"
                : "border-transparent text-[color:var(--muted)] opacity-60 hover:opacity-100"
            }`}
            aria-pressed={!isGridView}
            aria-label="Vue liste"
            title="Vue liste"
            onClick={() => handleViewModeChange("list")}
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
              <rect x="3" y="4" width="14" height="2" rx="1" />
              <rect x="3" y="9" width="14" height="2" rx="1" />
              <rect x="3" y="14" width="14" height="2" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      <div className={isGridView ? "card-grid" : "flex flex-col gap-2"}>
        {filtered.length === 0 ? (
          <div className="card">
            <h2>Aucun exercice ne correspond</h2>
            <p>Ajustez vos filtres ou vos mots-clés.</p>
          </div>
        ) : isGridView ? (
          filtered.map((exercise) => (
            <Link key={exercise.slug} href={`/exercices/${exercise.slug}`}>
              <article className="card">
                <ExerciseCard
                  exercise={{
                    ...exercise,
                    title: exercise.title?.trim() || "Brouillon sans titre",
                  }}
                  isLive={exercise.isLive}
                  favoriteAction={
                    <FavoriteIconButton
                      slug={exercise.slug}
                      active={favorites.includes(exercise.slug)}
                      variant="overlay"
                    />
                  }
                />
              </article>
            </Link>
          ))
        ) : (
          filtered.map((exercise) => (
            <Link
              key={exercise.slug}
              href={`/exercices/${exercise.slug}`}
              className="block"
            >
              <article className="rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 shadow-sm backdrop-blur">
                <ExerciseCard
                  exercise={{
                    ...exercise,
                    title: exercise.title?.trim() || "Brouillon sans titre",
                  }}
                  isLive={exercise.isLive}
                  variant="list"
                  favoriteAction={
                    <FavoriteIconButton
                      slug={exercise.slug}
                      active={favorites.includes(exercise.slug)}
                    />
                  }
                />
              </article>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
