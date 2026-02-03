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
} from "@/lib/favoritesStore";

type ExerciseListClientProps = {
  exercises: LiveExerciseListItem[];
  liveExercises: LiveExerciseRow[];
  locale: Lang;
};

type ExerciseStatus = "draft" | "ready";

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

function formatSelectedLabels<T extends MultiSelectValue>(
  selected: readonly T[],
  options: readonly T[],
  formatLabel?: (value: T) => string,
) {
  if (selected.length === 0) {
    return "Tous";
  }

  const getLabel = (value: T) => (formatLabel ? formatLabel(value) : String(value));
  const selectedSet = new Set(selected);
  const orderedLabels = options.filter((option) => selectedSet.has(option)).map(getLabel);
  const labels = orderedLabels.length > 0 ? orderedLabels : selected.map(getLabel);

  if (labels.length === 0) {
    return "Tous";
  }
  if (labels.length === 1) {
    return labels[0];
  }
  if (labels.length === 2) {
    return `${labels[0]}, ${labels[1]}`;
  }
  return `${labels[0]}, ${labels[1]} +${labels.length - 2}`;
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
  const summary = formatSelectedLabels(selected, options, formatLabel);

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="field-input flex items-center justify-between gap-3"
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

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="field-input flex items-center justify-between gap-3"
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
    visibleExercises.forEach((exercise) => {
      exercise.equipment?.forEach((item) => equipmentSet.add(item));
    });
    return Array.from(equipmentSet).sort((a, b) => a.localeCompare(b, "fr"));
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
        const equipment = exercise.equipment ?? [];
        const hasEquipment = selectedEquipment.some((item) => equipment.includes(item));
        if (!hasEquipment) {
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
                <ExerciseCard
                  exercise={{
                    ...exercise,
                    title: exercise.title?.trim() || "Brouillon sans titre",
                  }}
                  isLive={exercise.isLive}
                />
                <div className="chip-row chip-row--compact">
                  {teacherUnlocked && exercise.status === "draft" ? (
                    <span className="pill pill-live">BROUILLON</span>
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
