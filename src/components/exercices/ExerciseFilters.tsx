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
// FilterChip — single chip with staggered appear animation
// ---------------------------------------------------------------------------

type FilterChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
  animIndex: number;
};

function FilterChip({ label, active, onClick, animIndex }: FilterChipProps) {
  return (
    <button
      type="button"
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium min-h-[44px] transition-all duration-200 select-none ${
        active
          ? "bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]"
          : "bg-white/10 text-zinc-300 border border-white/10 hover:border-white/25"
      }`}
      style={{ animation: `chip-appear 250ms ease-out ${animIndex * 50}ms both` }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// ActiveChipBadge — removable badge for active secondary filters
// ---------------------------------------------------------------------------

function ActiveChipBadge({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      className="shrink-0 flex items-center gap-1.5 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-200 text-sm px-3 py-1.5 min-h-[44px] font-medium transition-colors duration-200 hover:bg-orange-500/30"
      onClick={onRemove}
    >
      {label}
      <svg
        aria-hidden="true"
        viewBox="0 0 12 12"
        fill="currentColor"
        className="h-3 w-3 opacity-70"
      >
        <path d="M3.17 3.17a.5.5 0 01.7 0L6 5.3l2.13-2.13a.5.5 0 01.7.7L6.71 6l2.12 2.13a.5.5 0 01-.7.7L6 6.71 3.87 8.83a.5.5 0 01-.7-.7L5.3 6 3.17 3.87a.5.5 0 010-.7z" />
      </svg>
    </button>
  );
}

// ---------------------------------------------------------------------------
// ChipGroup — labelled row with "Tous" reset + scrollable chips
// ---------------------------------------------------------------------------

type ChipGroupProps<T> = {
  label: string;
  options: readonly T[];
  selected: readonly T[];
  onToggle: (value: T) => void;
  onClear: () => void;
  formatLabel: (value: T) => string;
  allLabel: string;
  baseIndex?: number;
};

function ChipGroup<T>({
  label,
  options,
  selected,
  onToggle,
  onClear,
  formatLabel,
  allLabel,
  baseIndex = 0,
}: ChipGroupProps<T>) {
  if (options.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-zinc-500 px-1">{label}</span>
      <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 scrollbar-none">
        <FilterChip
          label={allLabel}
          active={selected.length === 0}
          onClick={onClear}
          animIndex={baseIndex}
        />
        {options.map((option, i) => (
          <FilterChip
            key={String(option)}
            label={formatLabel(option)}
            active={selected.includes(option)}
            onClick={() => onToggle(option)}
            animIndex={baseIndex + i + 1}
          />
        ))}
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
  const [open, setOpen] = useState(false);

  // Active secondary filter chips (level, equipment, themes — groups hidden by default)
  type ActiveChip = { key: string; label: string; remove: () => void };
  const activeSecondaryChips = useMemo<ActiveChip[]>(() => {
    const chips: ActiveChip[] = [];
    for (const lv of selectedLevels) {
      chips.push({
        key: `lv-${lv}`,
        label: t(LEVEL_KEYS[lv]),
        remove: () => onToggleLevel(lv),
      });
    }
    for (const eq of selectedEquipment) {
      chips.push({
        key: `eq-${eq}`,
        label: eq === NO_EQUIPMENT_ID ? t("filters.noEquipment") : eq,
        remove: () => onToggleEquipment(eq),
      });
    }
    for (const th of selectedThemes) {
      chips.push({
        key: `th-${th}`,
        label: t(`filters.themeName.${th}`),
        remove: () => onToggleTheme(th),
      });
    }
    return chips;
  }, [
    selectedLevels,
    selectedEquipment,
    selectedThemes,
    t,
    onToggleLevel,
    onToggleEquipment,
    onToggleTheme,
  ]);

  const hasSecondaryFilters = activeSecondaryChips.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* ── Search bar (always visible) ──────────────────────────── */}
      <input
        className="field-input"
        type="search"
        placeholder={t("filters.search")}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />

      {/* ── Row 1: Muscles + Favorites + Expand button ───────────── */}
      <div className="flex items-center gap-2">
        {/* Muscles chips — scrollable */}
        <div className="flex-1 min-w-0 overflow-x-auto scrollbar-none">
          <div className="flex flex-nowrap gap-2 pb-1">
            <FilterChip
              label={t("filters.all")}
              active={selectedMuscleGroups.length === 0}
              onClick={onClearMuscleGroups}
              animIndex={0}
            />
            {MUSCLE_GROUP_IDS.map((group, i) => (
              <FilterChip
                key={group}
                label={t(`filters.muscleGroups.${group}`)}
                active={selectedMuscleGroups.includes(group)}
                onClick={() => onToggleMuscleGroup(group)}
                animIndex={i + 1}
              />
            ))}
          </div>
        </div>

        {/* Favorites toggle */}
        <button
          type="button"
          className={`shrink-0 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center text-base font-medium transition-all duration-200 select-none ${
            onlyFavorites
              ? "bg-yellow-500 text-white shadow-[0_0_12px_rgba(234,179,8,0.4)]"
              : "bg-white/10 border border-white/10 text-zinc-300 hover:border-white/25"
          }`}
          onClick={() => onFavoritesChange(!onlyFavorites)}
          aria-label={t("filters.favorites")}
        >
          {onlyFavorites ? "\u2605" : "\u2606"}
        </button>

        {/* Expand / collapse secondary filters */}
        <button
          type="button"
          className={`shrink-0 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center text-lg font-bold transition-all duration-300 select-none ${
            open
              ? "bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]"
              : "bg-white/10 border border-white/10 text-zinc-300 hover:border-white/25"
          }`}
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
          onClick={() => setOpen((prev) => !prev)}
          aria-label={t("filters.moreFilters")}
          aria-expanded={open}
        >
          +
        </button>
      </div>

      {/* ── Active secondary chips (visible when panel is closed) ── */}
      {!open && hasSecondaryFilters && (
        <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 scrollbar-none items-center">
          {activeSecondaryChips.map((chip) => (
            <ActiveChipBadge
              key={chip.key}
              label={chip.label}
              onRemove={chip.remove}
            />
          ))}
          <button
            type="button"
            className="shrink-0 rounded-full px-3 py-1.5 min-h-[44px] text-xs font-medium text-zinc-400 border border-zinc-700 hover:text-zinc-200 hover:border-zinc-500 transition-colors duration-200"
            onClick={onReset}
          >
            {t("filters.reset")}
          </button>
        </div>
      )}

      {/* ── Expandable secondary filters ─────────────────────────── */}
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ maxHeight: open ? "500px" : "0px", opacity: open ? 1 : 0 }}
      >
        <div className="flex flex-col gap-4 pt-1 pb-2">
          <ChipGroup
            label={t("filters.level")}
            options={levelOptions}
            selected={selectedLevels}
            onToggle={onToggleLevel}
            onClear={onClearLevels}
            formatLabel={(v) => t(LEVEL_KEYS[v])}
            allLabel={t("filters.all")}
            baseIndex={0}
          />
          <ChipGroup
            label={t("filters.equipment")}
            options={equipmentOptions}
            selected={selectedEquipment}
            onToggle={onToggleEquipment}
            onClear={onClearEquipment}
            formatLabel={(v) =>
              v === NO_EQUIPMENT_ID ? t("filters.noEquipment") : v
            }
            allLabel={t("filters.all")}
            baseIndex={levelOptions.length + 1}
          />
          <ChipGroup
            label={t("filters.themes")}
            options={themeOptions}
            selected={selectedThemes}
            onToggle={onToggleTheme}
            onClear={onClearThemes}
            formatLabel={(v) => t(`filters.themeName.${v}`)}
            allLabel={t("filters.all")}
            baseIndex={levelOptions.length + equipmentOptions.length + 2}
          />
          {hasSecondaryFilters && (
            <button
              type="button"
              className="self-start rounded-full px-4 py-2 min-h-[44px] text-sm font-medium text-zinc-400 border border-zinc-700 hover:text-zinc-200 hover:border-zinc-500 transition-colors duration-200"
              onClick={onReset}
            >
              {t("filters.reset")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
