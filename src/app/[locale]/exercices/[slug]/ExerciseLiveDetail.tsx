"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { LocaleLink as Link } from "@/components/LocaleLink";
import { useSearchParams, useRouter } from "next/navigation";
import DifficultyPill from "@/components/DifficultyPill";
import { ExerciseMannequin3D } from "@/components/exercices/ExerciseMannequin3D";
import { HeroMedia } from "@/components/media/HeroMedia";
import {
  getFavoritesSnapshot,
  toggleFavorite,
} from "@/lib/favoritesStore";
import { useSessionDraft } from "@/hooks/useSessionDraft";
import type { ExerciseFrontmatter } from "@/lib/content/schema";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Lang } from "@/lib/i18n/messages";
import { ExerciseJsonLd } from "@/components/seo/ExerciseJsonLd";
import { ExerciseQuickInfo } from "@/components/exercices/ExerciseQuickInfo";
import { RestTimer } from "@/components/exercices/RestTimer";
import { translateTerms } from "@/lib/i18n/terms/translate";
import { getMuscleGroup, getMuscleGroups, getMuscleDisplayName, MUSCLE_GROUP_COLORS } from "@/lib/exercices/muscleGroups";
const MarkdownRenderer = dynamic(
  () => import("@/components/MarkdownRenderer"),
  {
    loading: () => (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
      </div>
    ),
  },
);
import { applyExercisePatch, splitMarkdownSections } from "@/lib/live/patch";
import type {
  ExerciseLiveBulletsBlock,
  ExerciseLiveDocV2,
  ExerciseLiveMarkdownBlock,
  ExerciseLiveMediaBlock,
  ExerciseLiveSection,
  ExerciseOverridePatch,
  LiveExerciseRow,
} from "@/lib/live/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useReveal } from "@/hooks/useReveal";
import "./exercise-detail.css";
import {
  OverrideDocProvider,
  OverrideMediaProvider,
  OverridePillsProvider,
  OverrideUIProvider,
} from "./_teacher-editor/contexts";
import { useOverrideSave } from "./_teacher-editor/hooks/useOverrideSave";

function RevealStep({ delay, children }: { delay: number; children: React.ReactNode }) {
  const ref = useReveal(delay);
  return <div ref={ref as React.RefObject<HTMLDivElement>}>{children}</div>;
}

type SessionSibling = { slug: string; title: string };

type ExerciseLiveDetailProps = {
  slug: string;
  locale: Lang;
  source: "mdx" | "live" | "imported";
  baseFrontmatter: ExerciseFrontmatter;
  baseContent: string;
  initialPatch: ExerciseOverridePatch | null;
  onRevalidate?: (slug: string) => Promise<void>;
  sessionSiblings?: SessionSibling[];
};

type LiveDraft = {
  slug: string;
  title: string;
  tags: string;
  muscles: string;
  themeCompatibility: string;
  level: string;
  equipment: string;
  media: string;
  content: string;
};

type ExerciseStatus = "draft" | "ready";

type TeacherModeSnapshot = {
  unlocked: boolean;
  pin: string;
};

declare global {
  interface Window {
    __teacherMode?: TeacherModeSnapshot;
  }
}

const POLL_INTERVAL_MS = 20000;
const LONG_PRESS_MS = 1800;
const MOVE_THRESHOLD_PX = 10;
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const IMAGE_MAX_EDGE = 1600;
const IMAGE_QUALITY = 0.82;
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
const mediaUrlCache = new Map<string, string>();
const DROPDOWN_MAX_HEIGHT = 288;
const DROPDOWN_MENU_LAYER_CLASS = "z-[80]";
const DROPDOWN_MENU_PANEL_CLASS =
  "rounded-2xl border border-white/10 bg-[color:var(--bg-2)] p-2 shadow-xl";
function getLevelDefaults(t: (key: string) => string) {
  return [
    t("difficulty.debutant"),
    t("difficulty.intermediaire"),
    t("difficulty.avance"),
  ];
}

function getTypeDefaults(t: (key: string) => string) {
  return [
    t("exerciseEditor.types.fondamentaux"),
    t("exerciseEditor.types.technique"),
    t("exerciseEditor.types.renforcement"),
    t("exerciseEditor.types.gainage"),
    t("exerciseEditor.types.mobilite"),
    t("exerciseEditor.types.souplesse"),
    t("exerciseEditor.types.pliometrie"),
    t("exerciseEditor.types.enduranceDeForce"),
    t("exerciseEditor.types.puissance"),
    t("exerciseEditor.types.hypertrophie"),
    t("exerciseEditor.types.echauffement"),
    t("exerciseEditor.types.retourAuCalme"),
  ];
}

function getMuscleDefaults(t: (key: string) => string) {
  return [
    t("exerciseEditor.muscleNames.abdominaux"),
    t("exerciseEditor.muscleNames.transverse"),
    t("exerciseEditor.muscleNames.obliques"),
    t("exerciseEditor.muscleNames.dos"),
    t("exerciseEditor.muscleNames.pectoraux"),
    t("exerciseEditor.muscleNames.epaules"),
    t("exerciseEditor.muscleNames.biceps"),
    t("exerciseEditor.muscleNames.triceps"),
    t("exerciseEditor.muscleNames.fessiers"),
    t("exerciseEditor.muscleNames.quadriceps"),
    t("exerciseEditor.muscleNames.ischiojambiers"),
    t("exerciseEditor.muscleNames.mollets"),
    t("exerciseEditor.muscleNames.lombaires"),
  ];
}

function getThemeDefaults(t: (key: string) => string) {
  return [
    "AFL1",
    "AFL2",
    "AFL3",
    t("exerciseEditor.themeTags.securite"),
    t("exerciseEditor.themeTags.methode"),
    t("exerciseEditor.themeTags.technique"),
  ];
}
const DEFAULT_TEACHER_MODE: TeacherModeSnapshot = { unlocked: false, pin: "" };

function getTeacherModeSnapshot(): TeacherModeSnapshot {
  if (typeof window === "undefined") {
    return { ...DEFAULT_TEACHER_MODE };
  }
  const snapshot = window.__teacherMode;
  if (!snapshot) {
    return { ...DEFAULT_TEACHER_MODE };
  }
  return {
    unlocked: Boolean(snapshot.unlocked),
    pin: snapshot.pin ?? "",
  };
}

function setTeacherModeSnapshot(next: TeacherModeSnapshot) {
  if (typeof window === "undefined") {
    return;
  }
  window.__teacherMode = next;
}

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseThemeCompatibility(value: string) {
  return parseList(value)
    .map((item) => Number(item))
    .filter((item) => item === 1 || item === 2 || item === 3) as Array<1 | 2 | 3>;
}

const HERO_OVERRIDE_DIMENSIONS = { width: 1600, height: 900 };

function createSectionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `section-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function moveItem<T>(items: T[], from: number, to: number) {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length) {
    return items;
  }
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function createMarkdownBlock(content = ""): ExerciseLiveMarkdownBlock {
  return { type: "markdown", content };
}

function createBulletsBlock(items: string[] = [""]): ExerciseLiveBulletsBlock {
  return { type: "bullets", items };
}

function createMediaBlock(): ExerciseLiveMediaBlock {
  return { type: "media", mediaType: "link", url: "", caption: "" };
}

function createBlock(type: "markdown" | "bullets" | "media") {
  if (type === "bullets") {
    return createBulletsBlock();
  }
  if (type === "media") {
    return createMediaBlock();
  }
  return createMarkdownBlock();
}

function normalizeLabel(value: string) {
  return value.trim();
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function uniqueLabels(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = normalizeLabel(value);
    if (!normalized) {
      continue;
    }
    const key = normalizeKey(normalized);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

function sortLabels(values: string[]) {
  return [...values].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
}

type MediaInfo = {
  mime?: string | null;
  size?: number | null;
  width?: number | null;
  height?: number | null;
};

function appendCacheBust(url: string, token: number) {
  if (!token) {
    return url;
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}retry=${token}`;
}

function formatBytes(bytes?: number | null) {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes <= 0) {
    return null;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${Math.round(kb)} Ko`;
  }
  const mb = kb / 1024;
  const formatted = mb
    .toFixed(mb >= 10 ? 0 : 1)
    .replace(".", ",");
  return `${formatted} Mo`;
}

function formatMediaInfo(info?: MediaInfo | null) {
  if (!info) {
    return null;
  }
  const parts: string[] = [];
  if (info.mime) {
    const format = info.mime.split("/").pop()?.trim();
    if (format) {
      parts.push(format.toUpperCase());
    }
  }
  const width = typeof info.width === "number" ? info.width : null;
  const height = typeof info.height === "number" ? info.height : null;
  if (width && height) {
    parts.push(`${width}×${height}`);
  }
  const size = formatBytes(info.size ?? null);
  if (size) {
    parts.push(size);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function formatResolveError(
  status: number | null | undefined,
  t: (key: string) => string,
) {
  if (typeof status === "number" && Number.isFinite(status)) {
    return t("exerciseEditor.fetchFailedWithStatus").replace(
      "{status}",
      String(status),
    );
  }
  return t("exerciseEditor.urlError");
}

function filterOptions(options: string[], query: string) {
  const key = normalizeKey(query);
  if (!key) {
    return options;
  }
  return options.filter((option) => normalizeKey(option).includes(key));
}

function optionExists(options: string[], value: string) {
  const key = normalizeKey(value);
  if (!key) {
    return false;
  }
  return options.some((option) => normalizeKey(option) === key);
}

type ImageSourceInfo = {
  source: CanvasImageSource;
  width: number;
  height: number;
  revoke?: () => void;
};

async function loadImageSource(file: File): Promise<ImageSourceInfo> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap as CanvasImageSource,
      width: bitmap.width,
      height: bitmap.height,
      revoke: () => {
        if ("close" in bitmap) {
          bitmap.close();
        }
      },
    };
  }

  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Impossible de charger l'image."));
    image.src = url;
  });

  return {
    source: img as CanvasImageSource,
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    revoke: () => URL.revokeObjectURL(url),
  };
}

async function compressImageToWebp(sourceInfo: ImageSourceInfo) {
  const { source, width, height, revoke } = sourceInfo;
  const maxEdge = Math.max(width, height);
  const scale = maxEdge > IMAGE_MAX_EDGE ? IMAGE_MAX_EDGE / maxEdge : 1;
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    revoke?.();
    throw new Error("Canvas indisponible.");
  }
  context.drawImage(source, 0, 0, targetWidth, targetHeight);
  revoke?.();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error("Compression échouée."));
        }
      },
      "image/webp",
      IMAGE_QUALITY,
    );
  });

  return { blob, width: targetWidth, height: targetHeight };
}

type PhotoPreviewProps = {
  previewUrl: string | null;
  alt: string;
  infoLine?: string | null;
  isResolving: boolean;
  hasError: boolean;
  errorDetail?: string | null;
  onRetry: () => void;
};

function PhotoPreview({
  previewUrl,
  alt,
  infoLine,
  isResolving,
  hasError,
  errorDetail,
  onRetry,
}: PhotoPreviewProps) {
  const [retryToken, setRetryToken] = useState(0);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [loadErrorFor, setLoadErrorFor] = useState<string | null>(null);

  const displayUrl = previewUrl ? appendCacheBust(previewUrl, retryToken) : null;
  const loadError = !!displayUrl && loadErrorFor === displayUrl;
  const isLoading = !!displayUrl && loadedUrl !== displayUrl && !loadError;
  const showError = loadError || (!displayUrl && hasError);
  const showSkeleton = !showError && (isResolving || isLoading);
  const frameClassName =
    "h-[220px] sm:h-[240px] w-full rounded-2xl ring-1 ring-white/10";
  const { t: tPreview } = useI18n();
  const resolvedErrorDetail = showError
    ? loadError
      ? tPreview("exerciseEditor.urlError")
      : errorDetail || tPreview("exerciseEditor.urlError")
    : null;

  const handleRetryClick = () => {
    setLoadErrorFor(null);
    setRetryToken((current) => current + 1);
    onRetry();
  };

  return (
    <div className="stack-sm">
      {showError ? (
        <div
          className={`flex ${frameClassName} flex-col items-center justify-center gap-2 border border-white/10 bg-white/5 px-4 text-center`}
        >
          <p className="text-sm text-[color:var(--muted)]">{tPreview("exerciseEditor.previewUnavailable")}</p>
          {resolvedErrorDetail ? (
            <p className="text-xs text-[color:var(--muted)]">
              {resolvedErrorDetail}
            </p>
          ) : null}
          <button type="button" className="chip" onClick={handleRetryClick}>
            {tPreview("exerciseEditor.retry")}
          </button>
        </div>
      ) : (
        <div className="relative">
          {showSkeleton ? (
            <div
              className={`${frameClassName} animate-pulse bg-white/5`}
              aria-hidden="true"
            />
          ) : null}
          {displayUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayUrl}
                alt={alt}
                className={`${frameClassName} object-cover transition-opacity ${
                  showSkeleton ? "opacity-0" : "opacity-100"
                }`}
                loading="lazy"
                decoding="async"
                onLoad={() => {
                  if (displayUrl) {
                    setLoadedUrl(displayUrl);
                    setLoadErrorFor(null);
                  }
                }}
                onError={() => {
                  if (displayUrl) {
                    setLoadErrorFor(displayUrl);
                  }
                }}
              />
            </>
          ) : null}
        </div>
      )}
      {infoLine ? (
        <p className="text-xs text-[color:var(--muted)]">{infoLine}</p>
      ) : null}
    </div>
  );
}

function isLiveDocV2(patch: ExerciseOverridePatch | null): patch is ExerciseLiveDocV2 {
  if (!patch || typeof patch !== "object") {
    return false;
  }
  const candidate = patch as ExerciseLiveDocV2;
  return (
    candidate.version === 2 &&
    !!candidate.doc &&
    Array.isArray(candidate.doc.sections)
  );
}

function buildSectionsFromContent(
  content: string,
  patchSections?: Record<string, string>,
): ExerciseLiveSection[] {
  const parsed = splitMarkdownSections(content);
  const sections = [...parsed.sections];
  if (patchSections && Object.keys(patchSections).length > 0) {
    const index = new Map(sections.map((section, idx) => [section.heading, idx]));
    for (const [heading, body] of Object.entries(patchSections)) {
      const normalizedHeading = heading.trim();
      if (!normalizedHeading) {
        continue;
      }
      const value = typeof body === "string" ? body : "";
      const existingIndex = index.get(normalizedHeading);
      if (existingIndex !== undefined) {
        sections[existingIndex] = { heading: normalizedHeading, body: value };
      } else {
        sections.push({ heading: normalizedHeading, body: value });
        index.set(normalizedHeading, sections.length - 1);
      }
    }
  }

  const result: ExerciseLiveSection[] = [];
  const intro = parsed.intro.trim();
  if (intro) {
    result.push({
      id: createSectionId(),
      title: "",
      blocks: [createMarkdownBlock(intro)],
    });
  }
  for (const section of sections) {
    result.push({
      id: createSectionId(),
      title: section.heading.trim(),
      blocks: [createMarkdownBlock(section.body.trim())],
    });
  }
  return result;
}

function buildOverrideDoc(
  base: { frontmatter: ExerciseFrontmatter; content: string },
  patch: ExerciseOverridePatch | null,
): ExerciseLiveDocV2 {
  if (isLiveDocV2(patch)) {
    return patch;
  }

  const legacyPatch = patch && !isLiveDocV2(patch) ? patch : null;
  const frontmatter = legacyPatch?.frontmatter
    ? { ...base.frontmatter, ...legacyPatch.frontmatter }
    : base.frontmatter;

  return {
    version: 2,
    doc: {
      heroImage: frontmatter.media
        ? { url: frontmatter.media, alt: frontmatter.title }
        : undefined,
      pills: (frontmatter.tags ?? []).map((label) => ({ label })),
      sections: buildSectionsFromContent(base.content, legacyPatch?.sections),
    },
  };
}

type HeroRender =
  | {
      type: "video";
      src: string;
      alt: string;
      imageFallback?: string;
    }
  | { type?: "image"; src: string; alt: string; width: number; height: number };

export function ExerciseLiveDetail({
  slug,
  locale,
  source,
  baseFrontmatter,
  baseContent,
  initialPatch,
  onRevalidate,
  sessionSiblings = [],
}: ExerciseLiveDetailProps) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionDraft = useSessionDraft();
  const supabase = getSupabaseBrowserClient();
  const [base, setBase] = useState(() => ({
    frontmatter: baseFrontmatter,
    content: baseContent,
  }));
  const [patch, setPatch] = useState<ExerciseOverridePatch | null>(() => initialPatch);
  const [overrideReady, setOverrideReady] = useState(false);
  const [liveReady, setLiveReady] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [teacherUnlocked, setTeacherUnlocked] = useState(
    () => getTeacherModeSnapshot().unlocked,
  );
  const [teacherPin, setTeacherPin] = useState(() => getTeacherModeSnapshot().pin);
  const [teacherError, setTeacherError] = useState<string | null>(null);
  const [overrideDoc, setOverrideDoc] = useState<ExerciseLiveDocV2 | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [sectionMenuOpenId, setSectionMenuOpenId] = useState<string | null>(null);
  const [blockMenuOpenKey, setBlockMenuOpenKey] = useState<string | null>(null);
  const [heroPreviewUrl, setHeroPreviewUrl] = useState<string | null>(null);
  const [mediaUrlMap, setMediaUrlMap] = useState<Record<string, string>>({});
  const [mediaInfoMap, setMediaInfoMap] = useState<Record<string, MediaInfo>>({});
  const [mediaResolveState, setMediaResolveState] = useState<
    Record<string, "loading" | "ready" | "error">
  >({});
  const [mediaResolveError, setMediaResolveError] = useState<
    Record<string, string | null>
  >({});
  const [mediaStatus, setMediaStatus] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<{
    sectionId: string;
    blockIndex?: number;
  } | null>(null);
  const [pillDropdownOpen, setPillDropdownOpen] = useState<
    null | "type" | "muscles" | "themes"
  >(null);
  const [pillSearch, setPillSearch] = useState({
    type: "",
    muscles: "",
    themes: "",
  });
  const [pillCustomOptions, setPillCustomOptions] = useState({
    level: [] as string[],
    type: [] as string[],
    muscles: [] as string[],
    themes: [] as string[],
  });
  const [levelAddOpen, setLevelAddOpen] = useState(false);
  const [levelAddValue, setLevelAddValue] = useState("");
  const [pillDropdownStyle, setPillDropdownStyle] = useState<{
    top: number;
    left: number;
    width: number;
    placement: "top" | "bottom";
  } | null>(null);
  const [addBlockMenuOpen, setAddBlockMenuOpen] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [highlightBlockKey, setHighlightBlockKey] = useState<string | null>(null);
  const [liveOpen, setLiveOpen] = useState(false);
  const [liveExists, setLiveExists] = useState(false);
  const [liveDraft, setLiveDraft] = useState<LiveDraft | null>(null);
  const [deleteLiveOpen, setDeleteLiveOpen] = useState(false);
  const [isDeletingLive, setIsDeletingLive] = useState(false);
  const [blockToast, setBlockToast] = useState<{ id: number; message: string } | null>(
    null,
  );
  const [blockToastVisible, setBlockToastVisible] = useState(false);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchPointerActiveRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const blockToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blockToastHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionTitleRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const blockFieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});
  const blockContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const addBlockMenuRef = useRef<HTMLDivElement | null>(null);
  const addBlockButtonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const autoEditHandledRef = useRef(false);
  const dropdownTriggerRefs = useRef<
    Record<"type" | "muscles" | "themes", HTMLButtonElement | null>
  >({
    type: null,
    muscles: null,
    themes: null,
  });
  const mediaInfoRequestedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setTeacherModeSnapshot({ unlocked: teacherUnlocked, pin: teacherPin });
  }, [teacherPin, teacherUnlocked]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = () => setMenuOpen(false);
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const merged = useMemo(
    () => applyExercisePatch(base, patch),
    [base, patch],
  );
  const overrideDocView = merged.override?.doc;

  const difficulty = merged.frontmatter.level ?? "intermediaire";
  const displayTitle =
    merged.frontmatter.title?.trim() || t("exerciseGrid.untitledDraft");

  // Hero media resolution: video (.webm/.mp4) > override image > default image
  const exerciseSlug = merged.frontmatter.slug;
  const videoSrc = exerciseSlug
    ? `/images/exos/${exerciseSlug.toLowerCase()}`
    : undefined;
  const imageSrc = exerciseSlug
    ? `/images/exos/${exerciseSlug.toLowerCase()}.webp`
    : merged.frontmatter.media;
  const imageFallback = imageSrc ?? merged.frontmatter.media;

  const overrideHero = overrideDocView?.heroImage;
  const overrideHeroUrl = overrideHero?.url?.trim() ?? "";
  const hero: HeroRender | null =
    videoSrc
      ? {
          type: "video",
          src: videoSrc,
          alt: overrideHero?.alt ?? displayTitle,
          imageFallback: overrideHeroUrl || imageFallback,
        }
      : overrideDocView && overrideHero && overrideHeroUrl
        ? {
            type: "image",
            src: overrideHeroUrl,
            alt: overrideHero.alt ?? displayTitle,
            width: HERO_OVERRIDE_DIMENSIONS.width,
            height: HERO_OVERRIDE_DIMENSIONS.height,
          }
        : imageFallback
          ? { type: "image", src: imageFallback, alt: displayTitle, width: 800, height: 600 }
          : null;

  const tagPills: Array<{ label: string; kind?: string }> =
    overrideDocView?.pills ??
    (merged.frontmatter.tags ?? [])
      .filter((label) => {
        const normalized = label.toLowerCase();
        return normalized !== "imported" &&
               !normalized.includes("contenu") &&
               !normalized.includes("completer");
      })
      .map((label) => ({ label }));
  const activeSection =
    overrideDoc?.doc.sections.find((section) => section.id === activeSectionId) ??
    (overrideDoc
      ? overrideDoc.doc.sections[overrideDoc.doc.sections.length - 1] ?? null
      : null);
  const pillState = useMemo(() => {
    const pills = overrideDoc?.doc.pills ?? [];
    const levelDefaults = getLevelDefaults(t);
    const muscleDefaults = getMuscleDefaults(t);
    const themeDefaults = getThemeDefaults(t);
    const typeDefaults = getTypeDefaults(t);
    const levelKeys = new Set(
      [
        ...levelDefaults,
        "debutant",
        "débutant",
        "intermediaire",
        "intermédiaire",
        "avance",
        "avancé",
      ].map(normalizeKey),
    );
    const muscleKeys = new Set((merged.frontmatter.muscles ?? []).map(normalizeKey));
    const typeKeys = new Set((merged.frontmatter.tags ?? []).map(normalizeKey));
    const selections = {
      level: "",
      type: [] as string[],
      muscles: [] as string[],
      themes: [] as string[],
    };

    pills.forEach((pill) => {
      const label = normalizeLabel(pill.label);
      if (!label) {
        return;
      }
      const labelKey = normalizeKey(label);
      const kindKey = normalizeKey(pill.kind ?? "");
      let bucket: "level" | "type" | "muscles" | "themes" = "type";

      if (["niveau", "level", "difficulty"].includes(kindKey)) {
        bucket = "level";
      } else if (
        ["muscle", "muscles", "groupe-musculaire", "groupe musculaire"].includes(kindKey)
      ) {
        bucket = "muscles";
      } else if (["theme", "themes", "bac", "theme-bac"].includes(kindKey)) {
        bucket = "themes";
      } else if (levelKeys.has(labelKey)) {
        bucket = "level";
      } else if (muscleKeys.has(labelKey)) {
        bucket = "muscles";
      } else if (labelKey.includes("bac")) {
        bucket = "themes";
      } else if (typeKeys.has(labelKey)) {
        bucket = "type";
      }

      if (bucket === "level") {
        if (!selections.level) {
          selections.level = label;
        } else {
          selections.type.push(label);
        }
        return;
      }
      selections[bucket].push(label);
    });

    const nextSelections = {
      level: selections.level,
      type: uniqueLabels(selections.type),
      muscles: uniqueLabels(selections.muscles),
      themes: uniqueLabels(selections.themes),
    };
    const options = {
      level: sortLabels(
        uniqueLabels([
          ...levelDefaults,
          nextSelections.level,
          ...pillCustomOptions.level,
        ]),
      ),
      type: sortLabels(
        uniqueLabels([
          ...typeDefaults,
          ...(merged.frontmatter.tags ?? []),
          ...nextSelections.type,
          ...pillCustomOptions.type,
        ]),
      ),
      muscles: sortLabels(
        uniqueLabels([
          ...muscleDefaults,
          ...(merged.frontmatter.muscles ?? []),
          ...nextSelections.muscles,
          ...pillCustomOptions.muscles,
        ]),
      ),
      themes: sortLabels(
        uniqueLabels([
          ...themeDefaults,
          ...nextSelections.themes,
          ...pillCustomOptions.themes,
        ]),
      ),
    };

    const normalizeSelection = (value: string, optionList: string[]) => {
      const match = optionList.find(
        (option) => normalizeKey(option) === normalizeKey(value),
      );
      return match ?? value;
    };

    const normalizedSelections = {
      level: normalizeSelection(nextSelections.level, options.level),
      type: nextSelections.type.map((value) => normalizeSelection(value, options.type)),
      muscles: nextSelections.muscles.map((value) =>
        normalizeSelection(value, options.muscles),
      ),
      themes: nextSelections.themes.map((value) =>
        normalizeSelection(value, options.themes),
      ),
    };

    return { selections: normalizedSelections, options };
  }, [
    overrideDoc,
    merged.frontmatter.muscles,
    merged.frontmatter.tags,
    pillCustomOptions,
    t,
  ]);

  const triggerRevalidate = useCallback(
    (targetSlug: string) => {
      if (!onRevalidate) {
        return;
      }
      void onRevalidate(targetSlug);
    },
    [onRevalidate],
  );

  const overrideDocValue = useOverrideSave({
    overrideDoc,
    setOverrideDoc,
    base,
    patch,
    merged,
    pillSelections: pillState.selections,
    slug,
    locale,
    source,
    teacherPin,
    setPatch,
    triggerRevalidate,
    onAuthError: (message: string) => {
      setTeacherUnlocked(false);
      setTeacherPin("");
      setTeacherError(message);
      setPinModalOpen(true);
    },
    setConfirmCloseOpen,
    onDiscardResetExternalState: (firstSectionId) => {
      setActiveSectionId(firstSectionId);
      setSectionMenuOpenId(null);
      setBlockMenuOpenKey(null);
      setMediaStatus(null);
      setLevelAddOpen(false);
      setLevelAddValue("");
      setPillDropdownOpen(null);
      setPillSearch({ type: "", muscles: "", themes: "" });
      setPillDropdownStyle(null);
      setAddBlockMenuOpen(false);
      setConfirmCloseOpen(false);
    },
    buildOverrideDoc,
    uniqueLabels,
    normalizeLabel,
  });
  const {
    dirtySnapshot,
    isDirty,
    overrideOpen,
    isSavingOverride,
    overrideToast,
    submitStatus,
    setDirtySnapshot,
    setOverrideOpen,
    setIsSavingOverride,
    setOverrideToast,
    setSubmitStatus,
    toastTimerRef,
    overrideSnapshot,
    saveMeta,
    handleSaveOverride,
    handleCloseOverride,
    handleCloseWithoutSave,
    handleDiscardOverride,
    handleAuthError,
    updateOverrideDoc,
    updateSection,
    showOverrideToast,
  } = overrideDocValue;

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;
    let retry = 0;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let channel = supabase.channel(`exercise-overrides-${slug}-${locale}`);

    const setupChannel = () => {
      channel = supabase.channel(`exercise-overrides-${slug}-${locale}`);
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "exercise_overrides",
          filter: `slug=eq.${slug}`,
        },
        (payload) => {
          if (!active) {
            return;
          }
          const rowLocale =
            payload.eventType === "DELETE"
              ? (payload.old as { locale?: string })?.locale
              : (payload.new as { locale?: string })?.locale;
          if (rowLocale && rowLocale !== locale) {
            return;
          }
          if (payload.eventType === "DELETE") {
            setPatch(null);
            return;
          }
          const nextPatch = (payload.new as { patch_json?: ExerciseOverridePatch })
            .patch_json;
          setPatch(nextPatch ?? null);
        },
      );
      channel.subscribe((status) => {
        if (!active) {
          return;
        }
        if (status === "SUBSCRIBED") {
          retry = 0;
          setOverrideReady(true);
          return;
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setOverrideReady(false);
          channel.unsubscribe();
          retryTimeout = setTimeout(
            setupChannel,
            Math.min(30000, 2000 * Math.pow(2, retry)),
          );
          retry += 1;
        }
      });
    };

    setupChannel();

    return () => {
      active = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      supabase.removeChannel(channel);
    };
  }, [locale, slug, supabase]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;
    let retry = 0;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let channel = supabase.channel(`live-exercise-${slug}-${locale}`);

    const setupChannel = () => {
      channel = supabase.channel(`live-exercise-${slug}-${locale}`);
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_exercises",
          filter: `slug=eq.${slug}`,
        },
        (payload) => {
          if (!active) {
            return;
          }
          const rowLocale =
            payload.eventType === "DELETE"
              ? (payload.old as { locale?: string })?.locale
              : (payload.new as { locale?: string })?.locale;
          if (rowLocale && rowLocale !== locale) {
            return;
          }
          if (payload.eventType === "DELETE") {
            setLiveExists(false);
            return;
          }
          const row = payload.new as LiveExerciseRow;
          const exists = Boolean(row?.data_json);
          setLiveExists(exists);
          if (source === "live" && row?.data_json) {
            setBase({
              frontmatter: row.data_json.frontmatter,
              content: row.data_json.content,
            });
          }
        },
      );
      channel.subscribe((status) => {
        if (!active) {
          return;
        }
        if (status === "SUBSCRIBED") {
          retry = 0;
          if (source === "live") {
            setLiveReady(true);
          }
          return;
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          if (source === "live") {
            setLiveReady(false);
          }
          channel.unsubscribe();
          retryTimeout = setTimeout(
            setupChannel,
            Math.min(30000, 2000 * Math.pow(2, retry)),
          );
          retry += 1;
        }
      });
    };

    setupChannel();

    return () => {
      active = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      supabase.removeChannel(channel);
    };
  }, [locale, slug, source, supabase]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.debug("[live] slug=%s locale=%s liveExists=%o", slug, locale, liveExists);
    }
  }, [liveExists, locale, slug]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const shouldPoll = !overrideReady || (source === "live" && !liveReady);
    if (!shouldPoll) {
      return;
    }

    let active = true;
    let interval: ReturnType<typeof setInterval> | null = null;

    const fetchOverride = async () => {
      const { data } = await supabase
        .from("exercise_overrides")
        .select("slug, locale, patch_json, updated_at")
        .eq("slug", slug)
        .eq("locale", locale)
        .maybeSingle();
      if (!active) {
        return;
      }
      setPatch(data?.patch_json ?? null);
    };

    const fetchLive = async () => {
      const { data, error } = await supabase
        .from("live_exercises")
        .select("slug, locale, data_json, updated_at")
        .eq("slug", slug)
        .eq("locale", locale)
        .maybeSingle();
      if (!active) {
        return;
      }
      if (error) {
        setLiveExists(false);
        return;
      }
      setLiveExists(!!data);
      if (source !== "live" || !data?.data_json) {
        return;
      }
      setBase({
        frontmatter: data.data_json.frontmatter,
        content: data.data_json.content,
      });
    };

    const fetchLatest = async () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      await Promise.all([fetchOverride(), fetchLive()]);
    };

    fetchLatest();
    interval = setInterval(fetchLatest, POLL_INTERVAL_MS);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchLatest();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      if (interval) {
        clearInterval(interval);
      }
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [locale, liveReady, overrideReady, slug, source, supabase]);

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
    [resolveMediaInfo, supabase],
  );

  useEffect(() => {
    if (!overrideDocView || !supabase) {
      return;
    }

    let active = true;
    const mediaIds = new Set<string>();
    const resolveIds = new Set<string>();
    for (const section of overrideDocView.sections) {
      for (const block of section.blocks) {
        if (
          block.type === "media" &&
          block.mediaType === "image" &&
          block.mediaId &&
          !block.url?.trim()
        ) {
          resolveIds.add(block.mediaId);
        }
        if (block.type === "media" && block.mediaType === "image" && block.mediaId) {
          mediaIds.add(block.mediaId);
        }
      }
    }
    for (const mediaId of mediaIds) {
      if (!mediaInfoRequestedRef.current.has(mediaId)) {
        mediaInfoRequestedRef.current.add(mediaId);
        void resolveMediaInfo(mediaId, { isActive: () => active });
      }
    }
    for (const mediaId of resolveIds) {
      void resolveMediaAsset(mediaId, { isActive: () => active });
    }

    return () => {
      active = false;
    };
  }, [overrideDocView, resolveMediaAsset, resolveMediaInfo, supabase]);

  useEffect(() => {
    return () => {
      if (blockToastTimerRef.current) {
        clearTimeout(blockToastTimerRef.current);
      }
      if (blockToastHideTimerRef.current) {
        clearTimeout(blockToastHideTimerRef.current);
      }
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  const resolveSectionTitle = useCallback(
    (sectionId: string) => {
      const section = overrideDoc?.doc.sections.find(
        (item) => item.id === sectionId,
      );
      const label = section?.title?.trim();
      return label && label.length > 0 ? label : t("exerciseEditor.untitledSection");
    },
    [overrideDoc],
  );

  const showBlockToast = useCallback(
    (sectionId: string) => {
      if (blockToastTimerRef.current) {
        clearTimeout(blockToastTimerRef.current);
      }
      if (blockToastHideTimerRef.current) {
        clearTimeout(blockToastHideTimerRef.current);
      }
      const message = `${t("exerciseEditor.blockAddedIn")} « ${resolveSectionTitle(sectionId)} »`;
      setBlockToast({ id: Date.now(), message });
      setBlockToastVisible(false);
      requestAnimationFrame(() => {
        setBlockToastVisible(true);
      });
      blockToastTimerRef.current = setTimeout(() => {
        setBlockToastVisible(false);
        blockToastHideTimerRef.current = setTimeout(() => {
          setBlockToast(null);
        }, 200);
      }, 2200);
    },
    [resolveSectionTitle],
  );

  const dismissBlockToast = useCallback(() => {
    if (blockToastTimerRef.current) {
      clearTimeout(blockToastTimerRef.current);
    }
    if (blockToastHideTimerRef.current) {
      clearTimeout(blockToastHideTimerRef.current);
    }
    setBlockToastVisible(false);
    blockToastHideTimerRef.current = setTimeout(() => {
      setBlockToast(null);
    }, 200);
  }, []);

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
  }, [pillDropdownOpen]);

  useEffect(() => {
    if (!addBlockMenuOpen) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (addBlockMenuRef.current && target && addBlockMenuRef.current.contains(target)) {
        return;
      }
      if (addBlockButtonRef.current && target && addBlockButtonRef.current.contains(target)) {
        return;
      }
      setAddBlockMenuOpen(false);
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAddBlockMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [addBlockMenuOpen]);

  const updateDropdownPosition = (category: "type" | "muscles" | "themes") => {
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

  const highlightBlock = (blockKey: string) => {
    setHighlightBlockKey(blockKey);
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = setTimeout(() => {
      setHighlightBlockKey(null);
    }, 2000);
    setTimeout(() => {
      blockContainerRefs.current[blockKey]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 80);
  };

  const openPinModal = () => {
    if (teacherUnlocked) {
      return;
    }
    setPinModalOpen(true);
  };

  const startLongPress = (x: number, y: number) => {
    if (teacherUnlocked) {
      return;
    }
    pressStartRef.current = { x, y };
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
    pressTimerRef.current = setTimeout(() => {
      pressTimerRef.current = null;
      openPinModal();
    }, LONG_PRESS_MS);
  };

  const cancelLongPress = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    pressStartRef.current = null;
  };

  const cancelLongPressOnMove = (x: number, y: number) => {
    const start = pressStartRef.current;
    if (!start) {
      return;
    }
    const dx = x - start.x;
    const dy = y - start.y;
    if (Math.hypot(dx, dy) > MOVE_THRESHOLD_PX) {
      cancelLongPress();
    }
  };

  const openOverrideEditor = useCallback(() => {
    setSubmitStatus(null);
    const doc = buildOverrideDoc(base, patch);
    const snapshot = JSON.stringify(doc);
    setOverrideDoc(doc);
    setDirtySnapshot(snapshot);
    setHeroPreviewUrl(doc.doc.heroImage?.url?.trim() ? doc.doc.heroImage.url.trim() : null);
    setMediaStatus(null);
    setActiveSectionId(doc.doc.sections[0]?.id ?? null);
    setSectionMenuOpenId(null);
    setBlockMenuOpenKey(null);
    setOverrideToast(null);
    setPillDropdownOpen(null);
    setPillSearch({ type: "", muscles: "", themes: "" });
    setLevelAddOpen(false);
    setLevelAddValue("");
    setOverrideOpen(true);
  }, [base, patch]);

  useEffect(() => {
    if (autoEditHandledRef.current) {
      return;
    }
    autoEditHandledRef.current = true;
    if (!teacherUnlocked) {
      return;
    }
    if (searchParams?.get("edit") !== "1") {
      return;
    }
    openOverrideEditor();
  }, [openOverrideEditor, searchParams, teacherUnlocked]);

  const handleUnlock = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!teacherPin.trim()) {
      setTeacherError(t("teacherMode.pinRequired"));
      return;
    }
    setTeacherUnlocked(true);
    setTeacherError(null);
    setPinModalOpen(false);
  };

  const handleSaveLive = async () => {
    if (!teacherPin) {
      handleAuthError(t("teacherMode.pinRequired"));
      return;
    }
    if (!liveDraft) {
      return;
    }
    const slugValue = liveDraft.slug.trim();
    if (!slugValue) {
      setSubmitStatus(t("exerciseEditor.slugRequired"));
      return;
    }
    const title = liveDraft.title.trim();
    const tags = parseList(liveDraft.tags);
    const muscles = parseList(liveDraft.muscles);
    const themeCompatibility = parseThemeCompatibility(liveDraft.themeCompatibility);
    const hasRequired =
      Boolean(title) &&
      tags.length > 0 &&
      muscles.length > 0 &&
      themeCompatibility.length > 0;
    const status: ExerciseStatus = hasRequired ? "ready" : "draft";
    const frontmatter = {
      title,
      slug: slugValue,
      tags,
      level: liveDraft.level || undefined,
      themeCompatibility,
      muscles,
      equipment: liveDraft.equipment ? parseList(liveDraft.equipment) : undefined,
      media: liveDraft.media || undefined,
    };
    const response = await fetch("/api/teacher/live-exercise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pin: teacherPin,
        slug: slugValue,
        locale,
        dataJson: {
          frontmatter,
          content: liveDraft.content,
          status,
        },
      }),
    });
    if (!response.ok) {
      if (response.status === 401) {
        handleAuthError(t("teacherMode.pinInvalid"));
        setSubmitStatus(null);
        return;
      }
      setSubmitStatus(t("exerciseEditor.createFailed"));
      return;
    }
    setSubmitStatus(
      status === "draft" ? t("exerciseEditor.draftSaved") : t("exerciseEditor.exerciseSaved"),
    );
    setLiveExists(true);
    setLiveOpen(false);
    triggerRevalidate(slugValue);
  };

  const handleDeleteLive = async () => {
    if (!teacherPin) {
      handleAuthError(t("teacherMode.pinRequired"));
      return;
    }
    setIsDeletingLive(true);
    let response: Response;
    try {
      response = await fetch(
        `/api/teacher/live-exercise?slug=${encodeURIComponent(slug)}&locale=${encodeURIComponent(locale)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: teacherPin }),
        },
      );
    } catch {
      setIsDeletingLive(false);
      showOverrideToast(t("exerciseEditor.deleteFailed"), "error");
      return;
    }

    let payload: { ok?: boolean; code?: string; message?: string } | null = null;
    try {
      payload = (await response.json()) as {
        ok?: boolean;
        code?: string;
        message?: string;
      };
    } catch {
      payload = null;
    }

    if (!response.ok || !payload?.ok) {
      if (response.status === 401) {
        handleAuthError(t("teacherMode.pinInvalid"));
      }
      showOverrideToast(payload?.message ?? t("exerciseEditor.deleteFailed"), "error");
      setIsDeletingLive(false);
      return;
    }

    setLiveExists(false);
    setDeleteLiveOpen(false);
    showOverrideToast(t("exerciseEditor.versionDeleted"), "success");
    setIsDeletingLive(false);
    triggerRevalidate(slug);
  };

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
    event: React.ChangeEvent<HTMLInputElement>,
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

  const handleAddSection = () => {
    const newSectionId = createSectionId();
    updateOverrideDoc((doc) => ({
      ...doc,
      doc: {
        ...doc.doc,
        sections: [
          ...doc.doc.sections,
          {
            id: newSectionId,
            title: t("exerciseEditor.newSection"),
            blocks: [createMarkdownBlock("")],
          },
        ],
      },
    }));
    setActiveSectionId(newSectionId);
  };

  const handleMoveSection = (sectionId: string, direction: number) => {
    updateOverrideDoc((doc) => {
      const index = doc.doc.sections.findIndex((section) => section.id === sectionId);
      if (index === -1) {
        return doc;
      }
      return {
        ...doc,
        doc: {
          ...doc.doc,
          sections: moveItem(doc.doc.sections, index, index + direction),
        },
      };
    });
  };

  const handleRemoveSection = (sectionId: string) => {
    updateOverrideDoc((doc) => ({
      ...doc,
      doc: {
        ...doc.doc,
        sections: doc.doc.sections.filter((section) => section.id !== sectionId),
      },
    }));
  };

  const handleAddBlock = (sectionId: string, type: "markdown" | "bullets" | "media") => {
    let nextIndex = -1;
    updateSection(sectionId, (section) => {
      nextIndex = section.blocks.length;
      return {
        ...section,
        blocks: [...section.blocks, createBlock(type)],
      };
    });
    if (nextIndex >= 0) {
      highlightBlock(`${sectionId}-${nextIndex}`);
      showBlockToast(sectionId);
    }
  };

  const handleMoveBlock = (sectionId: string, blockIndex: number, direction: number) => {
    updateSection(sectionId, (section) => ({
      ...section,
      blocks: moveItem(section.blocks, blockIndex, blockIndex + direction),
    }));
  };

  const handleRemoveBlock = (sectionId: string, blockIndex: number) => {
    updateSection(sectionId, (section) => ({
      ...section,
      blocks: section.blocks.filter((_, idx) => idx !== blockIndex),
    }));
  };

  const resolveTargetSectionId = () => {
    if (!overrideDoc) {
      return null;
    }
    if (activeSectionId) {
      const exists = overrideDoc.doc.sections.some(
        (section) => section.id === activeSectionId,
      );
      if (exists) {
        return activeSectionId;
      }
    }
    return overrideDoc.doc.sections[overrideDoc.doc.sections.length - 1]?.id ?? null;
  };

  const handleAddFromMenu = (kind: "markdown" | "bullets" | "media" | "photo") => {
    const targetSectionId = resolveTargetSectionId();
    if (!targetSectionId) {
      setMediaStatus(t("exerciseEditor.addNoSection"));
      return;
    }
    setActiveSectionId(targetSectionId);
    setAddBlockMenuOpen(false);
    if (kind === "photo") {
      handlePhotoUploadRequest(targetSectionId);
      return;
    }
    handleAddBlock(targetSectionId, kind);
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

  const handleFocusSectionTitle = (sectionId: string) => {
    const input = sectionTitleRefs.current[sectionId];
    if (input) {
      input.focus();
      input.select();
    }
  };

  const handleFocusBlock = (key: string) => {
    const field = blockFieldRefs.current[key];
    if (field) {
      field.focus();
      if ("select" in field) {
        field.select();
      }
    }
  };

  const updatePillSelections = (next: {
    level: string;
    type: string[];
    muscles: string[];
    themes: string[];
  }) => {
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

  const toggleMultiSelection = (
    category: "type" | "muscles" | "themes",
    value: string,
  ) => {
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

  const addCustomOption = (category: "type" | "muscles" | "themes") => {
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

  const toggleDropdown = (category: "type" | "muscles" | "themes") => {
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

  const filteredTypeOptions = filterOptions(pillState.options.type, pillSearch.type);
  const filteredMuscleOptions = filterOptions(
    pillState.options.muscles,
    pillSearch.muscles,
  );
  const filteredThemeOptions = filterOptions(
    pillState.options.themes,
    pillSearch.themes,
  );

  // --- Sticky header on scroll past hero ---
  const heroContainerRef = useRef<HTMLDivElement | null>(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  useEffect(() => {
    const el = heroContainerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyHeader(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // --- Parallax hero (RAF-throttled) ---
  const heroImgRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const y = window.scrollY;
        if (y > 500 || !heroImgRef.current) return;
        heroImgRef.current.style.transform = `translateY(${y * 0.3}px) scale(1.05)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(rafId); };
  }, []);

  // --- Section reveal hooks ---
  const musclesRef = useReveal(0);
  const dosageRef = useReveal(50);
  const timerRef = useReveal(100);
  const mannequinRef = useReveal(150);
  const resumeRef = useReveal(0);
  const executionRef = useReveal(0);
  const respirationRef = useReveal(0);
  const conseilsRef = useReveal(0);
  const securiteRef = useReveal(50);

  // --- Swipe navigation between session exercises ---
  const currentIdx = sessionSiblings.findIndex((s) => s.slug === slug);
  const prevExercise = currentIdx > 0 ? sessionSiblings[currentIdx - 1] : null;
  const nextExercise = currentIdx < sessionSiblings.length - 1 ? sessionSiblings[currentIdx + 1] : null;

  // Prefetch adjacent exercise pages
  useEffect(() => {
    if (prevExercise) router.prefetch(`/exercices/${prevExercise.slug}`);
    if (nextExercise) router.prefetch(`/exercices/${nextExercise.slug}`);
  }, [prevExercise, nextExercise, router]);

  // Swipe gesture on hero
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const handleSwipeStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);
  const handleSwipeEnd = useCallback((e: React.TouchEvent) => {
    const start = swipeStartRef.current;
    if (!start) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    swipeStartRef.current = null;
    if (Math.abs(deltaX) > 80 && Math.abs(deltaX) > Math.abs(deltaY) * 2) {
      const target = deltaX < 0 ? nextExercise : prevExercise;
      if (target) {
        const heroEl = heroContainerRef.current;
        if (heroEl) {
          heroEl.style.transition = "transform 0.3s ease, opacity 0.3s ease";
          heroEl.style.transform = `translateX(${deltaX < 0 ? "-100%" : "100%"})`;
          heroEl.style.opacity = "0";
        }
        setTimeout(() => router.push(`/exercices/${target.slug}`), 300);
      }
    }
  }, [nextExercise, prevExercise, router]);

  // --- Favori burst ---
  const [favBursting, setFavBursting] = useState(false);
  const handleToggleFav = useCallback(() => {
    const wasFav = getFavoritesSnapshot().includes(merged.frontmatter.slug);
    toggleFavorite(merged.frontmatter.slug);
    if (wasFav === false) {
      setFavBursting(true);
      setTimeout(() => setFavBursting(false), 500);
    }
  }, [merged.frontmatter.slug]);

  // --- Collapsible sections ---
  const [conseilsOpen, setConseilsOpen] = useState(false);
  const [securiteOpen, setSecuriteOpen] = useState(false);

  // --- Parse markdown into structured sections & filter dosage ---
  const parsedSections = useMemo(() => {
    const raw = merged.content;
    const lines = raw.split('\n');
    type Section = { heading: string; body: string };
    const sections: Section[] = [];
    let currentHeading = '';
    let currentBody: string[] = [];

    for (const line of lines) {
      const headingMatch = line.match(/^##\s+(.+)/);
      if (headingMatch) {
        if (currentHeading || currentBody.length > 0) {
          sections.push({ heading: currentHeading, body: currentBody.join('\n').trim() });
        }
        currentHeading = headingMatch[1].trim();
        currentBody = [];
      } else {
        currentBody.push(line);
      }
    }
    if (currentHeading || currentBody.length > 0) {
      sections.push({ heading: currentHeading, body: currentBody.join('\n').trim() });
    }

    const find = (pattern: RegExp) => sections.find(s => pattern.test(s.heading));
    const dosage = find(/^dosage/i);

    // Extract rest value from dosage body for the timer
    let restRaw: string | null = null;
    if (dosage?.body) {
      const restMatch = dosage.body.match(/[Rr]epos\s+([\d][\d\-–']*\s*(?:s|sec|min|mn|')?)/i);
      if (restMatch) restRaw = restMatch[1].trim();
    }

    return {
      resume: find(/^r[eé]sum[eé]/i),
      execution: find(/^ex[eé]cution/i),
      respiration: find(/^respiration/i),
      conseils: find(/^conseils?/i),
      securite: find(/^s[eé]curit[eé]/i),
      erreurs: find(/^erreurs?/i),
      dosage,
      restRaw,
      all: sections,
    };
  }, [merged.content]);

  // Filter dosage-contaminated lines from execution steps (e.g. "6 x 3-10 reps", "Repos 90 s", "Technique.")
  const isDosageLine = (line: string) => {
    const t2 = line.replace(/^-\s*/, '').trim();
    if (/^\d[\d\-–]*\s*[x×]\s*\d/i.test(t2)) return true;
    if (/^repos\s+\d/i.test(t2)) return true;
    if (/^technique\.?$/i.test(t2)) return true;
    return false;
  };

  // Session badge label (ex: "S5 Fonctionnel")
  const sessionMatch = slug.match(/^s(\d+)/i);

  return (
    <>
      <ExerciseJsonLd frontmatter={merged.frontmatter} content={merged.content} locale={locale} />
      <style>{`
        .app-shell > .app-header,
        header.fixed.z-40 {
          display: none !important;
        }
        .page > nav[aria-label="breadcrumb"] {
          display: none;
        }
        .app-shell {
          padding-top: env(safe-area-inset-top, 0px) !important;
        }
        .page {
          padding-top: 0 !important;
          margin-top: 0 !important;
        }
      `}</style>

      {/* ─── STICKY HEADER (visible au scroll, après le hero) ─── */}
      <div
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${showStickyHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
        style={{ background: 'rgba(4,4,10,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        <div className="flex items-center gap-3 px-4 py-2.5 max-w-3xl mx-auto" style={{ height: '50px' }}>
          <Link
            href="/exercices"
            aria-label={t("exerciseDetail.backLabel")}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </Link>
          <h2 className="flex-1 text-sm font-semibold text-white truncate text-center" style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>{displayTitle}</h2>
          <button
            type="button"
            onClick={handleToggleFav}
            className={`fav-burst tap-feedback flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white shrink-0${favBursting ? ' is-bursting' : ''}`}
            aria-label={getFavoritesSnapshot().includes(merged.frontmatter.slug) ? t("favorites.remove") : t("favorites.add")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={getFavoritesSnapshot().includes(merged.frontmatter.slug) ? '#FF8C00' : 'none'} stroke={getFavoritesSnapshot().includes(merged.frontmatter.slug) ? '#FF8C00' : 'currentColor'} strokeWidth="2" className="w-4 h-4"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
          </button>
        </div>
      </div>

      {/* ─── 1. HERO MEDIA ─── */}
      {hero ? (
        <div
          ref={heroContainerRef}
          className="relative -mx-4 sm:-mx-6 md:mx-0 md:rounded-2xl overflow-hidden"
          style={{ touchAction: "pan-y" }}
          onTouchStart={handleSwipeStart}
          onTouchEnd={handleSwipeEnd}
        >
          {/* Boutons flottants */}
          <div className="absolute top-4 left-4 right-4 flex justify-between z-50">
            {/* Retour */}
            <Link
              href="/exercices"
              aria-label={t("exerciseDetail.backLabel")}
              className="tap-feedback flex items-center gap-2 px-3 py-2 rounded-full bg-black/40 backdrop-blur-md text-white text-sm font-medium hover:bg-black/50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              Exercices
            </Link>

            {/* Favori + Menu */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleFav}
                className={`fav-burst tap-feedback flex items-center justify-center w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/50 transition-colors${favBursting ? ' is-bursting' : ''}`}
                aria-label={getFavoritesSnapshot().includes(merged.frontmatter.slug) ? t("favorites.remove") : t("favorites.add")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={getFavoritesSnapshot().includes(merged.frontmatter.slug) ? '#FF8C00' : 'none'} stroke={getFavoritesSnapshot().includes(merged.frontmatter.slug) ? '#FF8C00' : 'currentColor'} strokeWidth="2" className="w-5 h-5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
              </button>
              <div className="relative">
                <button
                  type="button"
                  className="tap-feedback flex items-center justify-center w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white font-bold tracking-widest hover:bg-black/50 transition-colors"
                  aria-label={t("exerciseDetail.menuLabel")}
                  onPointerDown={(event) => {
                    if (event.ctrlKey || event.shiftKey) {
                      event.preventDefault();
                      cancelLongPress();
                      openPinModal();
                      return;
                    }
                    if (event.pointerType === "touch") {
                      touchPointerActiveRef.current = true;
                    } else {
                      event.preventDefault();
                    }
                    startLongPress(event.clientX, event.clientY);
                  }}
                  onPointerMove={(event) => cancelLongPressOnMove(event.clientX, event.clientY)}
                  onPointerUp={() => { cancelLongPress(); touchPointerActiveRef.current = false; }}
                  onPointerLeave={() => { cancelLongPress(); touchPointerActiveRef.current = false; }}
                  onPointerCancel={() => { cancelLongPress(); touchPointerActiveRef.current = false; }}
                  onMouseDown={(event) => { if (event.ctrlKey || event.shiftKey) { event.preventDefault(); cancelLongPress(); openPinModal(); return; } event.preventDefault(); }}
                  onTouchStart={(event) => { if (touchPointerActiveRef.current) return; const touch = event.touches[0]; if (!touch) return; startLongPress(touch.clientX, touch.clientY); }}
                  onTouchMove={(event) => { if (touchPointerActiveRef.current) return; const touch = event.touches[0]; if (!touch) return; cancelLongPressOnMove(touch.clientX, touch.clientY); }}
                  onTouchEnd={() => { cancelLongPress(); touchPointerActiveRef.current = false; }}
                  onTouchCancel={() => { cancelLongPress(); touchPointerActiveRef.current = false; }}
                  onContextMenu={(event) => event.preventDefault()}
                  onClick={(event) => { if (event.ctrlKey || event.shiftKey) { event.preventDefault(); cancelLongPress(); openPinModal(); } else { event.stopPropagation(); setMenuOpen(!menuOpen); } }}
                  onKeyDown={(event) => { if (teacherUnlocked) return; if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setMenuOpen(!menuOpen); } }}
                  style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
                >
                  ···
                </button>
                {menuOpen && (
                  <div className="absolute top-12 right-0 min-w-48 rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-md p-2 shadow-xl z-[60]">
                    <button type="button" onClick={() => { toggleFavorite(merged.frontmatter.slug); setMenuOpen(false); }} className="w-full text-left px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors">
                      {getFavoritesSnapshot().includes(merged.frontmatter.slug) ? t("favorites.remove") : t("favorites.add")}
                    </button>
                    <button type="button" onClick={() => { const fm = merged.frontmatter; if (sessionDraft.isInDraft(fm.slug)) { sessionDraft.removeItem(fm.slug); } else { sessionDraft.addItem({ slug: fm.slug, title: fm.title, muscles: fm.muscles }); } setMenuOpen(false); }} className="w-full text-left px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors">
                      {sessionDraft.isInDraft(merged.frontmatter.slug) ? `✓ ${t("exerciseDetail.inSession")}` : `＋ ${t("exerciseDetail.addToSession")}`}
                    </button>
                    <div className="h-px bg-white/10 my-1" />
                    <button type="button" onClick={() => { if (teacherUnlocked) { openOverrideEditor(); } else { openPinModal(); } setMenuOpen(false); }} className="w-full text-left px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors">
                      {t("exerciseDetail.teacherMode")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hero media pleine largeur — parallax wrapper */}
          <div ref={heroImgRef} className="hero-parallax" style={{ transform: "scale(1.05)" }}>
            {hero.type === "video" ? (
              <HeroMedia type="video" src={hero.src} alt={hero.alt} imageFallback={hero.imageFallback} rounded={false} />
            ) : (
              <HeroMedia type="image" src={hero.src} alt={hero.alt} width={hero.width} height={hero.height} priority rounded={false} />
            )}
          </div>

          {/* Gradient vers fond #04040A + titre overlay + nav session */}
          <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-3 pt-20" style={{ background: 'linear-gradient(to top, #04040A 0%, rgba(4,4,10,0.7) 50%, transparent 100%)' }}>
            <h1 className="text-white text-3xl md:text-4xl leading-none tracking-wide" style={{ fontFamily: 'var(--font-bebas), sans-serif' }}>
              {displayTitle}
            </h1>
            {/* Navigation session inline dans le hero */}
            {(prevExercise || nextExercise) && (
              <div className="flex items-center justify-between mt-2" style={{ maxWidth: 240 }}>
                {prevExercise ? (
                  <Link
                    href={`/exercices/${prevExercise.slug}`}
                    className="tap-feedback flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/30 hover:text-white/60 transition-colors"
                    style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                  >
                    <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12.5 15l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {prevExercise.slug.toUpperCase()}
                  </Link>
                ) : <span />}
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/70" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                  {slug.toUpperCase()}
                </span>
                {nextExercise ? (
                  <Link
                    href={`/exercices/${nextExercise.slug}`}
                    className="tap-feedback flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/30 hover:text-white/60 transition-colors"
                    style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                  >
                    {nextExercise.slug.toUpperCase()}
                    <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7.5 15l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </Link>
                ) : <span />}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ─── 3. MATERIEL + NIVEAU ─── */}
      {(merged.frontmatter.equipment?.length || difficulty) && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {merged.frontmatter.equipment && merged.frontmatter.equipment.length > 0 && translateTerms(merged.frontmatter.equipment, "equipment", lang).map((eq) => (
              <span key={eq} className="tap-feedback inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 capitalize">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 opacity-50"><rect x="2" y="10" width="20" height="4" rx="1" /><line x1="6" y1="7" x2="6" y2="17" /><line x1="18" y1="7" x2="18" y2="17" /></svg>
                {eq}
              </span>
            ))}
          </div>
          <DifficultyPill level={difficulty} />
        </div>
      )}

      {/* ─── 4. DOSAGE RECOMMANDE ─── */}
      <div ref={dosageRef as React.RefObject<HTMLDivElement>} className="tap-feedback">
        <ExerciseQuickInfo
          content={merged.content}
          securite={merged.frontmatter.consignes_securite ?? ''}
        />
      </div>

      {/* ─── 5. TIMER REPOS ─── */}
      <div ref={timerRef as React.RefObject<HTMLDivElement>} className="tap-feedback">
        <RestTimer restRaw={parsedSections.restRaw} />
      </div>

      {/* ─── 6. CHIPS MUSCLES ─── */}
      {merged.frontmatter.muscles.length > 0 && (
        <div ref={musclesRef as React.RefObject<HTMLDivElement>} className="flex flex-wrap gap-2">
          {merged.frontmatter.muscles.map((muscle) => {
            const group = getMuscleGroup(muscle);
            if (!group) {
              // Fantôme (cardio, coordination…) — pas de chip
              return null;
            }
            const color = MUSCLE_GROUP_COLORS[group];
            const display = getMuscleDisplayName(muscle);
            const label = display.oldName && display.oldName !== display.official
              ? `${display.official} (${display.oldName})`
              : display.official;
            return (
              <Link
                key={muscle}
                href={`/exercices?muscle=${group}`}
                title={t("exerciseDetail.filterByMuscle")}
                className="tap-feedback inline-flex items-center rounded-full px-3 py-2 text-xs font-medium capitalize transition-colors"
                style={{ backgroundColor: "transparent", border: `1px solid ${color}66`, color }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}

      {/* ─── 7. MANNEQUIN ANATOMIQUE 3D ─── */}
      {merged.frontmatter.muscles.length > 0 && (() => {
        const anatomyGroups = getMuscleGroups(merged.frontmatter.muscles);
        return (
          <div ref={mannequinRef as React.RefObject<HTMLDivElement>} style={{ margin: "-6px 0" }}>
            <ExerciseMannequin3D
              muscles={merged.frontmatter.muscles}
              slug={slug}
              anatomyGroups={anatomyGroups}
              title={displayTitle}
            />
          </div>
        );
      })()}

      {/* ─── 6-10. CONTENU STRUCTURÉ ─── */}
      {overrideDocView ? (
        /* Override teacher: render structured sections, skip Dosage heading */
        <div className="flex flex-col gap-4">
          {overrideDocView.sections
            .filter((section) => !/^dosage$/i.test(section.title?.trim() ?? ''))
            .map((section) => (
            <section key={section.id}>
              {section.title ? (
                <h2 className="text-xl uppercase tracking-wider mb-3 mt-1" style={{ fontFamily: 'var(--font-bebas), sans-serif', color: /^s[eé]curit[eé]/i.test(section.title) ? '#FF006E' : '#00E5FF' }}>{section.title}</h2>
              ) : null}
              <div className="flex flex-col gap-3">
                {section.blocks.map((block, blockIndex) => {
                  if (block.type === "markdown") {
                    return <MarkdownRenderer key={`markdown-${section.id}-${blockIndex}`}>{block.content}</MarkdownRenderer>;
                  }
                  if (block.type === "bullets") {
                    return (
                      <ul key={`bullets-${section.id}-${blockIndex}`} className="list-disc pl-6 space-y-1">
                        {block.items.map((item, itemIndex) => (<li key={`item-${section.id}-${blockIndex}-${itemIndex}`}>{item}</li>))}
                      </ul>
                    );
                  }
                  return (
                    <div key={`media-${section.id}-${blockIndex}`} className="flex flex-col gap-2">
                      {block.mediaType === "image" ? (() => {
                        const directUrl = block.url?.trim();
                        const resolvedUrl = directUrl || (block.mediaId ? mediaUrlMap[block.mediaId] ?? mediaUrlCache.get(block.mediaId) : undefined);
                        if (resolvedUrl) {
                          return (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={resolvedUrl} alt={block.caption || `${displayTitle} — ${(merged.frontmatter.muscles ?? []).slice(0, 3).join(", ")}`} className="w-full h-auto rounded-2xl ring-1 ring-white/10" loading="lazy" decoding="async" />
                            </>
                          );
                        }
                        return <p className="text-xs text-[color:var(--muted)]">{t("exerciseEditor.imagePending")}</p>;
                      })() : null}
                      {block.mediaType === "video" ? (block.url ? <video className="w-full rounded-2xl ring-1 ring-white/10" controls src={block.url} /> : <p className="text-xs text-[color:var(--muted)]">{t("exerciseEditor.urlMissing")}</p>) : null}
                      {block.mediaType === "link" ? (block.url ? <a className="text-sm underline" href={block.url} target="_blank" rel="noreferrer">{block.caption || block.url}</a> : <p className="text-xs text-[color:var(--muted)]">{t("exerciseEditor.urlMissing")}</p>) : null}
                      {block.caption && block.mediaType !== "link" ? <p className="text-xs text-[color:var(--muted)]">{block.caption}</p> : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        /* MDX content: render structured sections individually */
        <div className="flex flex-col gap-0">
          {/* 6. RESUME */}
          {parsedSections.resume && parsedSections.resume.body && (
            <div ref={resumeRef as React.RefObject<HTMLDivElement>} className="border-l-2 border-[#FF8C00] pl-4 py-1 mb-4">
              <p className="text-[15px] text-white/90 leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                {parsedSections.resume.body}
              </p>
            </div>
          )}

          {/* 7. EXECUTION (dosage lines filtered) */}
          {parsedSections.execution && parsedSections.execution.body && (
            <div ref={executionRef as React.RefObject<HTMLDivElement>} className="mb-4">
              <h2 className="text-xl uppercase tracking-wider mb-3 mt-1" style={{ fontFamily: 'var(--font-bebas), sans-serif', color: '#00E5FF' }}>
                {parsedSections.execution.heading}
              </h2>
              <div className="flex flex-col gap-2.5">
                {(() => {
                  const steps = parsedSections.execution.body.split('\n')
                    .filter(l => l.trim().startsWith('-'))
                    .filter(l => !isDosageLine(l));
                  return steps.map((line, i) => {
                    const text = line.replace(/^-\s*/, '').trim();
                    return (
                      <RevealStep key={i} delay={i * 80}>
                        <div className="flex gap-3 items-start">
                          <span className="text-2xl leading-none text-[#FF8C00] shrink-0 w-8 text-right" style={{ fontFamily: 'var(--font-bebas), sans-serif' }}>{i + 1}</span>
                          <p className="text-sm text-white/80 leading-relaxed pt-0.5" style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>{text}</p>
                        </div>
                      </RevealStep>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Séparateur */}
          <div className="h-px bg-white/5 my-2" />

          {/* 8. RESPIRATION */}
          {parsedSections.respiration && parsedSections.respiration.body && (
            <div ref={respirationRef as React.RefObject<HTMLDivElement>} className="mb-4">
              <h2 className="text-xl uppercase tracking-wider mb-2 mt-2" style={{ fontFamily: 'var(--font-bebas), sans-serif', color: '#00E5FF' }}>
                {parsedSections.respiration.heading}
              </h2>
              <p className="text-sm text-white/70 leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                {parsedSections.respiration.body}
              </p>
            </div>
          )}

          {/* Séparateur */}
          {(parsedSections.conseils || parsedSections.securite) && <div className="h-px bg-white/5 my-1" />}

          {/* 9. CONSEILS (collapsible) */}
          {parsedSections.conseils && parsedSections.conseils.body && (
            <div ref={conseilsRef as React.RefObject<HTMLDivElement>} className="mb-1">
              <button
                type="button"
                onClick={() => setConseilsOpen(!conseilsOpen)}
                className="tap-feedback flex items-center justify-between w-full py-2 text-left"
              >
                <h2 className="text-xl uppercase tracking-wider" style={{ fontFamily: 'var(--font-bebas), sans-serif', color: '#00E5FF' }}>
                  {parsedSections.conseils.heading}
                </h2>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 text-white/40 transition-transform duration-200 ${conseilsOpen ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {conseilsOpen && (
                <div className="pb-2">
                  <ul className="flex flex-col gap-1.5 pl-1">
                    {parsedSections.conseils.body.split('\n').filter(l => l.trim().startsWith('-')).map((line, i) => (
                      <li key={i} className="flex gap-2 items-start text-sm text-white/70 leading-relaxed">
                        <span className="text-[#FF8C00] mt-1 shrink-0">•</span>
                        <span>{line.replace(/^-\s*/, '').trim()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 10. SECURITE (collapsible, accent magenta) */}
          {parsedSections.securite && parsedSections.securite.body && (
            <div ref={securiteRef as React.RefObject<HTMLDivElement>} className="mb-1">
              <button
                type="button"
                onClick={() => setSecuriteOpen(!securiteOpen)}
                className="tap-feedback flex items-center justify-between w-full py-2 text-left"
              >
                <h2 className="flex items-center gap-2 text-xl uppercase tracking-wider" style={{ fontFamily: 'var(--font-bebas), sans-serif', color: '#FF006E' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FF006E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  {parsedSections.securite.heading}
                </h2>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 transition-transform duration-200 ${securiteOpen ? 'rotate-180' : ''}`} style={{ color: 'rgba(255,0,110,0.4)' }}><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {securiteOpen && (
                <div className="rounded-xl px-4 py-3 mb-1" style={{ background: 'rgba(255,0,110,0.05)', border: '1px solid rgba(255,0,110,0.15)' }}>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,0,110,0.8)' }}>
                    {parsedSections.securite.body}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Erreurs courantes (si présent, dans le flux) */}
          {parsedSections.erreurs && parsedSections.erreurs.body && (
            <div className="mb-4">
              <h2 className="text-xl uppercase tracking-wider mb-2 mt-2" style={{ fontFamily: 'var(--font-bebas), sans-serif', color: '#00E5FF' }}>
                {parsedSections.erreurs.heading}
              </h2>
              <ul className="flex flex-col gap-1.5 pl-1">
                {parsedSections.erreurs.body.split('\n').filter(l => l.trim().startsWith('-')).map((line, i) => (
                  <li key={i} className="flex gap-2 items-start text-sm text-white/70 leading-relaxed">
                    <span className="text-red-400 mt-1 shrink-0">•</span>
                    <span>{line.replace(/^-\s*/, '').trim()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ─── PANEL ENSEIGNANT ─── */}
      {teacherUnlocked ? (
        <div className="teacher-panel">
          <p className="eyebrow">{t("exerciseEditor.teacherPanel")}</p>
          <div className="modal-actions">
            <button type="button" className="primary-button primary-button--wide" onClick={openOverrideEditor}>
              {t("exerciseDetail.editExercise")}
            </button>
          </div>
          {submitStatus ? <p className="text-xs text-[color:var(--muted)]">{submitStatus}</p> : null}
        </div>
      ) : null}

      {pinModalOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2>{t("teacherMode.pinHeading")}</h2>
            <form onSubmit={handleUnlock} className="stack-md">
              <input
                className="field-input"
                type="password"
                inputMode="numeric"
                autoFocus
                placeholder="••••"
                value={teacherPin}
                onChange={(event) => setTeacherPin(event.target.value)}
              />
              {teacherError ? (
                <p className="text-xs text-[color:var(--muted)]">{teacherError}</p>
              ) : null}
              <div className="modal-actions">
                <button type="submit" className="primary-button primary-button--wide">
                  {t("teacherMode.unlock")}
                </button>
                <button
                  type="button"
                  className="chip"
                  onClick={() => setPinModalOpen(false)}
                >
                  {t("teacherMode.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <OverrideUIProvider
        value={{
          activeSectionId,
          sectionMenuOpenId,
          blockMenuOpenKey,
          highlightBlockKey,
          addBlockMenuOpen,
          confirmCloseOpen,
          deleteLiveOpen,
          isDeletingLive,
          liveExists,
          teacherPin,
          setActiveSectionId,
          setSectionMenuOpenId,
          setBlockMenuOpenKey,
          setHighlightBlockKey,
          setAddBlockMenuOpen,
          setConfirmCloseOpen,
          setDeleteLiveOpen,
          setIsDeletingLive,
          setLiveExists,
          setTeacherPin,
          sectionTitleRefs,
          blockFieldRefs,
          blockContainerRefs,
          highlightTimerRef,
          addBlockMenuRef,
          addBlockButtonRef,
          handleAddSection,
          handleMoveSection,
          handleRemoveSection,
          handleAddBlock,
          handleMoveBlock,
          handleRemoveBlock,
          handleAddFromMenu,
          handleDeleteLive,
          showBlockToast,
          dismissBlockToast,
          resolveSectionTitle,
          resolveTargetSectionId,
        }}
      >
        <OverrideDocProvider value={overrideDocValue}>
          <OverrideMediaProvider
            value={{
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
            }}
          >
            <OverridePillsProvider
              value={{
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
              }}
            >
      {overrideOpen ? (
        <>
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card flex max-h-[85vh] flex-col">
            <div className="flex flex-col gap-2 border-b border-white/10 pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h2>{t("exerciseEditor.fixSheet")}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {overrideToast ? (
                    <span className="text-xs text-[color:var(--muted)]">
                      {overrideToast.tone === "success" ? "OK: " : `${t("exerciseEditor.errorPrefix")} `}
                      {overrideToast.message}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className="chip"
                    onClick={handleCloseOverride}
                  >
                    ✕ {t("exerciseEditor.close")}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pt-4">
              {isDirty ? (
                <div className="sticky top-0 z-20 mb-4">
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-400/40 bg-amber-500/30 px-4 py-2 shadow-lg">
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                      <span
                        className="inline-flex h-2 w-2 rounded-full bg-amber-200"
                        aria-hidden="true"
                      />
                      {t("exerciseEditor.changesPending")}
                    </div>
                    <span className="text-xs text-amber-100/80">
                      {t("exerciseEditor.rememberToSave")}
                    </span>
                  </div>
                </div>
              ) : null}
              {overrideDoc ? (
                <div className="stack-md">
                  {liveExists ? (
                    <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 shadow-lg">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span aria-hidden="true">⚠️</span>
                            <h3 className="text-base font-semibold">{t("exerciseEditor.savedVersion")}</h3>
                            <span className="rounded-full border border-red-400/60 bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-100">
                              {t("exerciseEditor.activeVersion")}
                            </span>
                          </div>
                          <p className="text-sm text-[color:var(--muted)]">
                            {t("exerciseEditor.liveExistsWarning")}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="primary-button primary-button--wide bg-red-500 text-white hover:bg-red-600"
                          onClick={() => setDeleteLiveOpen(true)}
                        >
                          {t("exerciseEditor.deleteSaved")}…
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div className="rounded-2xl border border-white/10 bg-[color:var(--bg-2)] p-4 shadow-lg">
                    <div className="stack-md">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-base font-semibold">{t("exerciseEditor.categories")}</h3>
                        <p className="text-sm text-[color:var(--muted)]">
                          {t("exerciseEditor.categoriesDesc")}
                        </p>
                      </div>
                      <div className="stack-md">
                    <div className="stack-sm">
                      <label className="field-label">{t("exerciseEditor.levelLabel")}</label>
                      <select
                        className="field-input"
                        value={pillState.selections.level}
                        onChange={(event) => setLevelSelection(event.target.value)}
                      >
                        <option value="">{t("exerciseEditor.levelPlaceholder")}</option>
                        {pillState.options.level.map((option) => (
                          <option key={`level-${option}`} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {levelAddOpen ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            className="field-input"
                            placeholder={t("exerciseEditor.newLevelPlaceholder")}
                            value={levelAddValue}
                            onChange={(event) => setLevelAddValue(event.target.value)}
                          />
                          <button
                            type="button"
                            className="chip"
                            onClick={addCustomLevel}
                          >
                            {t("exerciseEditor.add")}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="chip chip-ghost w-fit"
                          onClick={() => setLevelAddOpen(true)}
                        >
                          {t("exerciseEditor.addLevel")}
                        </button>
                      )}
                    </div>

                    <div className="stack-sm">
                      <label className="field-label">{t("exerciseEditor.typeLabel")}</label>
                      <div className="relative">
                        <button
                          type="button"
                          className="field-input flex items-center justify-between"
                          ref={(node) => {
                            dropdownTriggerRefs.current.type = node;
                          }}
                          onClick={() => toggleDropdown("type")}
                        >
                          <span>
                            {pillState.selections.type.length > 0
                              ? `${pillState.selections.type.length} ${t(pillState.selections.type.length === 1 ? "exerciseEditor.selectedSingular" : "exerciseEditor.selectedPlural")}`
                              : t("exerciseEditor.selectPlaceholder")}
                          </span>
                          <span aria-hidden="true">▾</span>
                        </button>
                      </div>
                      {pillDropdownOpen === "type" && pillDropdownStyle
                        ? createPortal(
                            <div
                              ref={dropdownMenuRef}
                              className={DROPDOWN_MENU_LAYER_CLASS}
                              style={{
                                position: "absolute",
                                top: pillDropdownStyle.top,
                                left: pillDropdownStyle.left,
                                width: pillDropdownStyle.width,
                              }}
                            >
                              <div className={DROPDOWN_MENU_PANEL_CLASS}>
                                <div className="sticky top-0 z-10 bg-[color:var(--bg-2)] pb-2">
                                  <input
                                    className="field-input"
                                    placeholder={t("exerciseEditor.searchPlaceholder")}
                                    value={pillSearch.type}
                                    onChange={(event) =>
                                      setPillSearch((prev) => ({
                                        ...prev,
                                        type: event.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div
                                  className="space-y-1 overflow-y-auto"
                                  style={{ maxHeight: DROPDOWN_MAX_HEIGHT }}
                                >
                                  {filteredTypeOptions.map((option) => {
                                    const checked = pillState.selections.type.some(
                                      (value) => normalizeKey(value) === normalizeKey(option),
                                    );
                                    return (
                                      <label
                                        key={`type-option-${option}`}
                                        className="flex min-h-[36px] items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-white/10"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() => toggleMultiSelection("type", option)}
                                        />
                                        <span>{option}</span>
                                      </label>
                                    );
                                  })}
                                  {normalizeLabel(pillSearch.type) &&
                                  !optionExists(pillState.options.type, pillSearch.type) ? (
                                    <button
                                      type="button"
                                      className="chip w-full justify-start"
                                      onClick={() => addCustomOption("type")}
                                    >
                                      {`${t("exerciseEditor.add")} '${normalizeLabel(pillSearch.type)}'`}
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>,
                            document.body,
                          )
                        : null}
                      <div className="flex flex-wrap gap-2">
                        {pillState.selections.type.length > 0 ? (
                          pillState.selections.type.map((value) => (
                            <span
                              key={`type-pill-${value}`}
                              className="pill inline-flex items-center gap-2"
                            >
                              {value}
                              <button
                                type="button"
                                className="text-xs text-[color:var(--muted)] hover:text-[color:var(--ink)]"
                                onClick={() => toggleMultiSelection("type", value)}
                              >
                                ×
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[color:var(--muted)]">
                            {t("exerciseEditor.noTypeSelected")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="stack-sm">
                      <label className="field-label">{t("exerciseEditor.musclesLabel")}</label>
                      <div className="relative">
                        <button
                          type="button"
                          className="field-input flex items-center justify-between"
                          ref={(node) => {
                            dropdownTriggerRefs.current.muscles = node;
                          }}
                          onClick={() => toggleDropdown("muscles")}
                        >
                          <span>
                            {pillState.selections.muscles.length > 0
                              ? `${pillState.selections.muscles.length} ${t(pillState.selections.muscles.length === 1 ? "exerciseEditor.selectedSingular" : "exerciseEditor.selectedPlural")}`
                              : t("exerciseEditor.selectPlaceholder")}
                          </span>
                          <span aria-hidden="true">▾</span>
                        </button>
                      </div>
                      {pillDropdownOpen === "muscles" && pillDropdownStyle
                        ? createPortal(
                            <div
                              ref={dropdownMenuRef}
                              className={DROPDOWN_MENU_LAYER_CLASS}
                              style={{
                                position: "absolute",
                                top: pillDropdownStyle.top,
                                left: pillDropdownStyle.left,
                                width: pillDropdownStyle.width,
                              }}
                            >
                              <div className={DROPDOWN_MENU_PANEL_CLASS}>
                                <div className="sticky top-0 z-10 bg-[color:var(--bg-2)] pb-2">
                                  <input
                                    className="field-input"
                                    placeholder={t("exerciseEditor.searchPlaceholder")}
                                    value={pillSearch.muscles}
                                    onChange={(event) =>
                                      setPillSearch((prev) => ({
                                        ...prev,
                                        muscles: event.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div
                                  className="space-y-1 overflow-y-auto"
                                  style={{ maxHeight: DROPDOWN_MAX_HEIGHT }}
                                >
                                  {filteredMuscleOptions.map((option) => {
                                    const checked = pillState.selections.muscles.some(
                                      (value) => normalizeKey(value) === normalizeKey(option),
                                    );
                                    return (
                                      <label
                                        key={`muscle-option-${option}`}
                                        className="flex min-h-[36px] items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-white/10"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() => toggleMultiSelection("muscles", option)}
                                        />
                                        <span>{option}</span>
                                      </label>
                                    );
                                  })}
                                  {normalizeLabel(pillSearch.muscles) &&
                                  !optionExists(pillState.options.muscles, pillSearch.muscles) ? (
                                    <button
                                      type="button"
                                      className="chip w-full justify-start"
                                      onClick={() => addCustomOption("muscles")}
                                    >
                                      {`${t("exerciseEditor.add")} '${normalizeLabel(pillSearch.muscles)}'`}
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>,
                            document.body,
                          )
                        : null}
                      <div className="flex flex-wrap gap-2">
                        {pillState.selections.muscles.length > 0 ? (
                          pillState.selections.muscles.map((value) => (
                            <span
                              key={`muscle-pill-${value}`}
                              className="pill inline-flex items-center gap-2"
                            >
                              {value}
                              <button
                                type="button"
                                className="text-xs text-[color:var(--muted)] hover:text-[color:var(--ink)]"
                                onClick={() => toggleMultiSelection("muscles", value)}
                              >
                                ×
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[color:var(--muted)]">
                            {t("exerciseEditor.noMuscleSelected")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="stack-sm">
                      <label className="field-label">{t("exerciseEditor.themesLabel")}</label>
                      <div className="relative">
                        <button
                          type="button"
                          className="field-input flex items-center justify-between"
                          ref={(node) => {
                            dropdownTriggerRefs.current.themes = node;
                          }}
                          onClick={() => toggleDropdown("themes")}
                        >
                          <span>
                            {pillState.selections.themes.length > 0
                              ? `${pillState.selections.themes.length} ${t(pillState.selections.themes.length === 1 ? "exerciseEditor.selectedSingular" : "exerciseEditor.selectedPlural")}`
                              : t("exerciseEditor.selectPlaceholder")}
                          </span>
                          <span aria-hidden="true">▾</span>
                        </button>
                      </div>
                      {pillDropdownOpen === "themes" && pillDropdownStyle
                        ? createPortal(
                            <div
                              ref={dropdownMenuRef}
                              className={DROPDOWN_MENU_LAYER_CLASS}
                              style={{
                                position: "absolute",
                                top: pillDropdownStyle.top,
                                left: pillDropdownStyle.left,
                                width: pillDropdownStyle.width,
                              }}
                            >
                              <div className={DROPDOWN_MENU_PANEL_CLASS}>
                                <div className="sticky top-0 z-10 bg-[color:var(--bg-2)] pb-2">
                                  <input
                                    className="field-input"
                                    placeholder={t("exerciseEditor.searchPlaceholder")}
                                    value={pillSearch.themes}
                                    onChange={(event) =>
                                      setPillSearch((prev) => ({
                                        ...prev,
                                        themes: event.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div
                                  className="space-y-1 overflow-y-auto"
                                  style={{ maxHeight: DROPDOWN_MAX_HEIGHT }}
                                >
                                  {filteredThemeOptions.map((option) => {
                                    const checked = pillState.selections.themes.some(
                                      (value) => normalizeKey(value) === normalizeKey(option),
                                    );
                                    return (
                                      <label
                                        key={`theme-option-${option}`}
                                        className="flex min-h-[36px] items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-white/10"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() => toggleMultiSelection("themes", option)}
                                        />
                                        <span>{option}</span>
                                      </label>
                                    );
                                  })}
                                  {normalizeLabel(pillSearch.themes) &&
                                  !optionExists(pillState.options.themes, pillSearch.themes) ? (
                                    <button
                                      type="button"
                                      className="chip w-full justify-start"
                                      onClick={() => addCustomOption("themes")}
                                    >
                                      {`${t("exerciseEditor.add")} '${normalizeLabel(pillSearch.themes)}'`}
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>,
                            document.body,
                          )
                        : null}
                      <div className="flex flex-wrap gap-2">
                        {pillState.selections.themes.length > 0 ? (
                          pillState.selections.themes.map((value) => (
                            <span
                              key={`theme-pill-${value}`}
                              className="pill inline-flex items-center gap-2"
                            >
                              {value}
                              <button
                                type="button"
                                className="text-xs text-[color:var(--muted)] hover:text-[color:var(--ink)]"
                                onClick={() => toggleMultiSelection("themes", value)}
                              >
                                ×
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[color:var(--muted)]">
                            {t("exerciseEditor.noThemeSelected")}
                          </span>
                        )}
                      </div>
                    </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[color:var(--bg-2)] p-4 shadow-lg">
                    <div className="stack-md">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-base font-semibold">{t("exerciseEditor.mainImageLabel")}</h3>
                        <p className="text-sm text-[color:var(--muted)]">
                          {t("exerciseEditor.mainImageDesc")}
                        </p>
                      </div>
                      <div className="stack-sm">
                  <input
                    className="field-input"
                    placeholder={t("exerciseEditor.imageUrlPlaceholder")}
                    value={overrideDoc.doc.heroImage?.url ?? ""}
                    onChange={(event) => handleHeroUrlChange(event.target.value)}
                  />
                  <input
                    className="field-input"
                    placeholder={t("exerciseEditor.altTextPlaceholder")}
                    value={overrideDoc.doc.heroImage?.alt ?? ""}
                    onChange={(event) => handleHeroAltChange(event.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="chip"
                      onClick={handleHeroPreview}
                    >
                      {t("exerciseEditor.preview")}
                    </button>
                    <button
                      type="button"
                      className="chip"
                      onClick={handleHeroRemove}
                    >
                      {t("exerciseEditor.deleteImage")}
                    </button>
                  </div>
                  {heroPreviewUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={heroPreviewUrl}
                        alt={t("exerciseEditor.preview")}
                        className="w-full h-auto rounded-2xl ring-1 ring-white/10"
                      />
                    </>
                  ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[color:var(--bg-2)] p-4 shadow-lg">
                    <div className="stack-md">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-base font-semibold">{t("exerciseEditor.contentCardTitle")}</h3>
                        <p className="text-sm text-[color:var(--muted)]">
                          {t("exerciseEditor.contentCardDesc")}
                        </p>
                      </div>
                      <div className="stack-md">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                            {t("exerciseEditor.sectionsLabel")}
                          </h3>
                          <button
                            type="button"
                            className="chip"
                            onClick={handleAddSection}
                          >
                            {t("exerciseEditor.addSection")}
                          </button>
                        </div>
                  {overrideDoc.doc.sections.map((section, sectionIndex) => (
                    <div
                      key={section.id}
                      className="stack-md"
                      onFocusCapture={() => setActiveSectionId(section.id)}
                      onMouseDown={() => setActiveSectionId(section.id)}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <input
                          ref={(node) => {
                            sectionTitleRefs.current[section.id] = node;
                          }}
                          className="field-input flex-1"
                          value={section.title}
                          placeholder={t("exerciseEditor.sectionTitlePlaceholder")}
                          onChange={(event) =>
                            updateSection(section.id, (current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                        />
                        <div className="relative">
                          <button
                            type="button"
                            className="chip"
                            onClick={() => {
                              setActiveSectionId(section.id);
                              setSectionMenuOpenId((open) =>
                                open === section.id ? null : section.id,
                              );
                            }}
                          >
                            ...
                          </button>
                          {sectionMenuOpenId === section.id ? (
                            <div
                              className={`absolute right-0 ${DROPDOWN_MENU_LAYER_CLASS} mt-2 w-48 ${DROPDOWN_MENU_PANEL_CLASS}`}
                            >
                              <button
                                type="button"
                                className="chip w-full justify-start"
                                onClick={() => {
                                  handleFocusSectionTitle(section.id);
                                  setSectionMenuOpenId(null);
                                }}
                              >
                                {t("exerciseEditor.rename")}
                              </button>
                              <div className="mt-2 border-t border-white/10 pt-2">
                                <span className="block px-2 pb-1 text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                                  {t("exerciseEditor.addBlock")}
                                </span>
                                <button
                                  type="button"
                                  className="chip w-full justify-start"
                                  onClick={() => {
                                    setActiveSectionId(section.id);
                                    handleAddBlock(section.id, "markdown");
                                    setSectionMenuOpenId(null);
                                  }}
                                >
                                  {t("exerciseEditor.textBlock")}
                                </button>
                                <button
                                  type="button"
                                  className="chip w-full justify-start"
                                  onClick={() => {
                                    setActiveSectionId(section.id);
                                    handleAddBlock(section.id, "bullets");
                                    setSectionMenuOpenId(null);
                                  }}
                                >
                                  {t("exerciseEditor.bulletsList")}
                                </button>
                                <button
                                  type="button"
                                  className="chip w-full justify-start"
                                  onClick={() => {
                                    setActiveSectionId(section.id);
                                    handlePhotoUploadRequest(section.id);
                                    setSectionMenuOpenId(null);
                                  }}
                                >
                                  {t("exerciseEditor.photoBlock")}
                                </button>
                              </div>
                              <button
                                type="button"
                                className="chip w-full justify-start"
                                disabled={sectionIndex === 0}
                                onClick={() => {
                                  handleMoveSection(section.id, -1);
                                  setSectionMenuOpenId(null);
                                }}
                              >
                                {t("exerciseEditor.moveUp")}
                              </button>
                              <button
                                type="button"
                                className="chip w-full justify-start"
                                disabled={
                                  sectionIndex === overrideDoc.doc.sections.length - 1
                                }
                                onClick={() => {
                                  handleMoveSection(section.id, 1);
                                  setSectionMenuOpenId(null);
                                }}
                              >
                                {t("exerciseEditor.moveDown")}
                              </button>
                              <button
                                type="button"
                                className="chip w-full justify-start"
                                onClick={() => {
                                  handleRemoveSection(section.id);
                                  setSectionMenuOpenId(null);
                                }}
                              >
                                {t("exerciseEditor.deleteSection")}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      {section.blocks.length === 0 ? (
                        <p className="text-xs text-[color:var(--muted)]">
                          {t("exerciseEditor.noBlocks")}
                        </p>
                      ) : null}
                      <div className="stack-sm">
                        {section.blocks.map((block, blockIndex) => {
                          const blockKey = `${section.id}-${blockIndex}`;
                          const blockLabel =
                            block.type === "markdown"
                              ? t("exerciseEditor.textBlock")
                              : block.type === "bullets"
                                ? t("exerciseEditor.bulletsList")
                                : block.mediaType === "image"
                                  ? t("exerciseEditor.photoBlock")
                                  : block.mediaType === "video"
                                    ? t("exerciseEditor.video")
                                    : t("exerciseEditor.linkType");
                          const hasPhoto =
                            block.type === "media" &&
                            block.mediaType === "image" &&
                            (block.mediaId || block.url);
                      
                          return (
                            <div
                              key={blockKey}
                              ref={(node) => {
                                blockContainerRefs.current[blockKey] = node;
                              }}
                              className={`stack-sm rounded-2xl border border-white/10 p-3 transition ${
                                highlightBlockKey === blockKey
                                  ? "ring-2 ring-white/40 bg-white/5"
                                  : ""
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                                  {blockLabel}
                                </span>
                                <div className="relative">
                                  <button
                                    type="button"
                                    className="chip"
                                    onClick={() =>
                                      setBlockMenuOpenKey((open) =>
                                        open === blockKey ? null : blockKey,
                                      )
                                    }
                                  >
                                    ...
                                  </button>
                                  {blockMenuOpenKey === blockKey ? (
                                  <div
                                    className={`absolute right-0 ${DROPDOWN_MENU_LAYER_CLASS} mt-2 w-44 ${DROPDOWN_MENU_PANEL_CLASS}`}
                                  >
                                      <button
                                        type="button"
                                        className="chip w-full justify-start"
                                        onClick={() => {
                                          handleFocusBlock(blockKey);
                                          setBlockMenuOpenKey(null);
                                        }}
                                      >
                                        {t("exerciseEditor.edit")}
                                      </button>
                                      <button
                                        type="button"
                                        className="chip w-full justify-start"
                                        disabled={blockIndex === 0}
                                        onClick={() => {
                                          handleMoveBlock(section.id, blockIndex, -1);
                                          setBlockMenuOpenKey(null);
                                        }}
                                      >
                                        {t("exerciseEditor.moveUp")}
                                      </button>
                                      <button
                                        type="button"
                                        className="chip w-full justify-start"
                                        disabled={blockIndex === section.blocks.length - 1}
                                        onClick={() => {
                                          handleMoveBlock(section.id, blockIndex, 1);
                                          setBlockMenuOpenKey(null);
                                        }}
                                      >
                                        {t("exerciseEditor.moveDown")}
                                      </button>
                                      <button
                                        type="button"
                                        className="chip w-full justify-start"
                                        onClick={() => {
                                          handleRemoveBlock(section.id, blockIndex);
                                          setBlockMenuOpenKey(null);
                                        }}
                                      >
                                        {t("exerciseEditor.delete")}
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                              {block.type === "bullets" ? (
                                <p className="text-xs text-[color:var(--muted)]">
                                  {t("exerciseEditor.bulletHint")}
                                </p>
                              ) : null}
                      
                              {block.type === "markdown" ? (
                                <textarea
                                  ref={(node) => {
                                    blockFieldRefs.current[blockKey] = node;
                                  }}
                                  className="field-textarea"
                                  value={block.content}
                                  onChange={(event) =>
                                    updateSection(section.id, (current) => ({
                                      ...current,
                                      blocks: current.blocks.map((item, idx) =>
                                        idx === blockIndex && item.type === "markdown"
                                          ? { ...item, content: event.target.value }
                                          : item,
                                      ),
                                    }))
                                  }
                                />
                              ) : null}
                      
                              {block.type === "bullets" ? (
                                <div className="stack-sm">
                                  {block.items.map((item, itemIndex) => (
                                    <div
                                      key={`${section.id}-${blockIndex}-${itemIndex}`}
                                      className="flex items-center gap-2"
                                    >
                                      <input
                                        ref={(node) => {
                                          if (itemIndex === 0) {
                                            blockFieldRefs.current[blockKey] = node;
                                          }
                                        }}
                                        className="field-input"
                                        value={item}
                                        onChange={(event) =>
                                          updateSection(section.id, (current) => ({
                                            ...current,
                                            blocks: current.blocks.map((entry, idx) =>
                                              idx === blockIndex && entry.type === "bullets"
                                                ? {
                                                    ...entry,
                                                    items: entry.items.map((value, pos) =>
                                                      pos === itemIndex ? event.target.value : value,
                                                    ),
                                                  }
                                                : entry,
                                            ),
                                          }))
                                        }
                                      />
                                      <button
                                        type="button"
                                        className="chip"
                                        onClick={() =>
                                          updateSection(section.id, (current) => ({
                                            ...current,
                                            blocks: current.blocks.map((entry, idx) =>
                                              idx === blockIndex && entry.type === "bullets"
                                                ? {
                                                    ...entry,
                                                    items: entry.items.filter((_, pos) => pos !== itemIndex),
                                                  }
                                                : entry,
                                            ),
                                          }))
                                        }
                                      >
                                        {t("exerciseEditor.delete")}
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    className="chip"
                                    onClick={() =>
                                      updateSection(section.id, (current) => ({
                                        ...current,
                                        blocks: current.blocks.map((entry, idx) =>
                                          idx === blockIndex && entry.type === "bullets"
                                            ? { ...entry, items: [...entry.items, ""] }
                                            : entry,
                                        ),
                                      }))
                                    }
                                  >
                                    {t("exerciseEditor.addBullet")}
                                  </button>
                                </div>
                              ) : null}
                      
                              {block.type === "media" ? (
                                <div className="stack-sm">
                                  {block.mediaType === "image" ? (
                                    <>
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="text-xs text-[color:var(--muted)]">
                                          {t("exerciseEditor.photoBlock")}
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                          {hasPhoto ? (
                                            <>
                                              <button
                                                type="button"
                                                className="chip"
                                                onClick={() =>
                                                  handlePhotoUploadRequest(section.id, blockIndex)
                                                }
                                              >
                                                {t("exerciseEditor.replace")}
                                              </button>
                                              <button
                                                type="button"
                                                className="chip"
                                                onClick={() => handleClearPhoto(section.id, blockIndex)}
                                              >
                                                {t("exerciseEditor.delete")}
                                              </button>
                                            </>
                                          ) : (
                                            <button
                                              type="button"
                                              className="chip"
                                              onClick={() =>
                                                handlePhotoUploadRequest(section.id, blockIndex)
                                              }
                                            >
                                              {t("exerciseEditor.addPhoto")}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      {block.mediaId ? (
                                        <p className="text-xs text-[color:var(--muted)]">
                                          mediaId: {block.mediaId}
                                        </p>
                                      ) : block.url ? (
                                        <p className="text-xs text-[color:var(--muted)]">
                                          {t("exerciseEditor.inheritedUrl")} {block.url}
                                        </p>
                                      ) : (
                                        <p className="text-xs text-[color:var(--muted)]">
                                          {t("exerciseEditor.noPhoto")}
                                        </p>
                                      )}
                                      {hasPhoto
                                        ? (() => {
                                            const directUrl = block.url?.trim();
                                            const resolvedUrl = block.mediaId
                                              ? mediaUrlMap[block.mediaId] ??
                                                mediaUrlCache.get(block.mediaId)
                                              : undefined;
                                            const previewUrl =
                                              directUrl && directUrl.length > 0
                                                ? directUrl
                                                : resolvedUrl ?? null;
                                            const infoLine = block.mediaId
                                              ? formatMediaInfo(mediaInfoMap[block.mediaId])
                                              : null;
                                            const resolveState = block.mediaId
                                              ? mediaResolveState[block.mediaId]
                                              : undefined;
                                            const resolveError = block.mediaId
                                              ? mediaResolveError[block.mediaId]
                                              : null;
                                            return (
                                              <PhotoPreview
                                                previewUrl={previewUrl}
                                                alt={block.caption || `${displayTitle} — ${(merged.frontmatter.muscles ?? []).slice(0, 3).join(", ")}`}
                                                infoLine={infoLine}
                                                isResolving={resolveState === "loading"}
                                                hasError={resolveState === "error"}
                                                errorDetail={resolveError}
                                                onRetry={() => {
                                                  if (!block.url?.trim() && block.mediaId) {
                                                    void resolveMediaAsset(block.mediaId, {
                                                      force: true,
                                                    });
                                                  }
                                                }}
                                              />
                                            );
                                          })()
                                        : null}
                                      <label className="field-label">
                                        {t("exerciseEditor.caption")}
                                      </label>
                                      <input
                                        ref={(node) => {
                                          blockFieldRefs.current[blockKey] = node;
                                        }}
                                        className="field-input"
                                        value={block.caption ?? ""}
                                        onChange={(event) =>
                                          updateSection(section.id, (current) => ({
                                            ...current,
                                            blocks: current.blocks.map((entry, idx) =>
                                              idx === blockIndex && entry.type === "media"
                                                ? { ...entry, caption: event.target.value }
                                                : entry,
                                            ),
                                          }))
                                        }
                                      />
                                    </>
                                  ) : (
                                    <>
                                      <label className="field-label">{t("exerciseEditor.typeLabel")}</label>
                                      <select
                                        className="field-input"
                                        value={block.mediaType}
                                        onChange={(event) =>
                                          updateSection(section.id, (current) => ({
                                            ...current,
                                            blocks: current.blocks.map((entry, idx) =>
                                              idx === blockIndex &&
                                              entry.type === "media" &&
                                              entry.mediaType !== "image"
                                                ? {
                                                    ...entry,
                                                    mediaType: event.target.value as "video" | "link",
                                                  }
                                                : entry,
                                            ),
                                          }))
                                        }
                                      >
                                        <option value="video">{t("exerciseEditor.video")}</option>
                                        <option value="link">{t("exerciseEditor.linkType")}</option>
                                      </select>
                                      <label className="field-label">URL</label>
                                      <input
                                        ref={(node) => {
                                          blockFieldRefs.current[blockKey] = node;
                                        }}
                                        className="field-input"
                                        value={block.url}
                                        onChange={(event) =>
                                          updateSection(section.id, (current) => ({
                                            ...current,
                                            blocks: current.blocks.map((entry, idx) =>
                                              idx === blockIndex &&
                                              entry.type === "media" &&
                                              entry.mediaType !== "image"
                                                ? { ...entry, url: event.target.value }
                                                : entry,
                                            ),
                                          }))
                                        }
                                      />
                                      <label className="field-label">
                                        {t("exerciseEditor.captionOptional")}
                                      </label>
                                      <input
                                        className="field-input"
                                        value={block.caption ?? ""}
                                        onChange={(event) =>
                                          updateSection(section.id, (current) => ({
                                            ...current,
                                            blocks: current.blocks.map((entry, idx) =>
                                              idx === blockIndex &&
                                              entry.type === "media" &&
                                              entry.mediaType !== "image"
                                                ? { ...entry, caption: event.target.value }
                                                : entry,
                                            ),
                                          }))
                                        }
                                      />
                                    </>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                      </div>
                    </div>
                  </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoFileChange}
                />
              </div>
            ) : (
              <p className="text-xs text-[color:var(--muted)]">{t("exerciseEditor.loading")}</p>
            )}
          </div>
          <div className="sticky bottom-0 mt-4 border-t border-white/10 bg-[color:var(--surface)] pt-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    <span>{t("exerciseEditor.activeSectionLabel")}</span>
                    <span className="rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                      {t("exerciseEditor.activeLabel")}
                    </span>
                  </span>
                  <span className="inline-flex w-fit items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-xs text-emerald-100">
                    {t("exerciseEditor.addingIn")}{" "}
                    {activeSection
                      ? activeSection.title || t("exerciseEditor.untitledSection")
                      : t("exerciseEditor.noSection")}
                  </span>
                  <select
                    className="field-input"
                    value={activeSection?.id ?? ""}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      if (nextValue === "__add_section__") {
                        handleAddSection();
                        return;
                      }
                      setActiveSectionId(nextValue);
                    }}
                    disabled={!overrideDoc}
                  >
                    <option value="">{t("exerciseEditor.selectSection")}</option>
                    {overrideDoc?.doc.sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.title || t("exerciseEditor.untitledSection")}
                      </option>
                    ))}
                    <option value="__add_section__">{t("exerciseEditor.addSection")}</option>
                  </select>
                </div>
                <div className="relative">
                  <button
                    ref={addBlockButtonRef}
                    type="button"
                    className="chip"
                    onClick={() => setAddBlockMenuOpen((open) => !open)}
                    disabled={!overrideDoc || overrideDoc.doc.sections.length === 0}
                  >
                    {t("exerciseEditor.addBlock")}…
                  </button>
                  {addBlockMenuOpen ? (
                    <div
                      ref={addBlockMenuRef}
                      className="absolute bottom-full left-0 z-10 mb-2 w-44 rounded-2xl border border-white/10 bg-[color:var(--bg-2)] p-2 shadow-lg"
                    >
                      <button
                        type="button"
                        className="chip w-full justify-start"
                        onClick={() => {
                          handleAddFromMenu("markdown");
                          setAddBlockMenuOpen(false);
                        }}
                      >
                        {t("exerciseEditor.textBlock")}
                      </button>
                      <button
                        type="button"
                        className="chip w-full justify-start"
                        onClick={() => {
                          handleAddFromMenu("bullets");
                          setAddBlockMenuOpen(false);
                        }}
                      >
                        {t("exerciseEditor.bulletsList")}
                      </button>
                      <button
                        type="button"
                        className="chip w-full justify-start"
                        onClick={() => {
                          handleAddFromMenu("photo");
                          setAddBlockMenuOpen(false);
                        }}
                      >
                        {t("exerciseEditor.photoBlock")}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="primary-button primary-button--wide"
                  onClick={handleSaveOverride}
                  disabled={!isDirty || isSavingOverride}
                >
                  <span className="inline-flex items-center gap-2">
                    {isDirty ? (
                      <span
                        className="inline-flex h-2 w-2 rounded-full bg-amber-300"
                        aria-hidden="true"
                      />
                    ) : null}
                    {t("exerciseEditor.save")}
                  </span>
                </button>
                <button
                  type="button"
                  className="chip border border-white/20 bg-white/5 hover:bg-white/10"
                  onClick={handleCloseOverride}
                >
                  {t("exerciseEditor.close")}
                </button>
                <button
                  type="button"
                  className={`chip ${
                    isDirty
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "chip-ghost"
                  }`}
                  onClick={handleDiscardOverride}
                  disabled={!isDirty}
                >
                  {isDirty ? `⟲ ${t("exerciseEditor.discardChanges")}` : t("exerciseEditor.discardChanges")}
                </button>
              </div>
              {!isDirty && !isSavingOverride ? (
                <p className="text-xs text-[color:var(--muted)]">
                  {t("exerciseEditor.noChangesYet")}
                </p>
              ) : null}
              {isDirty && saveMeta.status === "draft" ? (
                <p className="text-xs text-[color:var(--muted)]">
                  {saveMeta.missing.length > 0
                    ? `${t("exerciseEditor.missingFields")} ${saveMeta.missing.map((f) => ({"titre": t("exerciseEditor.titleLabel"), "tags": "Tags", "muscles": t("exerciseEditor.musclesLabel"), "thèmes": t("exerciseEditor.themesLabel")} as Record<string, string>)[f] ?? f).join(", ")}. `
                    : ""}
                  {t("exerciseEditor.draftNote")}
                </p>
              ) : null}
            </div>
            {mediaStatus ? (
              <p className="text-xs text-[color:var(--muted)]">{mediaStatus}</p>
            ) : null}
            {submitStatus ? (
              <p className="text-xs text-[color:var(--muted)]">{submitStatus}</p>
            ) : null}
          </div>
          {blockToast ? (
            <div
              className="fixed left-1/2 z-[90] w-[min(520px,calc(100vw-32px))] -translate-x-1/2"
              style={{
                bottom:
                  "calc(16px + env(safe-area-inset-bottom) + 72px)",
              }}
              role="status"
              aria-live="polite"
            >
              <div
                className={`flex items-center justify-between gap-3 rounded-2xl border border-emerald-400/40 bg-emerald-400/15 px-4 py-3 text-sm text-emerald-100 shadow-lg backdrop-blur transition-all duration-200 ${
                  blockToastVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                }`}
              >
                <span>{blockToast.message}</span>
                <button
                  type="button"
                  className="text-emerald-100/70 hover:text-emerald-50"
                  aria-label={t("exerciseEditor.close")}
                  onClick={dismissBlockToast}
                >
                  ×
                </button>
              </div>
            </div>
          ) : null}
            </div>
          </div>
          {confirmCloseOpen ? (
            <div className="modal-overlay" role="dialog" aria-modal="true">
              <div className="modal-card">
                <h2>{t("exerciseEditor.changesPending")}</h2>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="primary-button primary-button--wide"
                    onClick={() => setConfirmCloseOpen(false)}
                  >
                    {t("header.back")}
                  </button>
                  <button
                    type="button"
                    className="chip"
                    onClick={handleCloseWithoutSave}
                  >
                    {t("exerciseEditor.closeWithout")}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          {deleteLiveOpen ? (
            <div className="modal-overlay" role="dialog" aria-modal="true">
              <div className="modal-card">
                <h2>{t("exerciseEditor.deleteSaved")}</h2>
                <p className="text-sm text-[color:var(--muted)]">
                  {t("exerciseEditor.deleteWarning")}
                </p>
                <div className="stack-sm">
                  <p className="text-xs text-[color:var(--muted)]">
                    Slug: <span className="font-semibold text-[color:var(--ink)]">{slug}</span>
                    {" • "}
                    Locale:{" "}
                    <span className="font-semibold text-[color:var(--ink)]">{locale}</span>
                  </p>
                  <label className="field-label">{t("teacherMode.pinHeading")}</label>
                  <input
                    className="field-input"
                    type="password"
                    value={teacherPin}
                    onChange={(event) => setTeacherPin(event.target.value)}
                    placeholder={t("teacherMode.pinRequired")}
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="chip"
                    onClick={() => setDeleteLiveOpen(false)}
                    disabled={isDeletingLive}
                  >
                    {t("teacherMode.cancel")}
                  </button>
                  <button
                    type="button"
                    className="primary-button primary-button--wide bg-red-500 text-white hover:bg-red-600"
                    onClick={handleDeleteLive}
                    disabled={isDeletingLive || !teacherPin}
                  >
                    {isDeletingLive ? t("exerciseEditor.deleting") : t("exerciseEditor.deleteSaved")}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
            </OverridePillsProvider>
          </OverrideMediaProvider>
        </OverrideDocProvider>
      </OverrideUIProvider>

      {liveOpen && liveDraft ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2>{t("exerciseEditor.createExercise")}</h2>
            <div className="stack-md">
              <label className="field-label">{t("exerciseEditor.slugLabel")}</label>
              <input
                className="field-input"
                value={liveDraft.slug}
                placeholder={t("exerciseEditor.slugPlaceholder")}
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, slug: event.target.value })
                }
              />
              <label className="field-label">{t("exerciseEditor.titleLabel")}</label>
              <input
                className="field-input"
                value={liveDraft.title}
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, title: event.target.value })
                }
              />
              <label className="field-label">{t("exerciseEditor.tagsLabel")}</label>
              <input
                className="field-input"
                value={liveDraft.tags}
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, tags: event.target.value })
                }
              />
              <label className="field-label">{t("exerciseEditor.musclesLabel")}</label>
              <input
                className="field-input"
                value={liveDraft.muscles}
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, muscles: event.target.value })
                }
              />
              <label className="field-label">{t("exerciseEditor.themeCompatLabel")}</label>
              <input
                className="field-input"
                value={liveDraft.themeCompatibility}
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, themeCompatibility: event.target.value })
                }
              />
              <label className="field-label">{t("exerciseEditor.levelLabel")}</label>
              <input
                className="field-input"
                value={liveDraft.level}
                placeholder={t("exerciseEditor.levelPlaceholder")}
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, level: event.target.value })
                }
              />
              <label className="field-label">{t("exerciseEditor.equipmentLabel")}</label>
              <input
                className="field-input"
                value={liveDraft.equipment}
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, equipment: event.target.value })
                }
              />
              <label className="field-label">{t("exerciseEditor.mediaLabel")}</label>
              <input
                className="field-input"
                value={liveDraft.media}
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, media: event.target.value })
                }
              />
              <label className="field-label">{t("exerciseEditor.contentLabel")}</label>
              <textarea
                className="field-textarea"
                autoFocus
                value={liveDraft.content}
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, content: event.target.value })
                }
              />
            </div>
            {submitStatus ? (
              <p className="text-xs text-[color:var(--muted)]">{submitStatus}</p>
            ) : null}
            <div className="modal-actions">
              <button
                type="button"
                className="primary-button primary-button--wide"
                onClick={handleSaveLive}
              >
                {t("exerciseEditor.create")}
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => setLiveOpen(false)}
              >
                {t("exerciseEditor.close")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
