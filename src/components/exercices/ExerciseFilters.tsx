"use client";

import { useId } from "react";
import type { Difficulty } from "@/lib/content/schema";
import { NO_EQUIPMENT_ID } from "@/lib/exercices/filters";
import { useI18n } from "@/lib/i18n/I18nProvider";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHIP_VARIANTS = [
  "bg-blue-500/10 border-blue-400/30 text-blue-100",
  "bg-emerald-500/10 border-emerald-400/30 text-emerald-100",
  "bg-violet-500/10 border-violet-400/30 text-violet-100",
  "bg-amber-500/10 border-amber-400/30 text-amber-100",
  "bg-cyan-500/10 border-cyan-400/30 text-cyan-100",
  "bg-rose-500/10 border-rose-400/30 text-rose-100",
] as const;

const LEVEL_KEYS: Record<Difficulty, string> = {
  debutant: "difficulty.debutant",
  intermediaire: "difficulty.intermediaire",
  avance: "difficulty.avance",
};

// ---------------------------------------------------------------------------
// Generic menu helpers
// ---------------------------------------------------------------------------

type MultiSelectValue = string | number;

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
  allLabel = "Tous",
) {
  if (selected.length === 0) {
    return <span className="text-xs text-[color:var(--muted)]">{allLabel}</span>;
  }

  const selectedSet = new Set(selected);
  const orderedValues = options.filter((option) => selectedSet.has(option));
  const values = orderedValues.length > 0 ? orderedValues : selected;
  const getLabel = (value: T) => (formatLabel ? formatLabel(value) : String(value));

  return values.map((value) => (
    <span
      key={`chip-${String(value)}`}
      className={`rounded-full border px-2 py-0.5 text-[13px] font-medium ${chipVariant(value)}`}
    >
      {getLabel(value)}
    </span>
  ));
}

// ---------------------------------------------------------------------------
// MultiSelectMenu
// ---------------------------------------------------------------------------

type MultiSelectMenuProps<T extends MultiSelectValue> = {
  label: string;
  options: readonly T[];
  selected: readonly T[];
  onToggleOption: (value: T) => void;
  onClear: () => void;
  formatLabel?: (value: T) => string;
  allLabel?: string;
  clearLabel?: string;
  open: boolean;
  onToggle: () => void;
};

function MultiSelectMenu<T extends MultiSelectValue>({
  label,
  options,
  selected,
  onToggleOption,
  onClear,
  formatLabel,
  allLabel,
  clearLabel,
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
            {renderSelectedChips(selected, options, formatLabel, allLabel)}
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
                {clearLabel ?? "Tout effacer"}
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

// ---------------------------------------------------------------------------
// SingleSelectMenu
// ---------------------------------------------------------------------------

type SingleSelectMenuProps<T> = {
  label: string;
  options: readonly T[];
  selected: T;
  onSelect: (value: T) => void;
  formatLabel?: (value: T) => string;
  open: boolean;
  onToggle: () => void;
};

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
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  tagOptions: string[];
  selectedThemes: ThemeOption[];
  onToggleTheme: (theme: ThemeOption) => void;
  onClearThemes: () => void;
  onlyFavorites: boolean;
  onFavoritesChange: (value: boolean) => void;
  openFilter: "level" | "equipment" | "tags" | "themes" | "favorites" | null;
  onToggleFilter: (filter: "level" | "equipment" | "tags" | "themes" | "favorites") => void;
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
  selectedTags,
  onToggleTag,
  onClearTags,
  tagOptions,
  selectedThemes,
  onToggleTheme,
  onClearThemes,
  onlyFavorites,
  onFavoritesChange,
  openFilter,
  onToggleFilter,
  onReset,
}: ExerciseFiltersProps) {
  const { t } = useI18n();
  const themeOptions = [1, 2, 3] as const;

  return (
    <>
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
        <div className="chip-row shrink-0">
          <button
            type="button"
            className="chip chip-clear px-3 py-2"
            onClick={onReset}
          >
            {t("filters.reset")}
          </button>
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-4">
        <MultiSelectMenu
          label={t("filters.level")}
          options={levelOptions}
          selected={selectedLevels}
          onToggleOption={onToggleLevel}
          onClear={onClearLevels}
          formatLabel={(value) => t(LEVEL_KEYS[value])}
          allLabel={t("filters.all")}
          clearLabel={t("filters.clearAll")}
          open={openFilter === "level"}
          onToggle={() => onToggleFilter("level")}
        />
        <MultiSelectMenu
          label={t("filters.equipment")}
          options={equipmentOptions}
          selected={selectedEquipment}
          onToggleOption={onToggleEquipment}
          onClear={onClearEquipment}
          formatLabel={(value) =>
            value === NO_EQUIPMENT_ID ? t("filters.noEquipment") : value
          }
          allLabel={t("filters.all")}
          clearLabel={t("filters.clearAll")}
          open={openFilter === "equipment"}
          onToggle={() => onToggleFilter("equipment")}
        />
        <MultiSelectMenu
          label={t("filters.tags")}
          options={tagOptions}
          selected={selectedTags}
          onToggleOption={onToggleTag}
          onClear={onClearTags}
          allLabel={t("filters.all")}
          clearLabel={t("filters.clearAll")}
          open={openFilter === "tags"}
          onToggle={() => onToggleFilter("tags")}
        />
        <MultiSelectMenu
          label={t("filters.themes")}
          options={themeOptions}
          selected={selectedThemes}
          onToggleOption={onToggleTheme}
          onClear={onClearThemes}
          formatLabel={(value) => `${t("filters.themePrefix")} ${value}`}
          allLabel={t("filters.all")}
          clearLabel={t("filters.clearAll")}
          open={openFilter === "themes"}
          onToggle={() => onToggleFilter("themes")}
        />
        <SingleSelectMenu
          label={t("filters.favorites")}
          options={[false, true]}
          selected={onlyFavorites}
          onSelect={(value) => onFavoritesChange(value)}
          formatLabel={(value) => (value ? t("filters.favoritesOnly") : t("filters.all"))}
          open={openFilter === "favorites"}
          onToggle={() => onToggleFilter("favorites")}
        />
      </div>
    </>
  );
}
