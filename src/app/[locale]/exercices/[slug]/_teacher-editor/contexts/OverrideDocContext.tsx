// Phase B.0 — thematic context for teacher override editor.
// Created to enable later extraction of the editor into a lazy-loaded child.
// Source of truth remains in ExerciseLiveDetail.tsx parent.

"use client";

import { createContext, useContext, type Dispatch, type MutableRefObject, type ReactNode, type SetStateAction } from "react";
import type { ExerciseRenderOverride } from "@/lib/live/patch";
import type { ExerciseLiveDocV2, ExerciseLiveSection } from "@/lib/live/types";

export type OverrideToast = {
  message: string;
  tone: "success" | "error";
};

export type SaveMeta = {
  status: "draft" | "ready";
  missing: string[];
  tags: string[];
  muscles: string[];
};

export type OverrideDocContextValue = {
  overrideDoc: ExerciseLiveDocV2 | null;
  dirtySnapshot: string;
  isDirty: boolean;
  overrideOpen: boolean;
  isSavingOverride: boolean;
  overrideToast: OverrideToast | null;
  submitStatus: string | null;

  setOverrideDoc: Dispatch<SetStateAction<ExerciseLiveDocV2 | null>>;
  setDirtySnapshot: Dispatch<SetStateAction<string>>;
  setOverrideOpen: Dispatch<SetStateAction<boolean>>;
  setIsSavingOverride: Dispatch<SetStateAction<boolean>>;
  setOverrideToast: Dispatch<SetStateAction<OverrideToast | null>>;
  setSubmitStatus: Dispatch<SetStateAction<string | null>>;

  toastTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;

  merged: ExerciseRenderOverride;
  overrideSnapshot: string;
  saveMeta: SaveMeta;

  handleSaveOverride: () => Promise<void>;
  handleCloseOverride: () => void;
  handleCloseWithoutSave: () => void;
  handleDiscardOverride: () => void;
  handleAuthError: (message: string) => void;
  updateOverrideDoc: (updater: (doc: ExerciseLiveDocV2) => ExerciseLiveDocV2) => void;
  updateSection: (
    sectionId: string,
    updater: (section: ExerciseLiveSection) => ExerciseLiveSection,
  ) => void;
  showOverrideToast: (message: string, tone: "success" | "error") => void;
};

const OverrideDocContext = createContext<OverrideDocContextValue | null>(null);

export function OverrideDocProvider({
  value,
  children,
}: {
  value: OverrideDocContextValue;
  children: ReactNode;
}) {
  return (
    <OverrideDocContext.Provider value={value}>
      {children}
    </OverrideDocContext.Provider>
  );
}

export function useOverrideDocContext(): OverrideDocContextValue {
  const ctx = useContext(OverrideDocContext);
  if (!ctx) {
    throw new Error(
      "useOverrideDocContext must be used within an OverrideDocProvider",
    );
  }
  return ctx;
}
