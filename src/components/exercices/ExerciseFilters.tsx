"use client";

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
// ChipRow — scrollable horizontal chip group
// ---------------------------------------------------------------------------

type ChipRowProps<T> = {
  label: string;
  options: readonly T[];
  selected: readonly T[];
  onToggle: (value: T) => void;
  onClear: () => void;
  formatLabel: (value: T) => string;
  allLabel: string;
};

function ChipRow<T>({
  label,
  options,
  selected,
  onToggle,
  onClear,
  formatLabel,
  allLabel,
}: ChipRowProps<T>) {
  if (options.length === 0) return null;

  const isAllSelected = selected.length === 0;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-[color:var(--muted)] uppercase tracking-wide px-1">
        {label}
      </span>
      <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
            isAllSelected
              ? "bg-[color:var(--accent)] text-white"
              : "border border-white/15 text-[color:var(--muted)] hover:border-white/30"
          }`}
          onClick={onClear}
        >
          {allLabel}
        </button>
        {options.map((option, i) => {
          const isActive = selected.includes(option);
          return (
            <button
              key={i}
              type="button"
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-[color:var(--accent)] text-white"
                  : "border border-white/15 text-[color:var(--muted)] hover:border-white/30"
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
  onClearLevels,
  levelOptions,
  selectedEquipment,
  onToggleEquipment,
  onClearEquipment,
  equipmentOptions,
  selectedMuscleGroups,
  onToggleMuscleGroup,
  onClearMuscleGroups,
  selectedThemes,
  onToggleTheme,
  onClearThemes,
  onlyFavorites,
  onFavoritesChange,
  onReset,
}: ExerciseFiltersProps) {
  const { t } = useI18n();
  const themeOptions = [1, 2, 3] as const;

  return (
    <div className="flex flex-col gap-3">
      {/* Search + reset */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0 basis-full sm:basis-auto">
          <input
            className="field-input"
            type="search"
            placeholder={t("filters.search")}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
        <div className="chip-row shrink-0 flex gap-2">
          <button
            type="button"
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              onlyFavorites
                ? "bg-yellow-500 text-white"
                : "border border-white/15 text-[color:var(--muted)] hover:border-white/30"
            }`}
            onClick={() => onFavoritesChange(!onlyFavorites)}
          >
            {onlyFavorites ? "★ " : "☆ "}{t("filters.favorites")}
          </button>
          <button
            type="button"
            className="chip chip-clear px-3 py-2"
            onClick={onReset}
          >
            {t("filters.reset")}
          </button>
        </div>
      </div>

      {/* Chip filter rows */}
      <ChipRow
        label={t("filters.level")}
        options={levelOptions}
        selected={selectedLevels}
        onToggle={onToggleLevel}
        onClear={onClearLevels}
        formatLabel={(value) => t(LEVEL_KEYS[value])}
        allLabel={t("filters.all")}
      />
      <ChipRow
        label={t("filters.muscles")}
        options={MUSCLE_GROUP_IDS as unknown as readonly MuscleGroupId[]}
        selected={selectedMuscleGroups}
        onToggle={onToggleMuscleGroup}
        onClear={onClearMuscleGroups}
        formatLabel={(value) => t(`filters.muscleGroups.${value}`)}
        allLabel={t("filters.all")}
      />
      <ChipRow
        label={t("filters.equipment")}
        options={equipmentOptions}
        selected={selectedEquipment}
        onToggle={onToggleEquipment}
        onClear={onClearEquipment}
        formatLabel={(value) =>
          value === NO_EQUIPMENT_ID ? t("filters.noEquipment") : value
        }
        allLabel={t("filters.all")}
      />
      <ChipRow
        label={t("filters.themes")}
        options={themeOptions}
        selected={selectedThemes}
        onToggle={onToggleTheme}
        onClear={onClearThemes}
        formatLabel={(value) => t(`filters.themeName.${value}`)}
        allLabel={t("filters.all")}
      />
    </div>
  );
}
