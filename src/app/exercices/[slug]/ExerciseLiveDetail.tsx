"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import NextImage, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DifficultyPill from "@/components/DifficultyPill";
import { FavoriteToggle } from "@/components/FavoriteToggle";
import { HeroMedia } from "@/components/media/HeroMedia";
import s1001 from "../../../../public/images/exos/s1-001.webp";
import logo from "../../../../public/media/branding/logo-eps.webp";
import type { ExerciseFrontmatter } from "@/lib/content/schema";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Lang } from "@/lib/i18n/messages";
import { mdxComponents } from "@/lib/mdx/components";
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

type ExerciseLiveDetailProps = {
  slug: string;
  locale: Lang;
  source: "mdx" | "live" | "imported";
  baseFrontmatter: ExerciseFrontmatter;
  baseContent: string;
  initialPatch: ExerciseOverridePatch | null;
  onRevalidate?: (slug: string) => Promise<void>;
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
const LEVEL_DEFAULTS = ["Débutant", "Intermédiaire", "Avancé"];
const TYPE_DEFAULTS = [
  "Fondamentaux",
  "Technique",
  "Renforcement",
  "Gainage",
  "Mobilité",
  "Souplesse",
  "Pliométrie",
  "Endurance de force",
  "Puissance",
  "Hypertrophie",
  "Échauffement",
  "Retour au calme",
];
const MUSCLE_DEFAULTS = [
  "Abdominaux",
  "Transverse",
  "Obliques",
  "Dos",
  "Pectoraux",
  "Épaules",
  "Biceps",
  "Triceps",
  "Fessiers",
  "Quadriceps",
  "Ischio-jambiers",
  "Mollets",
  "Lombaires",
];
const THEME_DEFAULTS = ["AFL1", "AFL2", "AFL3", "Sécurité", "Méthode", "Technique"];
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

function formatResolveError(status?: number | null) {
  if (typeof status === "number" && Number.isFinite(status)) {
    return `Erreur: ${status}`;
  }
  return "Erreur: URL non résolue";
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
  const resolvedErrorDetail = showError
    ? loadError
      ? "Erreur: URL non résolue"
      : errorDetail || "Erreur: URL non résolue"
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
          <p className="text-sm text-[color:var(--muted)]">Aperçu indisponible</p>
          {resolvedErrorDetail ? (
            <p className="text-xs text-[color:var(--muted)]">
              {resolvedErrorDetail}
            </p>
          ) : null}
          <button type="button" className="chip" onClick={handleRetryClick}>
            Réessayer
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
      imageFallback?: string | StaticImageData;
    }
  | { type?: "image"; src: string; alt: string; width: number; height: number }
  | { type?: "image"; src: StaticImageData; alt: string };

function isHeroUrl(
  hero: HeroRender,
): hero is Extract<HeroRender, { src: string }> {
  return typeof hero.src === "string";
}

export function ExerciseLiveDetail({
  slug,
  locale,
  source,
  baseFrontmatter,
  baseContent,
  initialPatch,
  onRevalidate,
}: ExerciseLiveDetailProps) {
  const { t } = useI18n();
  const settingsLabel = t("settings.open");
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowserClient();
  const [base, setBase] = useState(() => ({
    frontmatter: baseFrontmatter,
    content: baseContent,
  }));
  const [patch, setPatch] = useState<ExerciseOverridePatch | null>(() => initialPatch);
  const [overrideReady, setOverrideReady] = useState(false);
  const [liveReady, setLiveReady] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [teacherUnlocked, setTeacherUnlocked] = useState(
    () => getTeacherModeSnapshot().unlocked,
  );
  const [teacherPin, setTeacherPin] = useState(() => getTeacherModeSnapshot().pin);
  const [teacherError, setTeacherError] = useState<string | null>(null);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideDoc, setOverrideDoc] = useState<ExerciseLiveDocV2 | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [sectionMenuOpenId, setSectionMenuOpenId] = useState<string | null>(null);
  const [blockMenuOpenKey, setBlockMenuOpenKey] = useState<string | null>(null);
  const [dirtySnapshot, setDirtySnapshot] = useState("");
  const [overrideToast, setOverrideToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);
  const [isSavingOverride, setIsSavingOverride] = useState(false);
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
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [blockToast, setBlockToast] = useState<{ id: number; message: string } | null>(
    null,
  );
  const [blockToastVisible, setBlockToastVisible] = useState(false);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchPointerActiveRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const merged = useMemo(
    () => applyExercisePatch(base, patch),
    [base, patch],
  );
  const overrideDocView = merged.override?.doc;

  const difficulty = merged.frontmatter.level ?? "intermediaire";
  const displayTitle =
    merged.frontmatter.title?.trim() || "Brouillon sans titre";

  // Dynamic video hero resolution (try .webm for any slug)
  const exerciseSlug = merged.frontmatter.slug;
  const videoSrc = exerciseSlug
    ? `/images/exos/${exerciseSlug.toLowerCase()}.webm`
    : undefined;

  console.log("[ExerciseLiveDetail] Debug hero:", {
    slug: exerciseSlug,
    videoSrc,
    media: merged.frontmatter.media,
    source,
  });

  const baseHeroImage = merged.frontmatter.media
    ? {
        "/images/exos/s1-001.webp": s1001,
      }[merged.frontmatter.media]
    : undefined;

  const imageFallback = baseHeroImage ?? merged.frontmatter.media;

  const overrideHero = overrideDocView?.heroImage;
  const overrideHeroUrl = overrideHero?.url?.trim() ?? "";
  const hero: HeroRender | null =
    overrideDocView && overrideHero
      ? overrideHeroUrl
        ? {
            type: "image",
            src: overrideHeroUrl,
            alt: overrideHero.alt ?? displayTitle,
            width: HERO_OVERRIDE_DIMENSIONS.width,
            height: HERO_OVERRIDE_DIMENSIONS.height,
          }
        : null
      : videoSrc
        ? {
            type: "video",
            src: videoSrc,
            alt: displayTitle,
            imageFallback,
          }
        : baseHeroImage
          ? { type: "image", src: baseHeroImage, alt: displayTitle }
          : null;

  console.log("[ExerciseLiveDetail] Hero resolved:", hero);
  const tagPills: Array<{ label: string; kind?: string }> =
    overrideDocView?.pills ??
    (merged.frontmatter.tags ?? []).map((label) => ({ label }));
  const overrideSnapshot = useMemo(
    () => (overrideDoc ? JSON.stringify(overrideDoc) : ""),
    [overrideDoc],
  );
  const isDirty = overrideDoc ? overrideSnapshot !== dirtySnapshot : false;
  const activeSection =
    overrideDoc?.doc.sections.find((section) => section.id === activeSectionId) ??
    (overrideDoc
      ? overrideDoc.doc.sections[overrideDoc.doc.sections.length - 1] ?? null
      : null);
  const pillState = useMemo(() => {
    const pills = overrideDoc?.doc.pills ?? [];
    const levelKeys = new Set(
      [
        ...LEVEL_DEFAULTS,
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
          ...LEVEL_DEFAULTS,
          nextSelections.level,
          ...pillCustomOptions.level,
        ]),
      ),
      type: sortLabels(
        uniqueLabels([
          ...TYPE_DEFAULTS,
          ...(merged.frontmatter.tags ?? []),
          ...nextSelections.type,
          ...pillCustomOptions.type,
        ]),
      ),
      muscles: sortLabels(
        uniqueLabels([
          ...MUSCLE_DEFAULTS,
          ...(merged.frontmatter.muscles ?? []),
          ...nextSelections.muscles,
          ...pillCustomOptions.muscles,
        ]),
      ),
      themes: sortLabels(
        uniqueLabels([
          ...THEME_DEFAULTS,
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
  ]);

  const saveMeta = useMemo(() => {
    const tags = uniqueLabels(
      pillState.selections.type.map((value) => normalizeLabel(value)),
    ).filter(Boolean);
    const muscles = uniqueLabels(
      pillState.selections.muscles.map((value) => normalizeLabel(value)),
    ).filter(Boolean);
    const title = merged.frontmatter.title?.trim() ?? "";
    const themes = merged.frontmatter.themeCompatibility ?? [];
    const missing: string[] = [];

    if (!title) {
      missing.push("titre");
    }
    if (tags.length === 0) {
      missing.push("tags");
    }
    if (muscles.length === 0) {
      missing.push("muscles");
    }
    if (themes.length === 0) {
      missing.push("thèmes");
    }

    return {
      status: missing.length === 0 ? ("ready" as ExerciseStatus) : ("draft" as ExerciseStatus),
      missing,
      tags,
      muscles,
    };
  }, [
    merged.frontmatter.title,
    merged.frontmatter.themeCompatibility,
    pillState.selections.muscles,
    pillState.selections.type,
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
        const reason = formatResolveError(
          Number.isFinite(status) ? status : undefined,
        );
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

      const reason = formatResolveError(null);
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
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
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
      return label && label.length > 0 ? label : "Section sans titre";
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
      const message = `✅ Bloc ajouté dans « ${resolveSectionTitle(sectionId)} »`;
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

  const showOverrideToast = (message: string, tone: "success" | "error") => {
    setOverrideToast({ message, tone });
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setOverrideToast(null);
    }, 2400);
  };

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
      setTeacherError("PIN requis.");
      return;
    }
    setTeacherUnlocked(true);
    setTeacherError(null);
    setPinModalOpen(false);
  };

  const handleAuthError = (message: string) => {
    setTeacherUnlocked(false);
    setTeacherPin("");
    setTeacherError(message);
    setPinModalOpen(true);
  };

  const handleSaveOverride = async () => {
    if (!teacherPin) {
      showOverrideToast("PIN requis.", "error");
      return;
    }
    if (!overrideDoc) {
      setSubmitStatus("Aucune modification.");
      return;
    }
    const saveStatus = saveMeta.status;
    const statusLabel =
      saveStatus === "draft" ? "Brouillon enregistré." : "Exercice enregistré.";
    const heroImage = overrideDoc.doc.heroImage
      ? {
          url: overrideDoc.doc.heroImage.url.trim(),
          alt: overrideDoc.doc.heroImage.alt?.trim() || undefined,
        }
      : undefined;
    const pills = (overrideDoc.doc.pills ?? [])
      .map((pill) => ({
        label: pill.label.trim(),
        kind: pill.kind?.trim() || undefined,
      }))
      .filter((pill) => pill.label.length > 0);
    const sections = overrideDoc.doc.sections.map((section) => ({
      ...section,
      title: section.title.trim(),
      blocks: section.blocks.map((block) => {
        if (block.type === "bullets") {
          return {
            ...block,
            items: block.items.map((item) => item.trim()).filter(Boolean),
          };
        }
        if (block.type === "media") {
          if (block.mediaType === "image") {
            const trimmedUrl = block.url?.trim();
            const nextBlock: ExerciseLiveMediaBlock = {
              type: "media",
              mediaType: "image",
              mediaId: block.mediaId,
              caption: block.caption?.trim() || undefined,
            };
            if (trimmedUrl) {
              nextBlock.url = trimmedUrl;
            }
            return nextBlock;
          }
          return {
            ...block,
            url: block.url.trim(),
            caption: block.caption?.trim() || undefined,
          };
        }
        return {
          ...block,
          content: block.content ?? "",
        };
      }),
    }));
    const patchJson: ExerciseLiveDocV2 = {
      version: 2,
      doc: {
        heroImage,
        pills,
        sections,
      },
    };
    setSubmitStatus("Envoi en cours...");
    setIsSavingOverride(true);
    let response: Response;
    try {
      response = await fetch("/api/teacher/exercise-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: teacherPin,
          slug,
          locale,
          patchJson,
        }),
      });
    } catch {
      setSubmitStatus(null);
      setIsSavingOverride(false);
      showOverrideToast("Échec de l'enregistrement.", "error");
      return;
    }
    if (!response.ok) {
      if (response.status === 401) {
        handleAuthError("PIN invalide.");
        setSubmitStatus(null);
        setIsSavingOverride(false);
        return;
      }
      setSubmitStatus(null);
      setIsSavingOverride(false);
      showOverrideToast("Échec de l'enregistrement.", "error");
      return;
    }

    if (source === "live") {
      const liveResponse = await fetch("/api/teacher/live-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: teacherPin,
          slug,
          locale,
          dataJson: {
            frontmatter: {
              ...merged.frontmatter,
              slug,
              title: merged.frontmatter.title?.trim() ?? "",
              tags: saveMeta.tags,
              muscles: saveMeta.muscles,
              themeCompatibility: merged.frontmatter.themeCompatibility ?? [],
            },
            content: base.content,
            status: saveStatus,
          },
        }),
      });
      if (!liveResponse.ok) {
        if (liveResponse.status === 401) {
          handleAuthError("PIN invalide.");
        }
        setSubmitStatus(null);
        setIsSavingOverride(false);
        showOverrideToast("Échec de la mise à jour.", "error");
        return;
      }
    }
    setPatch(patchJson);
    setOverrideDoc(patchJson);
    setDirtySnapshot(JSON.stringify(patchJson));
    setSubmitStatus(null);
    setIsSavingOverride(false);
    showOverrideToast(statusLabel, "success");
    setConfirmCloseOpen(false);
    setOverrideOpen(false);
    triggerRevalidate(slug);
  };

  const handleSaveLive = async () => {
    if (!teacherPin) {
      handleAuthError("PIN requis.");
      return;
    }
    if (!liveDraft) {
      return;
    }
    const slugValue = liveDraft.slug.trim();
    if (!slugValue) {
      setSubmitStatus("Slug requis.");
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
        handleAuthError("PIN invalide.");
        setSubmitStatus(null);
        return;
      }
      setSubmitStatus("Échec de la création.");
      return;
    }
    setSubmitStatus(
      status === "draft" ? "Brouillon enregistré." : "Exercice enregistré.",
    );
    setLiveExists(true);
    setLiveOpen(false);
    triggerRevalidate(slugValue);
  };

  const handleDeleteLive = async () => {
    if (!teacherPin) {
      handleAuthError("PIN requis.");
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
      showOverrideToast("Échec de la suppression.", "error");
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
        handleAuthError("PIN invalide.");
      }
      showOverrideToast(payload?.message ?? "Échec de la suppression.", "error");
      setIsDeletingLive(false);
      return;
    }

    setLiveExists(false);
    setDeleteLiveOpen(false);
    showOverrideToast("Version supprimée", "success");
    setIsDeletingLive(false);
    triggerRevalidate(slug);
  };

  const updateOverrideDoc = (
    updater: (doc: ExerciseLiveDocV2) => ExerciseLiveDocV2,
  ) => {
    setOverrideDoc((prev) => (prev ? updater(prev) : prev));
  };

  const updateSection = (
    sectionId: string,
    updater: (section: ExerciseLiveSection) => ExerciseLiveSection,
  ) => {
    updateOverrideDoc((doc) => ({
      ...doc,
      doc: {
        ...doc.doc,
        sections: doc.doc.sections.map((section) =>
          section.id === sectionId ? updater(section) : section,
        ),
      },
    }));
  };

  const handlePhotoUploadRequest = (sectionId: string, blockIndex?: number) => {
    if (!teacherPin) {
      handleAuthError("PIN requis.");
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
      handleAuthError("PIN requis.");
      return;
    }
    setMediaStatus("Upload en cours...");
    try {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        setMediaStatus("Format invalide. Utilisez JPEG, PNG ou WEBP.");
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
        setMediaStatus("Image trop lourde après compression (max 2 Mo).");
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
          : "Échec de l'upload.";
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
        setMediaStatus("Réponse invalide.");
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
      setMediaStatus("Photo ajoutée.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de l'upload.";
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
            title: "Nouvelle section",
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
      setMediaStatus("Ajoutez d'abord une section.");
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

  const handleCloseOverride = () => {
    if (isDirty) {
      setConfirmCloseOpen(true);
      return;
    }
    setOverrideOpen(false);
  };

  const handleDiscardOverride = () => {
    const doc = buildOverrideDoc(base, patch);
    const snapshot = JSON.stringify(doc);
    setOverrideDoc(doc);
    setDirtySnapshot(snapshot);
    setActiveSectionId(doc.doc.sections[0]?.id ?? null);
    setSectionMenuOpenId(null);
    setBlockMenuOpenKey(null);
    setMediaStatus(null);
    setOverrideToast(null);
    setLevelAddOpen(false);
    setLevelAddValue("");
    setPillDropdownOpen(null);
    setPillSearch({ type: "", muscles: "", themes: "" });
    setPillDropdownStyle(null);
    setAddBlockMenuOpen(false);
    setConfirmCloseOpen(false);
  };

  const handleCloseWithoutSave = () => {
    setConfirmCloseOpen(false);
    setOverrideOpen(false);
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

  return (
    <>
      <style>{`
        .app-shell > .app-header {
          display: none;
        }
      `}</style>
      <div className="page-header">
        <header className="app-header">
          <div className="brand">
            <Link
              href="/exercices"
              aria-label="Retour aux exercices"
              className="icon-button"
              style={{ marginRight: "0.5rem" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: "1.5rem", height: "1.5rem" }}
                aria-hidden="true"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <Link href="/" aria-label="Accueil">
              <NextImage src={logo} alt="EPS" className="h-20 w-auto" />
            </Link>
            <div
              role="button"
              tabIndex={0}
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
              onPointerMove={(event) => {
                cancelLongPressOnMove(event.clientX, event.clientY);
              }}
              onPointerUp={() => {
                cancelLongPress();
                touchPointerActiveRef.current = false;
              }}
              onPointerLeave={() => {
                cancelLongPress();
                touchPointerActiveRef.current = false;
              }}
              onPointerCancel={() => {
                cancelLongPress();
                touchPointerActiveRef.current = false;
              }}
              onMouseDown={(event) => {
                if (event.ctrlKey || event.shiftKey) {
                  event.preventDefault();
                  cancelLongPress();
                  openPinModal();
                  return;
                }
                event.preventDefault();
              }}
              onTouchStart={(event) => {
                if (touchPointerActiveRef.current) {
                  return;
                }
                const touch = event.touches[0];
                if (!touch) {
                  return;
                }
                startLongPress(touch.clientX, touch.clientY);
              }}
              onTouchMove={(event) => {
                if (touchPointerActiveRef.current) {
                  return;
                }
                const touch = event.touches[0];
                if (!touch) {
                  return;
                }
                cancelLongPressOnMove(touch.clientX, touch.clientY);
              }}
              onTouchEnd={() => {
                cancelLongPress();
                touchPointerActiveRef.current = false;
              }}
              onTouchCancel={() => {
                cancelLongPress();
                touchPointerActiveRef.current = false;
              }}
              onContextMenu={(event) => {
                event.preventDefault();
              }}
              onClick={(event) => {
                if (event.ctrlKey || event.shiftKey) {
                  event.preventDefault();
                  cancelLongPress();
                  openPinModal();
                }
              }}
              onKeyDown={(event) => {
                if (teacherUnlocked) {
                  return;
                }
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openPinModal();
                }
              }}
              className="brand-text"
              style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
            >
              <span className="brand-title brand-title--page">
                {displayTitle}
              </span>
            </div>
          </div>
          <div className="header-actions">
            <Link
              href="/reglages"
              className="icon-button"
              aria-label={settingsLabel}
              title={settingsLabel}
            >
              <span aria-hidden="true" style={{ fontSize: "1.25rem", letterSpacing: "0.1em" }}>...</span>
            </Link>
          </div>
        </header>
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyPill level={difficulty} />
          {merged.frontmatter.muscles.map((muscle) => (
            <span key={muscle} className="pill">
              {muscle}
            </span>
          ))}
        </div>
        {hero ? (
          hero.type === "video" ? (
            <HeroMedia
              type="video"
              src={hero.src}
              alt={hero.alt}
              imageFallback={hero.imageFallback}
            />
          ) : isHeroUrl(hero) ? (
            <HeroMedia
              type="image"
              src={hero.src}
              alt={hero.alt}
              width={hero.width}
              height={hero.height}
              priority
            />
          ) : (
            <HeroMedia type="image" src={hero.src} alt={hero.alt} priority />
          )
        ) : null}
        <div className="meta-row">
          <FavoriteToggle slug={merged.frontmatter.slug} />
          <span className="meta-text">
            Thèmes compatibles: {merged.frontmatter.themeCompatibility.join(", ")}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {tagPills.map((pill, index) => (
            <span
              key={`${pill.label}-${index}`}
              className={pill.kind ? `pill pill-${pill.kind}` : "pill"}
            >
              {pill.label}
            </span>
          ))}
        </div>
        {merged.frontmatter.equipment && merged.frontmatter.equipment.length > 0 ? (
          <div className="text-sm text-[color:var(--muted)]">
            Matériel: {merged.frontmatter.equipment.join(", ")}
          </div>
        ) : (
          <div className="text-sm text-[color:var(--muted)]">Sans matériel spécifique.</div>
        )}
      </div>

      {teacherUnlocked ? (
        <div className="teacher-panel">
          <p className="eyebrow">Mode prof</p>
          <div className="modal-actions">
            <button
              type="button"
              className="primary-button primary-button--wide"
              onClick={openOverrideEditor}
            >
              Modifier l’exercice
            </button>
          </div>
          {submitStatus ? (
            <p className="text-xs text-[color:var(--muted)]">{submitStatus}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        {overrideDocView ? (
          overrideDocView.sections.map((section) => (
            <section key={section.id} className="stack-md">
              {section.title ? (
                <h2 className="text-lg font-semibold">{section.title}</h2>
              ) : null}
              <div className="stack-md">
                {section.blocks.map((block, blockIndex) => {
                  if (block.type === "markdown") {
                    return (
                      <ReactMarkdown
                        key={`markdown-${section.id}-${blockIndex}`}
                        remarkPlugins={[remarkGfm]}
                        components={mdxComponents}
                      >
                        {block.content}
                      </ReactMarkdown>
                    );
                  }
                  if (block.type === "bullets") {
                    return (
                      <ul
                        key={`bullets-${section.id}-${blockIndex}`}
                        className="list-disc pl-6 space-y-1"
                      >
                        {block.items.map((item, itemIndex) => (
                          <li key={`item-${section.id}-${blockIndex}-${itemIndex}`}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <div
                      key={`media-${section.id}-${blockIndex}`}
                      className="stack-sm"
                    >
                      {block.mediaType === "image" ? (() => {
                        const directUrl = block.url?.trim();
                        const resolvedUrl =
                          directUrl ||
                          (block.mediaId
                            ? mediaUrlMap[block.mediaId] ??
                              mediaUrlCache.get(block.mediaId)
                            : undefined);
                        if (resolvedUrl) {
                          return (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={resolvedUrl}
                                alt={block.caption ?? section.title}
                                className="w-full h-auto rounded-2xl ring-1 ring-white/10"
                                loading="lazy"
                                decoding="async"
                              />
                            </>
                          );
                        }
                        return (
                          <p className="text-xs text-[color:var(--muted)]">
                            Image en attente.
                          </p>
                        );
                      })() : null}
                      {block.mediaType === "video" ? (
                        block.url ? (
                          <video
                            className="w-full rounded-2xl ring-1 ring-white/10"
                            controls
                            src={block.url}
                          />
                        ) : (
                          <p className="text-xs text-[color:var(--muted)]">
                            URL manquante.
                          </p>
                        )
                      ) : null}
                      {block.mediaType === "link" ? (
                        block.url ? (
                          <a
                            className="text-sm underline"
                            href={block.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {block.caption || block.url}
                          </a>
                        ) : (
                          <p className="text-xs text-[color:var(--muted)]">
                            URL manquante.
                          </p>
                        )
                      ) : null}
                      {block.caption && block.mediaType !== "link" ? (
                        <p className="text-xs text-[color:var(--muted)]">
                          {block.caption}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdxComponents}>
            {merged.content}
          </ReactMarkdown>
        )}
      </div>

      {pinModalOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2>PIN professeur</h2>
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
                  Déverrouiller
                </button>
                <button
                  type="button"
                  className="chip"
                  onClick={() => setPinModalOpen(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {overrideOpen ? (
        <>
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card flex max-h-[85vh] flex-col">
            <div className="flex flex-col gap-2 border-b border-white/10 pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h2>Corriger la fiche</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {overrideToast ? (
                    <span className="text-xs text-[color:var(--muted)]">
                      {overrideToast.tone === "success" ? "OK: " : "Erreur: "}
                      {overrideToast.message}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className="chip"
                    onClick={handleCloseOverride}
                  >
                    ✕ Fermer
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
                      Modifications non enregistrées
                    </div>
                    <span className="text-xs text-amber-100/80">
                      Pense à Enregistrer
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
                            <h3 className="text-base font-semibold">Version enregistrée</h3>
                            <span className="rounded-full border border-red-400/60 bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-100">
                              Version active
                            </span>
                          </div>
                          <p className="text-sm text-[color:var(--muted)]">
                            Une version enregistrée existe pour cette fiche. Tu peux la supprimer
                            (la fiche MDX reste intacte).
                          </p>
                        </div>
                        <button
                          type="button"
                          className="primary-button primary-button--wide bg-red-500 text-white hover:bg-red-600"
                          onClick={() => setDeleteLiveOpen(true)}
                        >
                          Supprimer la version enregistrée…
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div className="rounded-2xl border border-white/10 bg-[color:var(--bg-2)] p-4 shadow-lg">
                    <div className="stack-md">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-base font-semibold">Catégories</h3>
                        <p className="text-sm text-[color:var(--muted)]">
                          Niveau, type, groupes musculaires et thèmes Bac.
                        </p>
                      </div>
                      <div className="stack-md">
                    <div className="stack-sm">
                      <label className="field-label">Niveau</label>
                      <select
                        className="field-input"
                        value={pillState.selections.level}
                        onChange={(event) => setLevelSelection(event.target.value)}
                      >
                        <option value="">Choisir un niveau…</option>
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
                            placeholder="Nouveau niveau…"
                            value={levelAddValue}
                            onChange={(event) => setLevelAddValue(event.target.value)}
                          />
                          <button
                            type="button"
                            className="chip"
                            onClick={addCustomLevel}
                          >
                            Ajouter
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="chip chip-ghost w-fit"
                          onClick={() => setLevelAddOpen(true)}
                        >
                          Ajouter un niveau…
                        </button>
                      )}
                    </div>

                    <div className="stack-sm">
                      <label className="field-label">Type</label>
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
                              ? `${pillState.selections.type.length} sélectionné${
                                  pillState.selections.type.length > 1 ? "s" : ""
                                }`
                              : "Sélectionner…"}
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
                                    placeholder="Rechercher…"
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
                                      {`Ajouter '${normalizeLabel(pillSearch.type)}'`}
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
                            Aucun type sélectionné.
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="stack-sm">
                      <label className="field-label">Groupes musculaires</label>
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
                              ? `${pillState.selections.muscles.length} sélectionné${
                                  pillState.selections.muscles.length > 1 ? "s" : ""
                                }`
                              : "Sélectionner…"}
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
                                    placeholder="Rechercher…"
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
                                      {`Ajouter '${normalizeLabel(pillSearch.muscles)}'`}
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
                            Aucun groupe sélectionné.
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="stack-sm">
                      <label className="field-label">Thèmes Bac</label>
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
                              ? `${pillState.selections.themes.length} sélectionné${
                                  pillState.selections.themes.length > 1 ? "s" : ""
                                }`
                              : "Sélectionner…"}
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
                                    placeholder="Rechercher…"
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
                                      {`Ajouter '${normalizeLabel(pillSearch.themes)}'`}
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
                            Aucun thème sélectionné.
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
                        <h3 className="text-base font-semibold">Image principale</h3>
                        <p className="text-sm text-[color:var(--muted)]">
                          Image affichée en haut de la fiche.
                        </p>
                      </div>
                      <div className="stack-sm">
                  <input
                    className="field-input"
                    placeholder="URL de l'image"
                    value={overrideDoc.doc.heroImage?.url ?? ""}
                    onChange={(event) => handleHeroUrlChange(event.target.value)}
                  />
                  <input
                    className="field-input"
                    placeholder="Texte alternatif (optionnel)"
                    value={overrideDoc.doc.heroImage?.alt ?? ""}
                    onChange={(event) => handleHeroAltChange(event.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="chip"
                      onClick={handleHeroPreview}
                    >
                      Aperçu
                    </button>
                    <button
                      type="button"
                      className="chip"
                      onClick={handleHeroRemove}
                    >
                      Supprimer l&apos;image
                    </button>
                  </div>
                  {heroPreviewUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={heroPreviewUrl}
                        alt="Aperçu"
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
                        <h3 className="text-base font-semibold">Contenu de la fiche</h3>
                        <p className="text-sm text-[color:var(--muted)]">
                          Sections et blocs visibles sur la fiche (texte, liste à puces, photo).
                        </p>
                      </div>
                      <div className="stack-md">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                            Sections
                          </h3>
                          <button
                            type="button"
                            className="chip"
                            onClick={handleAddSection}
                          >
                            Ajouter une section
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
                          placeholder="Titre de section"
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
                                Renommer
                              </button>
                              <div className="mt-2 border-t border-white/10 pt-2">
                                <span className="block px-2 pb-1 text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                                  Ajouter un bloc
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
                                  Texte
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
                                  Liste à puces
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
                                  Photo
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
                                Monter
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
                                Descendre
                              </button>
                              <button
                                type="button"
                                className="chip w-full justify-start"
                                onClick={() => {
                                  handleRemoveSection(section.id);
                                  setSectionMenuOpenId(null);
                                }}
                              >
                                Supprimer section
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      {section.blocks.length === 0 ? (
                        <p className="text-xs text-[color:var(--muted)]">
                          Aucun bloc pour cette section.
                        </p>
                      ) : null}
                      <div className="stack-sm">
                        {section.blocks.map((block, blockIndex) => {
                          const blockKey = `${section.id}-${blockIndex}`;
                          const blockLabel =
                            block.type === "markdown"
                              ? "Texte"
                              : block.type === "bullets"
                                ? "Liste à puces"
                                : block.mediaType === "image"
                                  ? "Photo"
                                  : block.mediaType === "video"
                                    ? "Vidéo"
                                    : "Lien";
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
                                        Éditer
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
                                        Monter
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
                                        Descendre
                                      </button>
                                      <button
                                        type="button"
                                        className="chip w-full justify-start"
                                        onClick={() => {
                                          handleRemoveBlock(section.id, blockIndex);
                                          setBlockMenuOpenKey(null);
                                        }}
                                      >
                                        Supprimer
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                              {block.type === "bullets" ? (
                                <p className="text-xs text-[color:var(--muted)]">
                                  Une puce = une ligne courte.
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
                                        Supprimer
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
                                    Ajouter une puce
                                  </button>
                                </div>
                              ) : null}
                      
                              {block.type === "media" ? (
                                <div className="stack-sm">
                                  {block.mediaType === "image" ? (
                                    <>
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="text-xs text-[color:var(--muted)]">
                                          Photo
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
                                                Remplacer
                                              </button>
                                              <button
                                                type="button"
                                                className="chip"
                                                onClick={() => handleClearPhoto(section.id, blockIndex)}
                                              >
                                                Supprimer
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
                                              Ajouter une photo
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
                                          URL héritée: {block.url}
                                        </p>
                                      ) : (
                                        <p className="text-xs text-[color:var(--muted)]">
                                          Aucune photo associée.
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
                                                alt={block.caption ?? section.title}
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
                                        Légende
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
                                      <label className="field-label">Type</label>
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
                                        <option value="video">Vidéo</option>
                                        <option value="link">Lien</option>
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
                                        Légende (optionnel)
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
              <p className="text-xs text-[color:var(--muted)]">Chargement...</p>
            )}
          </div>
          <div className="sticky bottom-0 mt-4 border-t border-white/10 bg-[color:var(--surface)] pt-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    <span>Section active</span>
                    <span className="rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                      Active
                    </span>
                  </span>
                  <span className="inline-flex w-fit items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-xs text-emerald-100">
                    Ajout dans :{" "}
                    {activeSection
                      ? activeSection.title || "Section sans titre"
                      : "Aucune section"}
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
                    <option value="">Sélectionner une section…</option>
                    {overrideDoc?.doc.sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.title || "Section sans titre"}
                      </option>
                    ))}
                    <option value="__add_section__">Ajouter une section</option>
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
                    Ajouter un bloc…
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
                        Texte
                      </button>
                      <button
                        type="button"
                        className="chip w-full justify-start"
                        onClick={() => {
                          handleAddFromMenu("bullets");
                          setAddBlockMenuOpen(false);
                        }}
                      >
                        Liste à puces
                      </button>
                      <button
                        type="button"
                        className="chip w-full justify-start"
                        onClick={() => {
                          handleAddFromMenu("photo");
                          setAddBlockMenuOpen(false);
                        }}
                      >
                        Photo
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
                    Enregistrer
                  </span>
                </button>
                <button
                  type="button"
                  className="chip border border-white/20 bg-white/5 hover:bg-white/10"
                  onClick={handleCloseOverride}
                >
                  Fermer
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
                  {isDirty ? "⟲ Annuler modifications" : "Annuler modifications"}
                </button>
              </div>
              {!isDirty && !isSavingOverride ? (
                <p className="text-xs text-[color:var(--muted)]">
                  Modifie au moins un élément pour enregistrer.
                </p>
              ) : null}
              {isDirty && saveMeta.status === "draft" ? (
                <p className="text-xs text-[color:var(--muted)]">
                  {saveMeta.missing.length > 0
                    ? `Champs requis manquants : ${saveMeta.missing.join(", ")}. `
                    : ""}
                  Enregistrement en brouillon.
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
                  "calc(var(--tabbar-offset, 0px) + var(--tabbar-height, 0px) + 72px)",
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
                  aria-label="Fermer"
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
                <h2>Modifications non enregistrées</h2>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="primary-button primary-button--wide"
                    onClick={() => setConfirmCloseOpen(false)}
                  >
                    Revenir
                  </button>
                  <button
                    type="button"
                    className="chip"
                    onClick={handleCloseWithoutSave}
                  >
                    Fermer sans enregistrer
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          {deleteLiveOpen ? (
            <div className="modal-overlay" role="dialog" aria-modal="true">
              <div className="modal-card">
                <h2>Supprimer la version enregistrée</h2>
                <p className="text-sm text-[color:var(--muted)]">
                  Cette action est irréversible. La fiche catalogue (MDX) n’est pas affectée.
                </p>
                <div className="stack-sm">
                  <p className="text-xs text-[color:var(--muted)]">
                    Slug: <span className="font-semibold text-[color:var(--ink)]">{slug}</span>
                    {" • "}
                    Locale:{" "}
                    <span className="font-semibold text-[color:var(--ink)]">{locale}</span>
                  </p>
                  <label className="field-label">PIN professeur</label>
                  <input
                    className="field-input"
                    type="password"
                    value={teacherPin}
                    onChange={(event) => setTeacherPin(event.target.value)}
                    placeholder="PIN requis"
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="chip"
                    onClick={() => setDeleteLiveOpen(false)}
                    disabled={isDeletingLive}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="primary-button primary-button--wide bg-red-500 text-white hover:bg-red-600"
                    onClick={handleDeleteLive}
                    disabled={isDeletingLive || !teacherPin}
                  >
                    {isDeletingLive ? "Suppression..." : "Supprimer la version enregistrée"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {liveOpen && liveDraft ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2>Créer un exercice</h2>
            <div className="stack-md">
              <label className="field-label">Slug</label>
              <input
                className="field-input"
                value={liveDraft.slug}
                placeholder="ex: sprint-30m"
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, slug: event.target.value })
                }
              />
              <label className="field-label">Titre</label>
              <input
                className="field-input"
                value={liveDraft.title}
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, title: event.target.value })
                }
              />
              <label className="field-label">Tags (séparés par des virgules)</label>
              <input
                className="field-input"
                value={liveDraft.tags}
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, tags: event.target.value })
                }
              />
              <label className="field-label">Muscles</label>
              <input
                className="field-input"
                value={liveDraft.muscles}
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, muscles: event.target.value })
                }
              />
              <label className="field-label">Thèmes compatibles (1, 2, 3)</label>
              <input
                className="field-input"
                value={liveDraft.themeCompatibility}
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, themeCompatibility: event.target.value })
                }
              />
              <label className="field-label">Niveau</label>
              <input
                className="field-input"
                value={liveDraft.level}
                placeholder="debutant / intermediaire / avance"
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, level: event.target.value })
                }
              />
              <label className="field-label">Matériel</label>
              <input
                className="field-input"
                value={liveDraft.equipment}
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, equipment: event.target.value })
                }
              />
              <label className="field-label">Média (optionnel)</label>
              <input
                className="field-input"
                value={liveDraft.media}
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, media: event.target.value })
                }
              />
              <label className="field-label">Contenu</label>
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
                Créer
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => setLiveOpen(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
