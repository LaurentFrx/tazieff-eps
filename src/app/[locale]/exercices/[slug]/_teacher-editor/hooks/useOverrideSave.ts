// Phase B.1.1 — hook encapsulating doc/save state & handlers for
// the teacher override editor. Output shape matches OverrideDocContextValue
// so it can be passed directly to <OverrideDocProvider value={...}>.
// Parent destructures the return to preserve the closure-read pattern
// used throughout ExerciseLiveDetail.tsx (no JSX changes in B.1.1).

"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { ExerciseFrontmatter } from "@/lib/content/schema";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Lang } from "@/lib/i18n/messages";
import type { ExerciseRenderOverride } from "@/lib/live/patch";
import type {
  ExerciseLiveDocV2,
  ExerciseLiveMediaBlock,
  ExerciseLiveSection,
  ExerciseOverridePatch,
} from "@/lib/live/types";
import type {
  OverrideDocContextValue,
  OverrideToast,
  PillSelections,
  SaveMeta,
} from "../contexts";

export type UseOverrideSaveInput = {
  overrideDoc: ExerciseLiveDocV2 | null;
  setOverrideDoc: Dispatch<SetStateAction<ExerciseLiveDocV2 | null>>;
  base: { frontmatter: ExerciseFrontmatter; content: string };
  patch: ExerciseOverridePatch | null;
  merged: ExerciseRenderOverride;
  pillSelections: PillSelections;
  slug: string;
  locale: Lang;
  source: "mdx" | "live" | "imported";
  teacherPin: string;
  setPatch: Dispatch<SetStateAction<ExerciseOverridePatch | null>>;
  triggerRevalidate: (targetSlug: string) => void;
  onAuthError: (message: string) => void;
  setConfirmCloseOpen: Dispatch<SetStateAction<boolean>>;
  onDiscardResetExternalState: (firstSectionId: string | null) => void;
  buildOverrideDoc: (
    base: { frontmatter: ExerciseFrontmatter; content: string },
    patch: ExerciseOverridePatch | null,
  ) => ExerciseLiveDocV2;
  uniqueLabels: (values: string[]) => string[];
  normalizeLabel: (value: string) => string;
};

export function useOverrideSave(
  input: UseOverrideSaveInput,
): OverrideDocContextValue {
  const {
    overrideDoc,
    setOverrideDoc,
    base,
    patch,
    merged,
    pillSelections,
    slug,
    locale,
    source,
    teacherPin,
    setPatch,
    triggerRevalidate,
    onAuthError,
    setConfirmCloseOpen,
    onDiscardResetExternalState,
    buildOverrideDoc,
    uniqueLabels,
    normalizeLabel,
  } = input;

  const { t } = useI18n();

  const [overrideOpen, setOverrideOpen] = useState(false);
  const [dirtySnapshot, setDirtySnapshot] = useState("");
  const [overrideToast, setOverrideToast] = useState<OverrideToast | null>(null);
  const [isSavingOverride, setIsSavingOverride] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const overrideSnapshot = useMemo(
    () => (overrideDoc ? JSON.stringify(overrideDoc) : ""),
    [overrideDoc],
  );

  const isDirty = overrideDoc ? overrideSnapshot !== dirtySnapshot : false;

  const saveMeta = useMemo<SaveMeta>(() => {
    const tags = uniqueLabels(
      pillSelections.type.map((value) => normalizeLabel(value)),
    ).filter(Boolean);
    const muscles = uniqueLabels(
      pillSelections.muscles.map((value) => normalizeLabel(value)),
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
      status: missing.length === 0 ? "ready" : "draft",
      missing,
      tags,
      muscles,
    };
  }, [
    merged.frontmatter.title,
    merged.frontmatter.themeCompatibility,
    pillSelections.muscles,
    pillSelections.type,
    normalizeLabel,
    uniqueLabels,
  ]);

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

  const handleSaveOverride = async () => {
    if (!teacherPin) {
      showOverrideToast(t("teacherMode.pinRequired"), "error");
      return;
    }
    if (!overrideDoc) {
      setSubmitStatus(t("exerciseEditor.noChanges"));
      return;
    }
    const saveStatus = saveMeta.status;
    const statusLabel =
      saveStatus === "draft" ? t("exerciseEditor.draftSaved") : t("exerciseEditor.exerciseSaved");
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
    setSubmitStatus(t("exerciseEditor.submitting"));
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
      showOverrideToast(t("exerciseEditor.saveFailed"), "error");
      return;
    }
    if (!response.ok) {
      if (response.status === 401) {
        onAuthError(t("teacherMode.pinInvalid"));
        setSubmitStatus(null);
        setIsSavingOverride(false);
        return;
      }
      setSubmitStatus(null);
      setIsSavingOverride(false);
      showOverrideToast(t("exerciseEditor.saveFailed"), "error");
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
          onAuthError(t("teacherMode.pinInvalid"));
        }
        setSubmitStatus(null);
        setIsSavingOverride(false);
        showOverrideToast(t("exerciseEditor.updateFailed"), "error");
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
    setOverrideToast(null);
    onDiscardResetExternalState(doc.doc.sections[0]?.id ?? null);
  };

  const handleCloseWithoutSave = () => {
    setConfirmCloseOpen(false);
    setOverrideOpen(false);
  };

  return {
    overrideDoc,
    dirtySnapshot,
    isDirty,
    overrideOpen,
    isSavingOverride,
    overrideToast,
    submitStatus,
    setOverrideDoc,
    setDirtySnapshot,
    setOverrideOpen,
    setIsSavingOverride,
    setOverrideToast,
    setSubmitStatus,
    toastTimerRef,
    merged,
    overrideSnapshot,
    saveMeta,
    handleSaveOverride,
    handleCloseOverride,
    handleCloseWithoutSave,
    handleDiscardOverride,
    handleAuthError: onAuthError,
    updateOverrideDoc,
    updateSection,
    showOverrideToast,
  };
}
