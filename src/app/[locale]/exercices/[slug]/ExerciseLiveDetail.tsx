"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useAppAdmin } from "@/hooks/useAppAdmin";
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
// Phase B.2 — lazy-load the teacher override editor (ssr:false).
// Only downloaded when the teacher opens the editor via long-press / ?edit=1.
const TeacherOverrideEditor = dynamic(
  () => import("./_teacher-editor/TeacherOverrideEditor"),
  { ssr: false },
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
import InlineTitleEditor from "./_teacher-editor/InlineTitleEditor";
import InlineParagraphEditor from "./_teacher-editor/InlineParagraphEditor";
import { useOverrideMediaUpload } from "./_teacher-editor/hooks/useOverrideMediaUpload";
import { useOverrideUI } from "./_teacher-editor/hooks/useOverrideUI";
import { usePillDropdown } from "./_teacher-editor/hooks/usePillDropdown";
import { mediaUrlCache } from "./_teacher-editor/lib/media-utils";
import {
  getLevelDefaults,
  getMuscleDefaults,
  getThemeDefaults,
  getTypeDefaults,
  normalizeKey,
  normalizeLabel,
  sortLabels,
  uniqueLabels,
} from "./_teacher-editor/lib/pill-utils";
import {
  createBlock,
  createMarkdownBlock,
  createSectionId,
  moveItem,
} from "./_teacher-editor/lib/ui-utils";

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

// P0.1 — Le mécanisme TeacherModeSnapshot / window.__teacherMode / PIN a été
// supprimé. L'édition du catalogue officiel est maintenant gatée par
// `useAppAdmin()` (compte super_admin / admin authentifié, cf. /api/me/role
// et table public.app_admins en P0.2). Voir GOUVERNANCE_EDITORIALE.md §3.1, §7.

const POLL_INTERVAL_MS = 20000;

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

type MediaInfo = {
  mime?: string | null;
  size?: number | null;
  width?: number | null;
  height?: number | null;
};

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

// Phase E.2 — clés logiques pour l'édition inline des paragraphes simples.
type InlineParagraphKey = "resume" | "respiration" | "securite";

// Matchers de titres de section (FR primaire, accents insensibles) — utilisés
// pour localiser la section cible dans l'override doc lors de l'édition inline.
const SECTION_TITLE_MATCHERS: Record<InlineParagraphKey, RegExp> = {
  resume: /^r[eé]sum[eé]$/i,
  respiration: /^respiration$/i,
  securite: /^s[eé]curit[eé]$/i,
};

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
  const [menuOpen, setMenuOpen] = useState(false);
  // P0.1 — `isAdmin` remplace l'ancien teacherUnlocked. Source de vérité :
  // GET /api/me/role qui consulte public.app_admins via RLS.
  const { isAdmin } = useAppAdmin();
  const [overrideDoc, setOverrideDoc] = useState<ExerciseLiveDocV2 | null>(null);
  // Phase E.1 — override local du titre (édition inline). Prend le pas sur
  // merged.frontmatter.title tant qu'il est non null, pour refléter immédiatement
  // la valeur saisie par l'enseignant (la persistance se fait via handleSaveOverride).
  const [titleOverride, setTitleOverride] = useState<string | null>(null);
  const [pillCustomOptions, setPillCustomOptions] = useState({
    level: [] as string[],
    type: [] as string[],
    muscles: [] as string[],
    themes: [] as string[],
  });
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);
  const [liveExists, setLiveExists] = useState(false);
  const [liveDraft, setLiveDraft] = useState<LiveDraft | null>(null);
  const autoEditHandledRef = useRef(false);
  const mediaInfoRequestedRef = useRef<Set<string>>(new Set());

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
    titleOverride?.trim() ||
    merged.frontmatter.title?.trim() ||
    t("exerciseGrid.untitledDraft");

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
    setPatch,
    triggerRevalidate,
    onAuthError: (message: string) => {
      // P0.1 — plus de PIN modal. On affiche un toast d'erreur.
      showOverrideToast(message, "error");
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

  // Phase E.1 — sauvegarde déclenchée par l'éditeur inline du titre.
  // Ne duplique pas la logique : met à jour l'override local (UI immédiate)
  // puis délègue à handleSaveOverride, qui est la fonction de sauvegarde
  // exposée par useOverrideSave. En cas d'échec, l'override est rollback
  // pour remettre l'ancien titre en place.
  const handleInlineTitleSave = useCallback(
    async (newTitle: string) => {
      const previous = titleOverride;
      setTitleOverride(newTitle);
      try {
        await handleSaveOverride();
      } catch (err) {
        setTitleOverride(previous);
        throw err;
      }
    },
    [titleOverride, handleSaveOverride],
  );

  // Phase E.2 — sauvegarde déclenchée par l'éditeur inline d'un paragraphe
  // (Résumé / Respiration / Sécurité). Pas de duplication de logique : on
  // s'appuie sur useOverrideSave (updateSection / setOverrideDoc /
  // handleSaveOverride). Deux cas :
  //  - Branche A (overrideDoc présent) : on localise la section ciblée par
  //    son titre, on met à jour le premier block markdown via updateSection,
  //    puis on déclenche la sauvegarde.
  //  - Branche B (overrideDoc absent) : on construit un overrideDoc complet
  //    via buildOverrideDoc, on injecte la modification, puis setOverrideDoc
  //    bascule l'UI en branche A. On appelle ensuite handleSaveOverride
  //    (cohérence avec le pattern E.1 ; en branche B la sauvegarde réelle
  //    aura lieu au prochain édit puisque la closure de handleSaveOverride
  //    référence l'overrideDoc précédent).
  const handleInlineParagraphSave = useCallback(
    async (sectionKey: InlineParagraphKey, newBody: string) => {
      const matcher = SECTION_TITLE_MATCHERS[sectionKey];
      const baseDoc: ExerciseLiveDocV2 =
        overrideDoc ?? buildOverrideDoc(base, patch);
      const targetSection = baseDoc.doc.sections.find((section) =>
        matcher.test(section.title.trim()),
      );
      if (!targetSection) {
        // eslint-disable-next-line no-console
        console.warn(
          `[E.2] Section "${sectionKey}" introuvable dans l'override doc — édition inline ignorée.`,
        );
        return;
      }
      const markdownIdx = targetSection.blocks.findIndex(
        (block) => block.type === "markdown",
      );
      if (markdownIdx === -1) {
        // eslint-disable-next-line no-console
        console.warn(
          `[E.2] Aucun block markdown dans la section "${sectionKey}" — édition inline ignorée.`,
        );
        return;
      }

      const updateBlocks = (section: ExerciseLiveSection) => ({
        ...section,
        blocks: section.blocks.map((block, idx) => {
          if (idx !== markdownIdx) return block;
          if (block.type !== "markdown") return block;
          const next: ExerciseLiveMarkdownBlock = {
            ...block,
            content: newBody,
          };
          return next;
        }),
      });

      if (overrideDoc) {
        updateSection(targetSection.id, updateBlocks);
      } else {
        const builtDoc: ExerciseLiveDocV2 = {
          ...baseDoc,
          doc: {
            ...baseDoc.doc,
            sections: baseDoc.doc.sections.map((section) =>
              section.id === targetSection.id ? updateBlocks(section) : section,
            ),
          },
        };
        setOverrideDoc(builtDoc);
      }

      await handleSaveOverride();
    },
    [
      overrideDoc,
      base,
      patch,
      updateSection,
      setOverrideDoc,
      handleSaveOverride,
    ],
  );

  const overrideUIHookValue = useOverrideUI({
    overrideDoc,
    updateOverrideDoc,
    updateSection,
    showOverrideToast,
    handleAuthError,
    liveExists,
    setLiveExists,
    confirmCloseOpen,
    setConfirmCloseOpen,
    slug,
    locale,
    triggerRevalidate,
  });
  const {
    activeSectionId,
    sectionMenuOpenId,
    blockMenuOpenKey,
    highlightBlockKey,
    addBlockMenuOpen,
    deleteLiveOpen,
    isDeletingLive,
    setActiveSectionId,
    setSectionMenuOpenId,
    setBlockMenuOpenKey,
    setHighlightBlockKey,
    setAddBlockMenuOpen,
    setDeleteLiveOpen,
    setIsDeletingLive,
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
    handleDeleteLive,
    showBlockToast,
    dismissBlockToast,
    resolveSectionTitle,
    resolveTargetSectionId,
    highlightBlock,
    blockToast,
    blockToastVisible,
    setBlockToast,
    setBlockToastVisible,
  } = overrideUIHookValue;

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
          // P0.6 : un soft-delete arrive en UPDATE avec deleted_at non null.
          // On traite comme un retrait : reset le patch à null.
          const newRow = payload.new as {
            patch_json?: ExerciseOverridePatch;
            deleted_at?: string | null;
          };
          if (newRow.deleted_at) {
            setPatch(null);
            return;
          }
          setPatch(newRow.patch_json ?? null);
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
      // P0.6 : exclure les rows soft-deletées du polling (la policy SELECT
      // publique le fait déjà, on double-garde côté client).
      const { data } = await supabase
        .from("exercise_overrides")
        .select("slug, locale, patch_json, updated_at")
        .eq("slug", slug)
        .eq("locale", locale)
        .is("deleted_at", null)
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

  const overrideMediaValue = useOverrideMediaUpload({
    overrideDoc,
    slug,
    updateSection,
    updateOverrideDoc,
    handleAuthError,
    setActiveSectionId,
    highlightBlock,
    showBlockToast,
    mediaInfoRequestedRef,
  });
  const {
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
  } = overrideMediaValue;

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

  const overridePillsValue = usePillDropdown({
    pillState,
    pillCustomOptions,
    setPillCustomOptions,
    updateOverrideDoc,
  });
  const {
    pillDropdownOpen,
    pillSearch,
    pillDropdownStyle,
    levelAddOpen,
    levelAddValue,
    setPillDropdownOpen,
    setPillSearch,
    setPillDropdownStyle,
    setLevelAddOpen,
    setLevelAddValue,
    dropdownMenuRef,
    dropdownTriggerRefs,
    updatePillSelections,
    setLevelSelection,
    addCustomLevel,
    toggleMultiSelection,
    addCustomOption,
    toggleDropdown,
    updateDropdownPosition,
  } = overridePillsValue;

  // P0.1 — La logique de long-press / openPinModal a été supprimée avec le PIN.
  // Le bouton ··· (3 points) ouvre directement le menu pour tous les
  // utilisateurs ; l'option "Mode enseignant" du menu n'apparaît que pour
  // les comptes admin.

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
    if (!isAdmin) {
      return;
    }
    if (searchParams?.get("edit") !== "1") {
      return;
    }
    openOverrideEditor();
  }, [openOverrideEditor, searchParams, isAdmin]);

  const handleSaveLive = async () => {
    if (!isAdmin) {
      handleAuthError(t("exerciseEditor.adminRequired"));
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
      if (response.status === 401 || response.status === 403) {
        handleAuthError(t("exerciseEditor.adminRequired"));
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
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenuOpen(!menuOpen);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setMenuOpen(!menuOpen);
                    }
                  }}
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
                    {/* P0.1 — option d'édition uniquement pour les comptes admin (super_admin / admin) */}
                    {isAdmin && (
                      <>
                        <div className="h-px bg-white/10 my-1" />
                        <button type="button" onClick={() => { openOverrideEditor(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors">
                          {t("exerciseDetail.teacherMode")}
                        </button>
                      </>
                    )}
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
              {isAdmin ? (
                <InlineTitleEditor
                  title={displayTitle}
                  slug={slug}
                  locale={lang}
                  onSave={handleInlineTitleSave}
                  onError={(message) => showOverrideToast(message, "error")}
                />
              ) : (
                displayTitle
              )}
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
              {isAdmin ? (
                <InlineParagraphEditor
                  initialValue={parsedSections.resume.body}
                  onSave={(newBody) => handleInlineParagraphSave('resume', newBody)}
                  onError={(message) => showOverrideToast(message, "error")}
                  ariaLabel={t("exerciseEditor.editResumeAriaLabel")}
                  placeholder={t("exerciseEditor.editParagraphPlaceholder")}
                  saveLabel={t("exerciseEditor.editParagraphSaveLabel")}
                  sectionKey="resume"
                  className="text-[15px] text-white/90 leading-relaxed"
                  style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                />
              ) : (
                <p className="text-[15px] text-white/90 leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                  {parsedSections.resume.body}
                </p>
              )}
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
              {isAdmin ? (
                <InlineParagraphEditor
                  initialValue={parsedSections.respiration.body}
                  onSave={(newBody) => handleInlineParagraphSave('respiration', newBody)}
                  onError={(message) => showOverrideToast(message, "error")}
                  ariaLabel={t("exerciseEditor.editRespirationAriaLabel")}
                  placeholder={t("exerciseEditor.editParagraphPlaceholder")}
                  saveLabel={t("exerciseEditor.editParagraphSaveLabel")}
                  sectionKey="respiration"
                  className="text-sm text-white/70 leading-relaxed"
                  style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                />
              ) : (
                <p className="text-sm text-white/70 leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                  {parsedSections.respiration.body}
                </p>
              )}
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
                  {isAdmin ? (
                    <InlineParagraphEditor
                      initialValue={parsedSections.securite.body}
                      onSave={(newBody) => handleInlineParagraphSave('securite', newBody)}
                      onError={(message) => showOverrideToast(message, "error")}
                      ariaLabel={t("exerciseEditor.editSecuriteAriaLabel")}
                      placeholder={t("exerciseEditor.editParagraphPlaceholder")}
                      saveLabel={t("exerciseEditor.editParagraphSaveLabel")}
                      sectionKey="securite"
                      className="text-sm leading-relaxed"
                      style={{ color: 'rgba(255,0,110,0.8)' }}
                    />
                  ) : (
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,0,110,0.8)' }}>
                      {parsedSections.securite.body}
                    </p>
                  )}
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
      {isAdmin ? (
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

      {/* P0.1 — Le PIN modal a été supprimé. L'édition du catalogue exige un
          compte super_admin / admin authentifié (cf. GOUVERNANCE_EDITORIALE.md
          §3.1, §7). */}

      <OverrideUIProvider
        value={{ ...overrideUIHookValue, handleAddFromMenu }}
      >
        <OverrideDocProvider value={overrideDocValue}>
          <OverrideMediaProvider value={overrideMediaValue}>
            <OverridePillsProvider value={overridePillsValue}>
              {overrideOpen && (
                <TeacherOverrideEditor
                  slug={slug}
                  locale={locale}
                  merged={merged}
                  base={base}
                  patch={patch}
                  pillState={pillState}
                  saveMeta={saveMeta}
                  displayTitle={displayTitle}
                />
              )}
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
