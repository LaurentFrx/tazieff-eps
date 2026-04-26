// Phase B.1.4 — hook encapsulating UI residual state & handlers for
// the teacher override editor. Output shape matches OverrideUIContextValue
// (minus handleAddFromMenu, which the parent reconstructs because it
// consumes useOverrideMediaUpload outputs declared AFTER this hook).
//
// Scope: sections/blocks CRUD, block highlight, "Add block" menu,
// confirm/delete modals, teacher PIN state, block toasts.
//
// liveExists is piloted by a parent-level Supabase useEffect (global sync),
// so it stays in the parent, is passed as input, and re-exposed in the
// return for the OverrideUIProvider value coherence.
//
// confirmCloseOpen/setConfirmCloseOpen also stay in the parent — they are
// consumed by useOverrideSave which is called BEFORE this hook in the
// parent ordering (save → UI → media → pills).
//
// Extras re-exposed beyond OverrideUIContextValue:
// - highlightBlock (consumed by useOverrideMediaUpload)
// - blockToast + blockToastVisible + their setters and timer refs
//   (block toast rendering lives in the parent JSX modal).

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Lang } from "@/lib/i18n/messages";
import type { ExerciseLiveDocV2, ExerciseLiveSection } from "@/lib/live/types";
import type { OverrideUIContextValue } from "../contexts";
import {
  createBlock,
  createMarkdownBlock,
  createSectionId,
  moveItem,
} from "../lib/ui-utils";

export type UseOverrideUIInput = {
  overrideDoc: ExerciseLiveDocV2 | null;
  updateOverrideDoc: (
    updater: (doc: ExerciseLiveDocV2) => ExerciseLiveDocV2,
  ) => void;
  updateSection: (
    sectionId: string,
    updater: (section: ExerciseLiveSection) => ExerciseLiveSection,
  ) => void;
  showOverrideToast: (message: string, tone: "success" | "error") => void;
  handleAuthError: (message: string) => void;
  liveExists: boolean;
  setLiveExists: Dispatch<SetStateAction<boolean>>;
  confirmCloseOpen: boolean;
  setConfirmCloseOpen: Dispatch<SetStateAction<boolean>>;
  slug: string;
  locale: Lang;
  triggerRevalidate: (targetSlug: string) => void;
};

export type UseOverrideUIReturn = Omit<
  OverrideUIContextValue,
  "handleAddFromMenu"
> & {
  highlightBlock: (blockKey: string) => void;
  blockToast: { id: number; message: string } | null;
  blockToastVisible: boolean;
  setBlockToast: Dispatch<
    SetStateAction<{ id: number; message: string } | null>
  >;
  setBlockToastVisible: Dispatch<SetStateAction<boolean>>;
  blockToastTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  blockToastHideTimerRef: MutableRefObject<
    ReturnType<typeof setTimeout> | null
  >;
};

export function useOverrideUI(
  input: UseOverrideUIInput,
): UseOverrideUIReturn {
  const {
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
  } = input;

  const { t } = useI18n();

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [sectionMenuOpenId, setSectionMenuOpenId] = useState<string | null>(
    null,
  );
  const [blockMenuOpenKey, setBlockMenuOpenKey] = useState<string | null>(null);
  const [highlightBlockKey, setHighlightBlockKey] = useState<string | null>(
    null,
  );
  const [addBlockMenuOpen, setAddBlockMenuOpen] = useState(false);
  const [deleteLiveOpen, setDeleteLiveOpen] = useState(false);
  const [isDeletingLive, setIsDeletingLive] = useState(false);
  const [blockToast, setBlockToast] = useState<{
    id: number;
    message: string;
  } | null>(null);
  const [blockToastVisible, setBlockToastVisible] = useState(false);

  const sectionTitleRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const blockFieldRefs = useRef<
    Record<string, HTMLInputElement | HTMLTextAreaElement | null>
  >({});
  const blockContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addBlockMenuRef = useRef<HTMLDivElement | null>(null);
  const addBlockButtonRef = useRef<HTMLButtonElement | null>(null);
  const blockToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blockToastHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

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

  useEffect(() => {
    if (!addBlockMenuOpen) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        addBlockMenuRef.current &&
        target &&
        addBlockMenuRef.current.contains(target)
      ) {
        return;
      }
      if (
        addBlockButtonRef.current &&
        target &&
        addBlockButtonRef.current.contains(target)
      ) {
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

  const resolveSectionTitle = useCallback(
    (sectionId: string) => {
      const section = overrideDoc?.doc.sections.find(
        (item) => item.id === sectionId,
      );
      const label = section?.title?.trim();
      return label && label.length > 0
        ? label
        : t("exerciseEditor.untitledSection");
    },
    [overrideDoc, t],
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
    [resolveSectionTitle, t],
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

  const handleDeleteLive = async () => {
    // P0.1 — la garde "PIN saisi" est supprimée. requireAdmin() côté serveur
    // contrôle l'authentification.
    setIsDeletingLive(true);
    let response: Response;
    try {
      response = await fetch(
        `/api/teacher/live-exercise?slug=${encodeURIComponent(slug)}&locale=${encodeURIComponent(locale)}`,
        {
          method: "DELETE",
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
      showOverrideToast(
        payload?.message ?? t("exerciseEditor.deleteFailed"),
        "error",
      );
      setIsDeletingLive(false);
      return;
    }

    setLiveExists(false);
    setDeleteLiveOpen(false);
    showOverrideToast(t("exerciseEditor.versionDeleted"), "success");
    setIsDeletingLive(false);
    triggerRevalidate(slug);
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
      const index = doc.doc.sections.findIndex(
        (section) => section.id === sectionId,
      );
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
        sections: doc.doc.sections.filter(
          (section) => section.id !== sectionId,
        ),
      },
    }));
  };

  const handleAddBlock = (
    sectionId: string,
    type: "markdown" | "bullets" | "media",
  ) => {
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

  const handleMoveBlock = (
    sectionId: string,
    blockIndex: number,
    direction: number,
  ) => {
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
    return (
      overrideDoc.doc.sections[overrideDoc.doc.sections.length - 1]?.id ?? null
    );
  };

  return {
    activeSectionId,
    sectionMenuOpenId,
    blockMenuOpenKey,
    highlightBlockKey,
    addBlockMenuOpen,
    confirmCloseOpen,
    deleteLiveOpen,
    isDeletingLive,
    liveExists,

    setActiveSectionId,
    setSectionMenuOpenId,
    setBlockMenuOpenKey,
    setHighlightBlockKey,
    setAddBlockMenuOpen,
    setConfirmCloseOpen,
    setDeleteLiveOpen,
    setIsDeletingLive,
    setLiveExists,

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

    // Extras (not in OverrideUIContextValue — used by parent closure / media hook)
    highlightBlock,
    blockToast,
    blockToastVisible,
    setBlockToast,
    setBlockToastVisible,
    blockToastTimerRef,
    blockToastHideTimerRef,
  };
}
