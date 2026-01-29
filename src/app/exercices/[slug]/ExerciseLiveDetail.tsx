"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { StaticImageData } from "next/image";
import DifficultyPill from "@/components/DifficultyPill";
import { FavoriteToggle } from "@/components/FavoriteToggle";
import { HeroMedia } from "@/components/media/HeroMedia";
import s1001 from "../../../../public/images/exos/s1-001.webp";
import type { ExerciseFrontmatter } from "@/lib/content/schema";
import { ExerciseFrontmatterSchema } from "@/lib/content/schema";
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
  source: "mdx" | "live";
  baseFrontmatter: ExerciseFrontmatter;
  baseContent: string;
  initialPatch: ExerciseOverridePatch | null;
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

const POLL_INTERVAL_MS = 20000;
const LONG_PRESS_MS = 1800;
const MOVE_THRESHOLD_PX = 10;
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const IMAGE_MAX_EDGE = 1600;
const IMAGE_QUALITY = 0.82;
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
const mediaUrlCache = new Map<string, string>();

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
  | { src: string; alt: string; width: number; height: number }
  | { src: StaticImageData; alt: string };

function isHeroUrl(hero: HeroRender): hero is Extract<HeroRender, { src: string }> {
  return typeof hero.src === "string";
}

export function ExerciseLiveDetail({
  slug,
  locale,
  source,
  baseFrontmatter,
  baseContent,
  initialPatch,
}: ExerciseLiveDetailProps) {
  const supabase = getSupabaseBrowserClient();
  const [base, setBase] = useState(() => ({
    frontmatter: baseFrontmatter,
    content: baseContent,
  }));
  const [patch, setPatch] = useState<ExerciseOverridePatch | null>(() => initialPatch);
  const [overrideReady, setOverrideReady] = useState(false);
  const [liveReady, setLiveReady] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [teacherUnlocked, setTeacherUnlocked] = useState(false);
  const [teacherPin, setTeacherPin] = useState("");
  const [teacherError, setTeacherError] = useState<string | null>(null);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideDoc, setOverrideDoc] = useState<ExerciseLiveDocV2 | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [sectionMenuOpenId, setSectionMenuOpenId] = useState<string | null>(null);
  const [blockMenuOpenKey, setBlockMenuOpenKey] = useState<string | null>(null);
  const [dirtySnapshot, setDirtySnapshot] = useState("");
  const [overrideToast, setOverrideToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);
  const [isSavingOverride, setIsSavingOverride] = useState(false);
  const [newPillLabel, setNewPillLabel] = useState("");
  const [heroPreviewUrl, setHeroPreviewUrl] = useState<string | null>(null);
  const [mediaUrlMap, setMediaUrlMap] = useState<Record<string, string>>({});
  const [mediaStatus, setMediaStatus] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<{
    sectionId: string;
    blockIndex?: number;
  } | null>(null);
  const [liveOpen, setLiveOpen] = useState(false);
  const [liveDraft, setLiveDraft] = useState<LiveDraft | null>(null);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchPointerActiveRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionTitleRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const blockFieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});

  const merged = useMemo(
    () => applyExercisePatch(base, patch),
    [base, patch],
  );
  const overrideDocView = merged.override?.doc;

  const isLive = source === "live" || !!patch;
  const difficulty = merged.frontmatter.level ?? "intermediaire";
  const baseHeroImage = merged.frontmatter.media
    ? {
        "/images/exos/s1-001.webp": s1001,
      }[merged.frontmatter.media]
    : undefined;
  const overrideHero = overrideDocView?.heroImage;
  const overrideHeroUrl = overrideHero?.url?.trim() ?? "";
  const hero: HeroRender | null =
    overrideDocView && overrideHero
      ? overrideHeroUrl
        ? {
            src: overrideHeroUrl,
            alt: overrideHero.alt ?? merged.frontmatter.title,
            width: HERO_OVERRIDE_DIMENSIONS.width,
            height: HERO_OVERRIDE_DIMENSIONS.height,
          }
        : null
      : baseHeroImage
        ? { src: baseHeroImage, alt: merged.frontmatter.title }
        : null;
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
    if (!supabase || source !== "live") {
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
            return;
          }
          const row = payload.new as LiveExerciseRow;
          if (row?.data_json) {
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
          setLiveReady(true);
          return;
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setLiveReady(false);
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
      if (source !== "live") {
        return;
      }
      const { data } = await supabase
        .from("live_exercises")
        .select("slug, locale, data_json, updated_at")
        .eq("slug", slug)
        .eq("locale", locale)
        .maybeSingle();
      if (!active || !data?.data_json) {
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

  useEffect(() => {
    if (!overrideDocView || !supabase) {
      return;
    }

    let active = true;
    const mediaIds = new Set<string>();
    for (const section of overrideDocView.sections) {
      for (const block of section.blocks) {
        if (block.type === "media" && block.mediaType === "image" && block.mediaId) {
          mediaIds.add(block.mediaId);
        }
      }
    }

    const resolveMedia = async (mediaId: string) => {
      if (mediaUrlCache.has(mediaId)) {
        const cached = mediaUrlCache.get(mediaId);
        if (cached) {
          setMediaUrlMap((prev) => (prev[mediaId] ? prev : { ...prev, [mediaId]: cached }));
        }
        return;
      }

      const { data } = await supabase
        .from("media_assets")
        .select("id, bucket, path, canonical_url")
        .eq("id", mediaId)
        .maybeSingle();
      if (!active) {
        return;
      }
      let url = data?.canonical_url ?? "";
      if (!url && data?.bucket && data?.path) {
        const { data: publicData } = supabase
          .storage
          .from(data.bucket)
          .getPublicUrl(data.path);
        url = publicData.publicUrl ?? "";
      }
      if (url) {
        mediaUrlCache.set(mediaId, url);
        setMediaUrlMap((prev) => ({ ...prev, [mediaId]: url }));
      }
    };

    for (const mediaId of mediaIds) {
      void resolveMedia(mediaId);
    }

    return () => {
      active = false;
    };
  }, [overrideDocView, supabase]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showOverrideToast = (message: string, tone: "success" | "error") => {
    setOverrideToast({ message, tone });
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setOverrideToast(null);
    }, 2400);
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

  const openOverrideEditor = () => {
    setSubmitStatus(null);
    const doc = buildOverrideDoc(base, patch);
    const snapshot = JSON.stringify(doc);
    setOverrideDoc(doc);
    setDirtySnapshot(snapshot);
    setNewPillLabel("");
    setHeroPreviewUrl(doc.doc.heroImage?.url?.trim() ? doc.doc.heroImage.url.trim() : null);
    setMediaStatus(null);
    setActiveSectionId(doc.doc.sections[0]?.id ?? null);
    setAddMenuOpen(false);
    setSectionMenuOpenId(null);
    setBlockMenuOpenKey(null);
    setOverrideToast(null);
    setOverrideOpen(true);
  };

  const openLiveEditor = () => {
    setSubmitStatus(null);
    setLiveDraft({
      slug: "",
      title: merged.frontmatter.title,
      tags: merged.frontmatter.tags.join(", "),
      muscles: merged.frontmatter.muscles.join(", "),
      themeCompatibility: merged.frontmatter.themeCompatibility.join(", "),
      level: merged.frontmatter.level ?? "",
      equipment: merged.frontmatter.equipment?.join(", ") ?? "",
      media: merged.frontmatter.media ?? "",
      content: merged.content,
    });
    setLiveOpen(true);
  };

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
      handleAuthError("PIN requis.");
      return;
    }
    if (!overrideDoc) {
      setSubmitStatus("Aucune modification.");
      return;
    }
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
            const nextBlock: ExerciseLiveMediaBlock = {
              type: "media",
              mediaType: "image",
              mediaId: block.mediaId,
              caption: block.caption?.trim() || undefined,
            };
            if (!block.mediaId && block.url) {
              nextBlock.url = block.url.trim();
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
    setPatch(patchJson);
    setOverrideDoc(patchJson);
    setDirtySnapshot(JSON.stringify(patchJson));
    setSubmitStatus(null);
    setIsSavingOverride(false);
    showOverrideToast("Correction enregistrée.", "success");
  };

  const handleSaveLive = async () => {
    if (!teacherPin) {
      handleAuthError("PIN requis.");
      return;
    }
    if (!liveDraft) {
      return;
    }
    const frontmatter = ExerciseFrontmatterSchema.safeParse({
      title: liveDraft.title,
      slug: liveDraft.slug,
      tags: parseList(liveDraft.tags),
      level: liveDraft.level || undefined,
      themeCompatibility: parseThemeCompatibility(liveDraft.themeCompatibility),
      muscles: parseList(liveDraft.muscles),
      equipment: liveDraft.equipment ? parseList(liveDraft.equipment) : undefined,
      media: liveDraft.media || undefined,
    });
    if (!frontmatter.success) {
      setSubmitStatus("Champs invalides (titre, slug, tags, muscles, thèmes).");
      return;
    }
    const response = await fetch("/api/teacher/live-exercise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pin: teacherPin,
        slug: frontmatter.data.slug,
        locale,
        dataJson: {
          frontmatter: frontmatter.data,
          content: liveDraft.content,
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
    setSubmitStatus("Exercice LIVE créé.");
    setLiveOpen(false);
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
        mediaId?: string;
        publicUrl?: string;
      };
      if (!data.mediaId) {
        setMediaStatus("Réponse invalide.");
        return;
      }
      if (data.publicUrl) {
        mediaUrlCache.set(data.mediaId, data.publicUrl);
        setMediaUrlMap((prev) => ({ ...prev, [data.mediaId!]: data.publicUrl! }));
      }
      updateSection(uploadTarget.sectionId, (section) => {
        const blocks = [...section.blocks];
        const nextBlock: ExerciseLiveMediaBlock = {
          type: "media",
          mediaType: "image",
          mediaId: data.mediaId,
          caption: "",
        };
        if (uploadTarget.blockIndex !== undefined) {
          blocks[uploadTarget.blockIndex] = nextBlock;
        } else {
          blocks.push(nextBlock);
        }
        return { ...section, blocks };
      });
      setMediaStatus("Photo ajoutée.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de l'upload.";
      setMediaStatus(message);
    } finally {
      setUploadTarget(null);
    }
  };

  const handleAddPill = () => {
    const label = newPillLabel.trim();
    if (!label) {
      return;
    }
    updateOverrideDoc((doc) => ({
      ...doc,
      doc: {
        ...doc.doc,
        pills: [...(doc.doc.pills ?? []), { label }],
      },
    }));
    setNewPillLabel("");
  };

  const handleRemovePill = (index: number) => {
    updateOverrideDoc((doc) => ({
      ...doc,
      doc: {
        ...doc.doc,
        pills: (doc.doc.pills ?? []).filter((_, idx) => idx !== index),
      },
    }));
  };

  const handleMovePill = (index: number, direction: number) => {
    updateOverrideDoc((doc) => ({
      ...doc,
      doc: {
        ...doc.doc,
        pills: moveItem(doc.doc.pills ?? [], index, index + direction),
      },
    }));
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
    updateSection(sectionId, (section) => ({
      ...section,
      blocks: [...section.blocks, createBlock(type)],
    }));
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
    setAddMenuOpen(false);
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
    if (
      isDirty &&
      !window.confirm("Des modifications ne sont pas enregistrées. Fermer ?")
    ) {
      return;
    }
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

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">Exercices</p>
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
          className="title-longpress select-none touch-manipulation"
          style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
        >
          <h1>{merged.frontmatter.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyPill level={difficulty} />
          {isLive ? <span className="pill pill-live">LIVE</span> : null}
          {merged.frontmatter.muscles.map((muscle) => (
            <span key={muscle} className="pill">
              {muscle}
            </span>
          ))}
        </div>
        {hero ? (
          isHeroUrl(hero) ? (
            <HeroMedia
              src={hero.src}
              alt={hero.alt}
              width={hero.width}
              height={hero.height}
              priority
            />
          ) : (
            <HeroMedia src={hero.src} alt={hero.alt} priority />
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
      </header>

      {teacherUnlocked ? (
        <div className="teacher-panel">
          <p className="eyebrow">Mode prof</p>
          <div className="modal-actions">
            <button
              type="button"
              className="primary-button primary-button--wide"
              onClick={openOverrideEditor}
            >
              Corriger cette fiche
            </button>
            <button
              type="button"
              className="primary-button primary-button--wide"
              onClick={openLiveEditor}
            >
              Créer un exercice LIVE
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
                        const resolvedUrl =
                          (block.mediaId
                            ? mediaUrlMap[block.mediaId] ??
                              mediaUrlCache.get(block.mediaId)
                            : undefined) ?? block.url;
                        if (resolvedUrl) {
                          return (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={resolvedUrl}
                                alt={block.caption ?? section.title}
                                className="w-full h-auto rounded-2xl ring-1 ring-white/10"
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
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card flex max-h-[85vh] flex-col">
            <div className="flex flex-col gap-2 border-b border-white/10 pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h2>Corriger la fiche</h2>
                  {isDirty ? (
                    <span className="text-xs text-[color:var(--muted)]">
                      Modifications non enregistrées
                    </span>
                  ) : null}
                </div>
                {overrideToast ? (
                  <span className="text-xs text-[color:var(--muted)]">
                    {overrideToast.tone === "success" ? "OK: " : "Erreur: "}
                    {overrideToast.message}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pt-4">
              {overrideDoc ? (
                <div className="stack-md">
                <div className="stack-sm">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      Pills
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(overrideDoc.doc.pills ?? []).map((pill, index) => (
                      <span
                        key={`${pill.label}-${index}`}
                        className="pill inline-flex items-center gap-2"
                      >
                        {pill.label}
                        <button
                          type="button"
                          className="text-xs text-[color:var(--muted)] hover:text-[color:var(--ink)]"
                          onClick={() => handleRemovePill(index)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {(overrideDoc.doc.pills ?? []).length === 0 ? (
                      <span className="text-xs text-[color:var(--muted)]">
                        Aucune pill.
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      className="field-input"
                      placeholder="Ajouter une pill"
                      value={newPillLabel}
                      onChange={(event) => setNewPillLabel(event.target.value)}
                    />
                    <button
                      type="button"
                      className="chip"
                      onClick={handleAddPill}
                    >
                      Ajouter
                    </button>
                  </div>
                  {(overrideDoc.doc.pills ?? []).length > 1 ? (
                    <div className="flex flex-wrap gap-2 text-xs text-[color:var(--muted)]">
                      {(overrideDoc.doc.pills ?? []).map((pill, index) => (
                        <div
                          key={`pill-move-${pill.label}-${index}`}
                          className="inline-flex items-center gap-2"
                        >
                          <span>{pill.label}</span>
                          <button
                            type="button"
                            className="chip"
                            disabled={index === 0}
                            onClick={() => handleMovePill(index, -1)}
                          >
                            Monter
                          </button>
                          <button
                            type="button"
                            className="chip"
                            disabled={index === (overrideDoc.doc.pills ?? []).length - 1}
                            onClick={() => handleMovePill(index, 1)}
                          >
                            Descendre
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="stack-sm">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      Image principale
                    </h3>
                  </div>
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
                            onClick={() =>
                              setSectionMenuOpenId((open) =>
                                open === section.id ? null : section.id,
                              )
                            }
                          >
                            ...
                          </button>
                          {sectionMenuOpenId === section.id ? (
                            <div className="absolute right-0 z-10 mt-2 w-44 rounded-2xl border border-white/10 bg-[color:var(--surface)] p-2 shadow-lg">
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
                                ? "Liste"
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
                              className="stack-sm rounded-2xl border border-white/10 p-3"
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
                                    <div className="absolute right-0 z-10 mt-2 w-44 rounded-2xl border border-white/10 bg-[color:var(--surface)] p-2 shadow-lg">
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
                                    Ajouter un item
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
                                      {(() => {
                                        const previewUrl =
                                          (block.mediaId
                                            ? mediaUrlMap[block.mediaId] ??
                                              mediaUrlCache.get(block.mediaId)
                                            : undefined) ?? block.url;
                                        if (!previewUrl) {
                                          return null;
                                        }
                                        return (
                                          <>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                              src={previewUrl}
                                              alt={block.caption ?? section.title}
                                              className="w-full h-auto rounded-2xl ring-1 ring-white/10"
                                            />
                                          </>
                                        );
                                      })()}
                                      <label className="field-label">
                                        Légende (optionnel)
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
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    className="chip"
                    onClick={() => setAddMenuOpen((open) => !open)}
                    disabled={!overrideDoc || overrideDoc.doc.sections.length === 0}
                  >
                    Ajouter...
                  </button>
                  {addMenuOpen ? (
                    <div className="absolute bottom-full left-0 z-10 mb-2 w-40 rounded-2xl border border-white/10 bg-[color:var(--surface)] p-2 shadow-lg">
                      <button
                        type="button"
                        className="chip w-full justify-start"
                        onClick={() => handleAddFromMenu("markdown")}
                      >
                        Texte
                      </button>
                      <button
                        type="button"
                        className="chip w-full justify-start"
                        onClick={() => handleAddFromMenu("bullets")}
                      >
                        Liste
                      </button>
                      <button
                        type="button"
                        className="chip w-full justify-start"
                        onClick={() => handleAddFromMenu("photo")}
                      >
                        Photo
                      </button>
                      <button
                        type="button"
                        className="chip w-full justify-start"
                        onClick={() => handleAddFromMenu("media")}
                      >
                        Lien-Vidéo
                      </button>
                    </div>
                  ) : null}
                </div>
                <span className="text-xs text-[color:var(--muted)]">
                  {activeSection
                    ? `Ajout dans: ${activeSection.title || "Section sans titre"}`
                    : "Ajoutez une section pour insérer des blocs."}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="chip" onClick={handleCloseOverride}>
                  Annuler
                </button>
                <button
                  type="button"
                  className="primary-button primary-button--wide"
                  onClick={handleSaveOverride}
                  disabled={!isDirty || isSavingOverride}
                >
                  Enregistrer
                </button>
              </div>
            </div>
            {mediaStatus ? (
              <p className="text-xs text-[color:var(--muted)]">{mediaStatus}</p>
            ) : null}
            {submitStatus ? (
              <p className="text-xs text-[color:var(--muted)]">{submitStatus}</p>
            ) : null}
          </div>
          </div>
        </div>
      ) : null}

      {liveOpen && liveDraft ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2>Créer un exercice LIVE</h2>
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
