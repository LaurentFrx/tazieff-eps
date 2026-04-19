// Phase B.0 — thematic context for teacher override editor.
// Created to enable later extraction of the editor into a lazy-loaded child.
// Source of truth remains in ExerciseLiveDetail.tsx parent.

"use client";

import { createContext, useContext, type Dispatch, type MutableRefObject, type ReactNode, type SetStateAction } from "react";

export type PillCategory = "type" | "muscles" | "themes";

export type PillSearchState = {
  type: string;
  muscles: string;
  themes: string;
};

export type PillCustomOptionsState = {
  level: string[];
  type: string[];
  muscles: string[];
  themes: string[];
};

export type PillDropdownStyle = {
  top: number;
  left: number;
  width: number;
  placement: "top" | "bottom";
} | null;

export type PillSelections = {
  level: string;
  type: string[];
  muscles: string[];
  themes: string[];
};

export type PillOptions = {
  level: string[];
  type: string[];
  muscles: string[];
  themes: string[];
};

export type PillState = {
  selections: PillSelections;
  options: PillOptions;
};

export type OverridePillsContextValue = {
  pillDropdownOpen: null | PillCategory;
  pillSearch: PillSearchState;
  pillCustomOptions: PillCustomOptionsState;
  pillDropdownStyle: PillDropdownStyle;
  levelAddOpen: boolean;
  levelAddValue: string;

  setPillDropdownOpen: Dispatch<SetStateAction<null | PillCategory>>;
  setPillSearch: Dispatch<SetStateAction<PillSearchState>>;
  setPillCustomOptions: Dispatch<SetStateAction<PillCustomOptionsState>>;
  setPillDropdownStyle: Dispatch<SetStateAction<PillDropdownStyle>>;
  setLevelAddOpen: Dispatch<SetStateAction<boolean>>;
  setLevelAddValue: Dispatch<SetStateAction<string>>;

  dropdownMenuRef: MutableRefObject<HTMLDivElement | null>;
  dropdownTriggerRefs: MutableRefObject<
    Record<PillCategory, HTMLButtonElement | null>
  >;

  pillState: PillState;

  updatePillSelections: (next: PillSelections) => void;
  setLevelSelection: (value: string) => void;
  addCustomLevel: () => void;
  toggleMultiSelection: (category: PillCategory, value: string) => void;
  addCustomOption: (category: PillCategory) => void;
  toggleDropdown: (category: PillCategory) => void;
  updateDropdownPosition: (category: PillCategory) => void;
};

const OverridePillsContext = createContext<OverridePillsContextValue | null>(null);

export function OverridePillsProvider({
  value,
  children,
}: {
  value: OverridePillsContextValue;
  children: ReactNode;
}) {
  return (
    <OverridePillsContext.Provider value={value}>
      {children}
    </OverridePillsContext.Provider>
  );
}

export function useOverridePillsContext(): OverridePillsContextValue {
  const ctx = useContext(OverridePillsContext);
  if (!ctx) {
    throw new Error(
      "useOverridePillsContext must be used within an OverridePillsProvider",
    );
  }
  return ctx;
}
