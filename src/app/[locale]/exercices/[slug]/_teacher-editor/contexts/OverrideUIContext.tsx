// Phase B.0 — thematic context for teacher override editor.
// Created to enable later extraction of the editor into a lazy-loaded child.
// Source of truth remains in ExerciseLiveDetail.tsx parent.

"use client";

import { createContext, useContext, type Dispatch, type MutableRefObject, type ReactNode, type SetStateAction } from "react";

export type OverrideUIContextValue = {
  activeSectionId: string | null;
  sectionMenuOpenId: string | null;
  blockMenuOpenKey: string | null;
  highlightBlockKey: string | null;
  addBlockMenuOpen: boolean;
  confirmCloseOpen: boolean;
  deleteLiveOpen: boolean;
  isDeletingLive: boolean;
  liveExists: boolean;
  teacherPin: string;

  setActiveSectionId: Dispatch<SetStateAction<string | null>>;
  setSectionMenuOpenId: Dispatch<SetStateAction<string | null>>;
  setBlockMenuOpenKey: Dispatch<SetStateAction<string | null>>;
  setHighlightBlockKey: Dispatch<SetStateAction<string | null>>;
  setAddBlockMenuOpen: Dispatch<SetStateAction<boolean>>;
  setConfirmCloseOpen: Dispatch<SetStateAction<boolean>>;
  setDeleteLiveOpen: Dispatch<SetStateAction<boolean>>;
  setIsDeletingLive: Dispatch<SetStateAction<boolean>>;
  setLiveExists: Dispatch<SetStateAction<boolean>>;
  setTeacherPin: Dispatch<SetStateAction<string>>;

  sectionTitleRefs: MutableRefObject<Record<string, HTMLInputElement | null>>;
  blockFieldRefs: MutableRefObject<
    Record<string, HTMLInputElement | HTMLTextAreaElement | null>
  >;
  blockContainerRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  highlightTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  addBlockMenuRef: MutableRefObject<HTMLDivElement | null>;
  addBlockButtonRef: MutableRefObject<HTMLButtonElement | null>;

  handleAddSection: () => void;
  handleMoveSection: (sectionId: string, direction: number) => void;
  handleRemoveSection: (sectionId: string) => void;
  handleAddBlock: (
    sectionId: string,
    type: "markdown" | "bullets" | "media",
  ) => void;
  handleMoveBlock: (
    sectionId: string,
    blockIndex: number,
    direction: number,
  ) => void;
  handleRemoveBlock: (sectionId: string, blockIndex: number) => void;
  handleAddFromMenu: (
    kind: "markdown" | "bullets" | "media" | "photo",
  ) => void;
  handleDeleteLive: () => Promise<void>;
  showBlockToast: (sectionId: string) => void;
  dismissBlockToast: () => void;
  resolveSectionTitle: (sectionId: string) => string;
  resolveTargetSectionId: () => string | null;
};

const OverrideUIContext = createContext<OverrideUIContextValue | null>(null);

export function OverrideUIProvider({
  value,
  children,
}: {
  value: OverrideUIContextValue;
  children: ReactNode;
}) {
  return (
    <OverrideUIContext.Provider value={value}>
      {children}
    </OverrideUIContext.Provider>
  );
}

export function useOverrideUIContext(): OverrideUIContextValue {
  const ctx = useContext(OverrideUIContext);
  if (!ctx) {
    throw new Error(
      "useOverrideUIContext must be used within an OverrideUIProvider",
    );
  }
  return ctx;
}
