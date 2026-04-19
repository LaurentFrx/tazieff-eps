// Phase B.0 — thematic context for teacher override editor.
// Created to enable later extraction of the editor into a lazy-loaded child.
// Source of truth remains in ExerciseLiveDetail.tsx parent.

"use client";

import { createContext, useContext, type Dispatch, type MutableRefObject, type ReactNode, type SetStateAction, type ChangeEvent } from "react";

export type MediaInfo = {
  mime?: string | null;
  size?: number | null;
  width?: number | null;
  height?: number | null;
};

export type MediaResolveStatus = "loading" | "ready" | "error";

export type UploadTarget = {
  sectionId: string;
  blockIndex?: number;
} | null;

export type OverrideMediaContextValue = {
  heroPreviewUrl: string | null;
  mediaStatus: string | null;
  uploadTarget: UploadTarget;
  mediaUrlMap: Record<string, string>;
  mediaInfoMap: Record<string, MediaInfo>;
  mediaResolveState: Record<string, MediaResolveStatus>;
  mediaResolveError: Record<string, string | null>;

  setHeroPreviewUrl: Dispatch<SetStateAction<string | null>>;
  setMediaStatus: Dispatch<SetStateAction<string | null>>;
  setUploadTarget: Dispatch<SetStateAction<UploadTarget>>;
  setMediaUrlMap: Dispatch<SetStateAction<Record<string, string>>>;
  setMediaInfoMap: Dispatch<SetStateAction<Record<string, MediaInfo>>>;
  setMediaResolveState: Dispatch<SetStateAction<Record<string, MediaResolveStatus>>>;
  setMediaResolveError: Dispatch<SetStateAction<Record<string, string | null>>>;

  fileInputRef: MutableRefObject<HTMLInputElement | null>;

  handlePhotoUploadRequest: (sectionId: string, blockIndex?: number) => void;
  handlePhotoFileChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleClearPhoto: (sectionId: string, blockIndex: number) => void;
  handleHeroUrlChange: (value: string) => void;
  handleHeroAltChange: (value: string) => void;
  handleHeroPreview: () => void;
  handleHeroRemove: () => void;
  resolveMediaInfo: (
    mediaId: string,
    options?: { isActive?: () => boolean },
  ) => Promise<void>;
  resolveMediaAsset: (
    mediaId: string,
    options?: { force?: boolean; isActive?: () => boolean },
  ) => Promise<void>;
};

const OverrideMediaContext = createContext<OverrideMediaContextValue | null>(null);

export function OverrideMediaProvider({
  value,
  children,
}: {
  value: OverrideMediaContextValue;
  children: ReactNode;
}) {
  return (
    <OverrideMediaContext.Provider value={value}>
      {children}
    </OverrideMediaContext.Provider>
  );
}

export function useOverrideMediaContext(): OverrideMediaContextValue {
  const ctx = useContext(OverrideMediaContext);
  if (!ctx) {
    throw new Error(
      "useOverrideMediaContext must be used within an OverrideMediaProvider",
    );
  }
  return ctx;
}
