"use client";

import { useMemo, useState } from "react";
import type { Difficulty } from "@/lib/content/schema";
import { NO_EQUIPMENT_ID } from "@/lib/exercices/filters";
import { MUSCLE_GROUP_IDS, type MuscleGroupId } from "@/lib/exercices/muscleGroups";
import { useI18n } from "@/lib/i18n/I18nProvider";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LEVEL_KEYS: Record<Difficulty, string> = {
  debutant: "difficulty.debutant",
  intermediaire: "difficulty.intermediaire",
  avance: "difficulty.avance",
};

// ---------------------------------------------------------------------------
// ChipRow — compact horizontal chip group (inside open panel)
// ---------------------------------------------------------------------------

type ChipRowProps<T> = {
  label: string;
  options: readonly T[];
  selected: readonly T[];
  onToggle: (value: T) => void;
  formatLabel: (value: T) => string;
};

function ChipRow<T>({
  label,
  options,
  selected,
  onToggle,
  formatLabel,
}: ChipRowProps<T>) {
  if (options.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-[color:var(--muted)] px-1">
        {label}
      </span>
      <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {options.map((option, i) => {
          const isActive = selected.includes(option);
          return (
            <button
              key={i}
              type="button"
              className={`shrink-0 rounded-full text-xs px-2.5 py-1 font-medium transition ${
                isActive
                  ? "bg-orange-500 text-white"
                  : "bg-gray-800/50 text-gray-300 border border-gray-600 hover:border-gray-400"
              }`}
              onClick={() => onToggle(option)}
            >
              {formatLabel(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ExerciseFilters — main exported component
// ---------------------------------------------------------------------------

type ThemeOption = 1 | 2 | 3;

export type ExerciseFiltersProps = {
  query: string;
  onQueryChange: (value: string) => void;
  selectedLevels: Difficulty[];
  onToggleLevel: (level: Difficulty) => void;
  onClearLevels: () => void;
  levelOptions: Difficulty[];
  selectedEquipment: string[];
  onToggleEquipment: (item: string) => void;
  onClearEquipment: () => void;
  equipmentOptions: string[];
  selectedMuscleGroups: MuscleGroupId[];
  onToggleMuscleGroup: (group: MuscleGroupId) => void;
  onClearMuscleGroups: () => void;
  selectedThemes: ThemeOption[];
  onToggleTheme: (theme: ThemeOption) => void;
  onClearThemes: () => void;
  onlyFavorites: boolean;
  onFavoritesChange: (value: boolean) => void;
  onReset: () => void;
};

export function ExerciseFilters({
  query,
  onQueryChange,
  selectedLevels,
  onToggleLevel,
  levelOptions,
  selectedEquipment,
  onToggleEquipment,
  equipmentOptions,
  selectedMuscleGroups,
  onToggleMuscleGroup,
  selectedThemes,
  onToggleTheme,
  onlyFavorites,
  onFavoritesChange,
  onReset,
}: ExerciseFiltersProps) {
  const { t } = useI18n();
  const themeOptions = [1, 2, 3] as const;
  const [open, setOpen] = useState(false);

  // Count active filters
  const activeCount =
    selectedLevels.length +
    selectedEquipment.length +
    selectedMuscleGroups.length +
    selectedThemes.length +
    (onlyFavorites ? 1 : 0);

  // Build active chip labels for the summary bar
  type ActiveChip = { key: string; label: string; remove: () => void };
  const activeChips = useMemo<ActiveChip[]>(() => {
    const chips: ActiveChip[] = [];
    for (const lv of selectedLevels) {
      chips.push({ key: `lv-${lv}`, label: t(LEVEL_KEYS[lv]), remove: () => onToggleLevel(lv) });
    }
    for (const mg of selectedMuscleGroups) {
      chips.push({ key: `mg-${mg}`, label: t(`filters.muscleGroups.${mg}`), remove: () => onToggleMuscleGroup(mg) });
    }
    for (const eq of selectedEquipment) {
      chips.push({ key: `eq-${eq}`, label: eq === NO_EQUIPMENT_ID ? t("filters.noEquipment") : eq, remove: () => onToggleEquipment(eq) });
    }
    for (const th of selectedThemes) {
      chips.push({ key: `th-${th}`, label: t(`filters.themeName.${th}`), remove: () => onToggleTheme(th) });
    }
    return chips;
  }, [selectedLevels, selectedMuscleGroups, selectedEquipment, selectedThemes, t, onToggleLevel, onToggleMuscleGroup, onToggleEquipment, onToggleTheme]);

  return (
    <div className="flex flex-col gap-2">
      {/* Search bar */}
      <input
        className="field-input"
        type="search"
        placeholder={t("filters.search")}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />

      {/* Summary bar: filter toggle + active chips + favorites + reset */}
      <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 scrollbar-none items-center">
        {/* Filter toggle button */}
        <button
          type="button"
          className="shrink-0 flex items-center gap-1.5 rounded-full bg-gray-800 border border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-200 transition hover:border-gray-400"
          onClick={() => setOpen((prev) => !prev)}
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M1 2a1 1 0 011-1h12a1 1 0 01.8 1.6L10 9.3V13a1 1 0 01-.55.9l-2 1A1 1 0 016 14V9.3L1.2 2.6A1 1 0 011 2z" />
          </svg>
          <span>{t("filters.filterButton")}</span>
          {activeCount > 0 && (
            <span className="flex items-center justify-center h-5 min-w-[20px] rounded-full bg-orange-500 text-white text-xs font-bold px-1">
              {activeCount}
            </span>
          )}
        </button>

        {/* Active filter chips */}
        {activeChips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className="shrink-0 flex items-center gap-1 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-200 text-xs px-2.5 py-1 font-medium transition hover:bg-orange-500/30"
            onClick={chip.remove}
          >
            {chip.label}
            <svg aria-hidden="true" viewBox="0 0 12 12" fill="currentColor" className="h-3 w-3 opacity-70">
              <path d="M3.17 3.17a.5.5 0 01.7 0L6 5.3l2.13-2.13a.5.5 0 01.7.7L6.71 6l2.12 2.13a.5.5 0 01-.7.7L6 6.71 3.87 8.83a.5.5 0 01-.7-.7L5.3 6 3.17 3.87a.5.5 0 010-.7z" />
            </svg>
          </button>
        ))}

        {/* Favorites toggle */}
        <button
          type="button"
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
            onlyFavorites
              ? "bg-yellow-500 text-white"
              : "border border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-400"
          }`}
          onClick={() => onFavoritesChange(!onlyFavorites)}
        >
          {onlyFavorites ? "\u2605" : "\u2606"} {t("filters.favorites")}
        </button>

        {/* Reset */}
        {activeCount > 0 && (
          <button
            type="button"
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-gray-400 border border-gray-700 hover:text-gray-200 hover:border-gray-500 transition"
            onClick={onReset}
          >
            {t("filters.reset")}
          </button>
        )}
      </div>

      {/* Collapsible filter panel */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? "600px" : "0px", opacity: open ? 1 : 0 }}
      >
        <div className="flex flex-col gap-3 pt-1 pb-2">
          <ChipRow
            label={t("filters.level")}
            options={levelOptions}
            selected={selectedLevels}
            onToggle={onToggleLevel}
            formatLabel={(value) => t(LEVEL_KEYS[value])}
          />
          <ChipRow
            label={t("filters.muscles")}
            options={MUSCLE_GROUP_IDS as unknown as readonly MuscleGroupId[]}
            selected={selectedMuscleGroups}
            onToggle={onToggleMuscleGroup}
            formatLabel={(value) => t(`filters.muscleGroups.${value}`)}
          />
          <ChipRow
            label={t("filters.equipment")}
            options={equipmentOptions}
            selected={selectedEquipment}
            onToggle={onToggleEquipment}
            formatLabel={(value) =>
              value === NO_EQUIPMENT_ID ? t("filters.noEquipment") : value
            }
          />
          <ChipRow
            label={t("filters.themes")}
            options={themeOptions}
            selected={selectedThemes}
            onToggle={onToggleTheme}
            formatLabel={(value) => t(`filters.themeName.${value}`)}
          />
        </div>
      </div>
    </div>
  );
}
