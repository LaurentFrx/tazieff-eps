// Phase B.1.3 — hook encapsulating pill dropdown state & handlers for
// the teacher override editor. Output shape matches OverridePillsContextValue
// so it can be passed directly to <OverridePillsProvider value={...}>.
//
// pillState (memo) reads overrideDoc and is also consumed outside the modal
// (for render of tagPills). It stays in the parent, is passed as input to
// this hook, and is re-exposed in the return so the context provider sees
// a coherent value.
//
// The 3 createPortal instances stay in the parent JSX (modal). This hook
// only provides states/refs/handlers for the dropdowns.

"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { ExerciseLiveDocV2 } from "@/lib/live/types";
import type {
  OverridePillsContextValue,
  PillCategory,
  PillCustomOptionsState,
  PillDropdownStyle,
  PillSearchState,
  PillSelections,
  PillState,
} from "../contexts";
import {
  DROPDOWN_MAX_HEIGHT,
  normalizeKey,
  normalizeLabel,
  uniqueLabels,
} from "../lib/pill-utils";

export type UsePillDropdownInput = {
  pillState: PillState;
  pillCustomOptions: PillCustomOptionsState;
  setPillCustomOptions: Dispatch<SetStateAction<PillCustomOptionsState>>;
  updateOverrideDoc: (
    updater: (doc: ExerciseLiveDocV2) => ExerciseLiveDocV2,
  ) => void;
};

export function usePillDropdown(
  input: UsePillDropdownInput,
): OverridePillsContextValue {
  const {
    pillState,
    pillCustomOptions,
    setPillCustomOptions,
    updateOverrideDoc,
  } = input;

  const [pillDropdownOpen, setPillDropdownOpen] = useState<null | PillCategory>(
    null,
  );
  const [pillSearch, setPillSearch] = useState<PillSearchState>({
    type: "",
    muscles: "",
    themes: "",
  });
  const [levelAddOpen, setLevelAddOpen] = useState(false);
  const [levelAddValue, setLevelAddValue] = useState("");
  const [pillDropdownStyle, setPillDropdownStyle] = useState<PillDropdownStyle>(
    null,
  );

  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const dropdownTriggerRefs = useRef<
    Record<PillCategory, HTMLButtonElement | null>
  >({
    type: null,
    muscles: null,
    themes: null,
  });

  const updateDropdownPosition = (category: PillCategory) => {
    const trigger = dropdownTriggerRefs.current[category];
    if (!trigger) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const padding = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    let placement: "top" | "bottom" = "bottom";
    let top = rect.bottom + window.scrollY + 6;
    if (spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > DROPDOWN_MAX_HEIGHT) {
      placement = "top";
      top = rect.top + window.scrollY - DROPDOWN_MAX_HEIGHT - 6;
    }
    setPillDropdownStyle({
      top: Math.max(padding + window.scrollY, top),
      left: rect.left + window.scrollX,
      width: rect.width,
      placement,
    });
  };

  useEffect(() => {
    if (!pillDropdownOpen) {
      return;
    }

    updateDropdownPosition(pillDropdownOpen);

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      const menu = dropdownMenuRef.current;
      const trigger = dropdownTriggerRefs.current[pillDropdownOpen];
      if (menu && target && menu.contains(target)) {
        return;
      }
      if (trigger && target && trigger.contains(target)) {
        return;
      }
      setPillDropdownOpen(null);
      setPillDropdownStyle(null);
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPillDropdownOpen(null);
        setPillDropdownStyle(null);
      }
    };

    const handleReposition = () => {
      updateDropdownPosition(pillDropdownOpen);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pillDropdownOpen]);

  const updatePillSelections = (next: PillSelections) => {
    updateOverrideDoc((doc) => {
      const existing = doc.doc.pills ?? [];
      const kindMap = new Map<string, string | undefined>(
        existing.map((pill) => [normalizeKey(pill.label), pill.kind]),
      );
      const buildPills = (labels: string[], fallbackKind: string) =>
        labels.map((label) => {
          const cleanLabel = normalizeLabel(label);
          const key = normalizeKey(cleanLabel);
          const kind = kindMap.get(key) ?? fallbackKind;
          return kind ? { label: cleanLabel, kind } : { label: cleanLabel };
        });

      const nextPills = [
        ...(next.level ? buildPills([next.level], "level") : []),
        ...buildPills(uniqueLabels(next.type), "type"),
        ...buildPills(uniqueLabels(next.muscles), "muscle"),
        ...buildPills(uniqueLabels(next.themes), "theme"),
      ];

      return {
        ...doc,
        doc: {
          ...doc.doc,
          pills: nextPills,
        },
      };
    });
  };

  const setLevelSelection = (value: string) => {
    const clean = normalizeLabel(value);
    updatePillSelections({
      ...pillState.selections,
      level: clean,
    });
  };

  const addCustomLevel = () => {
    const term = normalizeLabel(levelAddValue);
    if (!term) {
      return;
    }
    setPillCustomOptions((prev) => ({
      ...prev,
      level: uniqueLabels([...prev.level, term]),
    }));
    setLevelSelection(term);
    setLevelAddValue("");
    setLevelAddOpen(false);
  };

  const toggleMultiSelection = (category: PillCategory, value: string) => {
    const clean = normalizeLabel(value);
    if (!clean) {
      return;
    }
    const current = pillState.selections[category];
    const exists = current.some(
      (item) => normalizeKey(item) === normalizeKey(clean),
    );
    const nextValues = exists
      ? current.filter((item) => normalizeKey(item) !== normalizeKey(clean))
      : [...current, clean];
    updatePillSelections({
      ...pillState.selections,
      [category]: nextValues,
    });
  };

  const addCustomOption = (category: PillCategory) => {
    const term = normalizeLabel(pillSearch[category]);
    if (!term) {
      return;
    }
    setPillCustomOptions((prev) => ({
      ...prev,
      [category]: uniqueLabels([...prev[category], term]),
    }));
    setPillSearch((prev) => ({ ...prev, [category]: "" }));
    const current = pillState.selections[category];
    if (!current.some((item) => normalizeKey(item) === normalizeKey(term))) {
      updatePillSelections({
        ...pillState.selections,
        [category]: [...current, term],
      });
    }
  };

  const toggleDropdown = (category: PillCategory) => {
    setPillDropdownOpen((open) => {
      const next = open === category ? null : category;
      if (next) {
        requestAnimationFrame(() => updateDropdownPosition(next));
      } else {
        setPillDropdownStyle(null);
      }
      return next;
    });
  };

  return {
    pillDropdownOpen,
    pillSearch,
    pillCustomOptions,
    pillDropdownStyle,
    levelAddOpen,
    levelAddValue,
    setPillDropdownOpen,
    setPillSearch,
    setPillCustomOptions,
    setPillDropdownStyle,
    setLevelAddOpen,
    setLevelAddValue,
    dropdownMenuRef,
    dropdownTriggerRefs,
    pillState,
    updatePillSelections,
    setLevelSelection,
    addCustomLevel,
    toggleMultiSelection,
    addCustomOption,
    toggleDropdown,
    updateDropdownPosition,
  };
}

// Explicit re-exports to keep the Dispatch/SetStateAction types accessible
// in the hook file for maintainability (they are implicitly inferred from
// useState/useRef calls above but appear here for clarity).
export type { Dispatch, SetStateAction };
