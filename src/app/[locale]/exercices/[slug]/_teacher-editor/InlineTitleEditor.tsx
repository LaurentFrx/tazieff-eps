// Phase E.1 — édition inline du titre de l'exercice.
// Composant UI pur : la logique de sauvegarde est injectée via `onSave`
// (qui, côté parent, s'appuie sur useOverrideSave pour ne pas dupliquer
// la logique de persistance). Les erreurs remontent via `onError` et
// réutilisent le système de toast existant (showOverrideToast).

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import type { Lang } from "@/lib/i18n/messages";

export type InlineTitleEditorProps = {
  /** Titre courant affiché (déjà résolu par le parent). */
  title: string;
  /** Slug de l'exercice — transmis pour a11y / debug. */
  slug: string;
  /** Locale active — transmise pour a11y / debug. */
  locale: Lang;
  /** Classes Tailwind appliquées au span ET à l'input pour héritage visuel. */
  className?: string;
  /** Styles inline additionnels (ex. fontFamily custom). */
  style?: CSSProperties;
  /**
   * Callback de sauvegarde, injectée par le parent. Reçoit le nouveau titre
   * trimé. Doit renvoyer une promesse qui rejette en cas d'erreur — dans ce
   * cas, l'ancien titre est restauré et onError est invoqué.
   */
  onSave: (newTitle: string) => Promise<void>;
  /** Callback d'erreur (toast). */
  onError?: (message: string) => void;
  /** aria-label du span (mode lecture). */
  editAriaLabel?: string;
  /** aria-label de l'input (mode édition). */
  inputAriaLabel?: string;
  /** Message de l'erreur générique si onSave rejette sans message. */
  genericErrorMessage?: string;
};

export default function InlineTitleEditor({
  title,
  slug,
  locale,
  className,
  style,
  onSave,
  onError,
  editAriaLabel = "Cliquer pour modifier le titre de l'exercice",
  inputAriaLabel = "Titre de l'exercice",
  genericErrorMessage = "Échec de la sauvegarde du titre",
}: InlineTitleEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Flag pour distinguer Escape (annulation) de blur (commit).
  const cancelledRef = useRef(false);

  // Si le titre source change pendant qu'on n'édite pas, on s'aligne.
  useEffect(() => {
    if (!isEditing) setDraft(title);
  }, [title, isEditing]);

  // Focus + pré-sélection au passage en édition.
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const enterEdit = useCallback(() => {
    if (isSaving) return;
    cancelledRef.current = false;
    setDraft(title);
    setIsEditing(true);
  }, [isSaving, title]);

  const commit = useCallback(async () => {
    const trimmed = draft.trim();
    const original = title.trim();
    // Identique ou vide → on repasse en lecture sans appeler onSave.
    if (!trimmed || trimmed === original) {
      setDraft(title);
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(trimmed);
      setIsEditing(false);
    } catch (err) {
      const message =
        err instanceof Error && err.message ? err.message : genericErrorMessage;
      // Restaure le titre d'origine dans le draft pour le prochain passage.
      setDraft(title);
      setIsEditing(false);
      onError?.(message);
    } finally {
      setIsSaving(false);
    }
  }, [draft, title, onSave, onError, genericErrorMessage]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setDraft(title);
    setIsEditing(false);
  }, [title]);

  const handleInputKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void commit();
      } else if (event.key === "Escape") {
        event.preventDefault();
        cancel();
      }
    },
    [commit, cancel],
  );

  const handleInputBlur = useCallback(() => {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      return;
    }
    void commit();
  }, [commit]);

  const handleDisplayKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLSpanElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        enterEdit();
      }
    },
    [enterEdit],
  );

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        disabled={isSaving}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleInputKeyDown}
        onBlur={handleInputBlur}
        aria-label={inputAriaLabel}
        aria-busy={isSaving ? "true" : undefined}
        data-testid="inline-title-input"
        data-slug={slug}
        data-locale={locale}
        className={[
          className ?? "",
          "bg-white/10 border-0 outline-none rounded px-2 -mx-2",
          "ring-1 ring-cyan-400/40 focus:ring-cyan-400/70",
          "w-full max-w-full",
          isSaving ? "opacity-60 cursor-wait" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          font: "inherit",
          color: "inherit",
          letterSpacing: "inherit",
          lineHeight: "inherit",
          ...style,
        }}
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={enterEdit}
      onKeyDown={handleDisplayKeyDown}
      aria-label={editAriaLabel}
      data-testid="inline-title-display"
      data-slug={slug}
      data-locale={locale}
      className={[
        className ?? "",
        "cursor-text hover:bg-white/10 focus:bg-white/10 focus:outline-none",
        "rounded px-2 -mx-2 transition-colors inline-block align-baseline",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {title}
    </span>
  );
}
