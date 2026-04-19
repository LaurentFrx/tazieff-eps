// Phase B.1.2 — hook encapsulating media/hero state & handlers for
// the teacher override editor. Output shape matches OverrideMediaContextValue
// so it can be passed directly to <OverrideMediaProvider value={...}>.
// Parent destructures the return to preserve the closure-read pattern
// used throughout ExerciseLiveDetail.tsx (no JSX changes in B.1.2).
//
// resolveMediaInfo & resolveMediaAsset are re-exposed in the return so
// the parent-level media resolution useEffect can keep calling them.

"use client";

import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type {
  ExerciseLiveDocV2,
  ExerciseLiveMediaBlock,
  ExerciseLiveSection,
} from "@/lib/live/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  MediaInfo,
  MediaResolveStatus,
  OverrideMediaContextValue,
  UploadTarget,
} from "../contexts";
import {
  ALLOWED_IMAGE_TYPES,
  IMAGE_MAX_EDGE,
  MAX_UPLOAD_BYTES,
  compressImageToWebp,
  formatResolveError,
  loadImageSource,
  mediaUrlCache,
} from "../lib/media-utils";

export type UseOverrideMediaUploadInput = {
  overrideDoc: ExerciseLiveDocV2 | null;
  slug: string;
  teacherPin: string;
  updateSection: (
    sectionId: string,
    updater: (section: ExerciseLiveSection) => ExerciseLiveSection,
  ) => void;
  updateOverrideDoc: (
    updater: (doc: ExerciseLiveDocV2) => ExerciseLiveDocV2,
  ) => void;
  handleAuthError: (message: string) => void;
  setActiveSectionId: Dispatch<SetStateAction<string | null>>;
  highlightBlock: (blockKey: string) => void;
  showBlockToast: (sectionId: string) => void;
  mediaInfoRequestedRef: MutableRefObject<Set<string>>;
};

export function useOverrideMediaUpload(
  input: UseOverrideMediaUploadInput,
): OverrideMediaContextValue {
  const {
    overrideDoc,
    slug,
    teacherPin,
    updateSection,
    updateOverrideDoc,
    handleAuthError,
    setActiveSectionId,
    highlightBlock,
    showBlockToast,
    mediaInfoRequestedRef,
  } = input;

  const { t } = useI18n();
  const supabase = getSupabaseBrowserClient();

  const [heroPreviewUrl, setHeroPreviewUrl] = useState<string | null>(null);
  const [mediaUrlMap, setMediaUrlMap] = useState<Record<string, string>>({});
  const [mediaInfoMap, setMediaInfoMap] = useState<Record<string, MediaInfo>>({});
  const [mediaResolveState, setMediaResolveState] = useState<
    Record<string, MediaResolveStatus>
  >({});
  const [mediaResolveError, setMediaResolveError] = useState<
    Record<string, string | null>
  >({});
  const [mediaStatus, setMediaStatus] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<UploadTarget>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resolveMediaInfo = useCallback(
    async (mediaId: string, options?: { isActive?: () => boolean }) => {
      if (!supabase) {
        return;
      }
      const isActive = options?.isActive ?? (() => true);
      const { data, error } = await supabase
        .from("media_assets")
        .select("id, mime, size, width, height")
        .eq("id", mediaId)
        .maybeSingle();
      if (!isActive() || error || !data) {
        return;
      }
      setMediaInfoMap((prev) => {
        const nextInfo: MediaInfo = {
          mime: data.mime ?? null,
          size: data.size ?? null,
          width: data.width ?? null,
          height: data.height ?? null,
        };
        const prevInfo = prev[mediaId];
        if (
          prevInfo &&
          prevInfo.mime === nextInfo.mime &&
          prevInfo.size === nextInfo.size &&
          prevInfo.width === nextInfo.width &&
          prevInfo.height === nextInfo.height
        ) {
          return prev;
        }
        return { ...prev, [mediaId]: nextInfo };
      });
    },
    [supabase],
  );

  const resolveMediaAsset = useCallback(
    async (
      mediaId: string,
      options?: { force?: boolean; isActive?: () => boolean },
    ) => {
      if (!supabase) {
        return;
      }

      const isActive = options?.isActive ?? (() => true);
      const cachedUrl = mediaUrlCache.get(mediaId) ?? "";
      const shouldFetchInfo =
        options?.force || !mediaInfoRequestedRef.current.has(mediaId);
      if (shouldFetchInfo) {
        mediaInfoRequestedRef.current.add(mediaId);
        void resolveMediaInfo(mediaId, { isActive });
      }

      if (cachedUrl && !options?.force) {
        if (!isActive()) {
          return;
        }
        setMediaUrlMap((prev) =>
          prev[mediaId] === cachedUrl ? prev : { ...prev, [mediaId]: cachedUrl },
        );
        setMediaResolveState((prev) =>
          prev[mediaId] === "ready" ? prev : { ...prev, [mediaId]: "ready" },
        );
        setMediaResolveError((prev) =>
          prev[mediaId] ? { ...prev, [mediaId]: null } : prev,
        );
        return;
      }

      if (!isActive()) {
        return;
      }
      setMediaResolveState((prev) => ({ ...prev, [mediaId]: "loading" }));
      setMediaResolveError((prev) =>
        prev[mediaId] ? { ...prev, [mediaId]: null } : prev,
      );

      const { data, error } = await supabase
        .from("media_assets")
        .select("id, bucket, path, canonical_url")
        .eq("id", mediaId)
        .maybeSingle();
      if (!isActive()) {
        return;
      }

      if (error || !data) {
        if (cachedUrl) {
          setMediaResolveState((prev) =>
            prev[mediaId] === "ready" ? prev : { ...prev, [mediaId]: "ready" },
          );
          setMediaResolveError((prev) =>
            prev[mediaId] ? { ...prev, [mediaId]: null } : prev,
          );
          return;
        }
        const status =
          error && typeof error === "object" && "status" in error
            ? Number((error as { status?: number }).status)
            : undefined;
        const reason = formatResolveError(status, t);
        setMediaResolveState((prev) => ({ ...prev, [mediaId]: "error" }));
        setMediaResolveError((prev) =>
          prev[mediaId] === reason ? prev : { ...prev, [mediaId]: reason },
        );
        return;
      }

      let url = data.canonical_url ?? "";
      if (!url && data.bucket && data.path) {
        const { data: publicData } = supabase
          .storage
          .from(data.bucket)
          .getPublicUrl(data.path);
        url = publicData.publicUrl ?? "";
      }
      if (url) {
        mediaUrlCache.set(mediaId, url);
        setMediaUrlMap((prev) =>
          prev[mediaId] === url ? prev : { ...prev, [mediaId]: url },
        );
        setMediaResolveState((prev) => ({ ...prev, [mediaId]: "ready" }));
        setMediaResolveError((prev) =>
          prev[mediaId] ? { ...prev, [mediaId]: null } : prev,
        );
        return;
      }

      if (cachedUrl) {
        setMediaResolveState((prev) =>
          prev[mediaId] === "ready" ? prev : { ...prev, [mediaId]: "ready" },
        );
        setMediaResolveError((prev) =>
          prev[mediaId] ? { ...prev, [mediaId]: null } : prev,
        );
        return;
      }

      const reason = t("exerciseEditor.urlError");
      setMediaResolveState((prev) => ({ ...prev, [mediaId]: "error" }));
      setMediaResolveError((prev) =>
        prev[mediaId] === reason ? prev : { ...prev, [mediaId]: reason },
      );
    },
    [resolveMediaInfo, supabase, mediaInfoRequestedRef, t],
  );

  const handlePhotoUploadRequest = (sectionId: string, blockIndex?: number) => {
    if (!teacherPin) {
      handleAuthError(t("teacherMode.pinRequired"));
      return;
    }
    setActiveSectionId(sectionId);
    setUploadTarget({ sectionId, blockIndex });
    fileInputRef.current?.click();
  };

  const handlePhotoFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file || !uploadTarget) {
      return;
    }
    if (!teacherPin) {
      handleAuthError(t("teacherMode.pinRequired"));
      return;
    }
    setMediaStatus(t("exerciseEditor.uploading"));
    try {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        setMediaStatus(t("exerciseEditor.invalidFormat"));
        return;
      }

      const sourceInfo = await loadImageSource(file);
      const maxEdge = Math.max(sourceInfo.width, sourceInfo.height);
      const needsProcessing =
        file.size > MAX_UPLOAD_BYTES ||
        maxEdge > IMAGE_MAX_EDGE ||
        file.type !== "image/webp";

      let uploadFile = file;
      let targetWidth = sourceInfo.width;
      let targetHeight = sourceInfo.height;

      if (needsProcessing) {
        const { blob, width, height } = await compressImageToWebp(sourceInfo);
        const baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : "photo";
        const uniqueName =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `photo-${Date.now()}`;
        const fileName = `${baseName || "photo"}-${uniqueName}.webp`;
        uploadFile = new File([blob], fileName, { type: "image/webp" });
        targetWidth = width;
        targetHeight = height;
      } else {
        sourceInfo.revoke?.();
      }

      if (uploadFile.size > MAX_UPLOAD_BYTES) {
        setMediaStatus(t("exerciseEditor.imageTooLarge"));
        return;
      }

      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("slug", slug);
      formData.append("pin", teacherPin);
      formData.append("width", String(targetWidth));
      formData.append("height", String(targetHeight));

      const response = await fetch("/api/teacher/upload-media", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        let serverMessage: string | undefined;
        try {
          const payload = (await response.json()) as { message?: string };
          serverMessage = payload?.message;
        } catch {
          serverMessage = undefined;
        }
        const message = serverMessage?.trim()
          ? serverMessage.trim()
          : t("exerciseEditor.uploadFailed");
        if (response.status === 401) {
          handleAuthError(message);
        }
        setMediaStatus(`${message} (HTTP ${response.status})`);
        return;
      }
      const data = (await response.json()) as {
        ok?: boolean;
        mediaId?: string;
        url?: string;
        bucket?: string;
        path?: string;
      };
      if (!data.mediaId) {
        setMediaStatus(t("exerciseEditor.invalidResponse"));
        return;
      }
      if (data.url) {
        mediaUrlCache.set(data.mediaId, data.url);
        setMediaUrlMap((prev) => ({ ...prev, [data.mediaId!]: data.url! }));
      }
      let highlightKey: string | null = null;
      updateSection(uploadTarget.sectionId, (section) => {
        const blocks = [...section.blocks];
        const nextBlock: ExerciseLiveMediaBlock = {
          type: "media",
          mediaType: "image",
          mediaId: data.mediaId,
          url: data.url,
          caption: "",
        };
        if (uploadTarget.blockIndex !== undefined) {
          blocks[uploadTarget.blockIndex] = nextBlock;
          highlightKey = `${section.id}-${uploadTarget.blockIndex}`;
        } else {
          const nextIndex = blocks.length;
          blocks.push(nextBlock);
          highlightKey = `${section.id}-${nextIndex}`;
        }
        return { ...section, blocks };
      });
      if (highlightKey) {
        highlightBlock(highlightKey);
      }
      showBlockToast(uploadTarget.sectionId);
      setMediaStatus(t("exerciseEditor.photoAdded"));
    } catch (error) {
      const raw = error instanceof Error ? error.message : "";
      const message =
        raw === "Compression échouée." ? t("exerciseEditor.compressionFailed") :
        raw === "Canvas indisponible." ? t("exerciseEditor.canvasUnavailable") :
        raw === "Impossible de charger l'image." ? t("exerciseEditor.imageLoadFailed") :
        raw || t("exerciseEditor.uploadFailed");
      setMediaStatus(message);
    } finally {
      setUploadTarget(null);
    }
  };

  const handleHeroUrlChange = (value: string) => {
    updateOverrideDoc((doc) => ({
      ...doc,
      doc: {
        ...doc.doc,
        heroImage: { ...(doc.doc.heroImage ?? { url: "" }), url: value },
      },
    }));
  };

  const handleHeroAltChange = (value: string) => {
    updateOverrideDoc((doc) => ({
      ...doc,
      doc: {
        ...doc.doc,
        heroImage: { ...(doc.doc.heroImage ?? { url: "" }), alt: value },
      },
    }));
  };

  const handleHeroPreview = () => {
    const url = overrideDoc?.doc.heroImage?.url?.trim();
    setHeroPreviewUrl(url && url.length > 0 ? url : null);
  };

  const handleHeroRemove = () => {
    updateOverrideDoc((doc) => ({
      ...doc,
      doc: {
        ...doc.doc,
        heroImage: { url: "" },
      },
    }));
    setHeroPreviewUrl(null);
  };

  const handleClearPhoto = (sectionId: string, blockIndex: number) => {
    updateSection(sectionId, (section) => ({
      ...section,
      blocks: section.blocks.map((block, idx) =>
        idx === blockIndex && block.type === "media" && block.mediaType === "image"
          ? { ...block, mediaId: undefined, url: undefined, caption: "" }
          : block,
      ),
    }));
  };

  return {
    heroPreviewUrl,
    mediaStatus,
    uploadTarget,
    mediaUrlMap,
    mediaInfoMap,
    mediaResolveState,
    mediaResolveError,
    setHeroPreviewUrl,
    setMediaStatus,
    setUploadTarget,
    setMediaUrlMap,
    setMediaInfoMap,
    setMediaResolveState,
    setMediaResolveError,
    fileInputRef,
    handlePhotoUploadRequest,
    handlePhotoFileChange,
    handleClearPhoto,
    handleHeroUrlChange,
    handleHeroAltChange,
    handleHeroPreview,
    handleHeroRemove,
    resolveMediaInfo,
    resolveMediaAsset,
  };
}
