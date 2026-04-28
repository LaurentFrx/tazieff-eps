// Sprint hotfix-edit-execution-conseils (28 avril 2026) — édition inline
// d'une SECTION DE LISTE (Exécution = liste numérotée, Conseils = bullets).
//
// Différence avec InlineParagraphEditor (E.2) : la valeur source est du
// markdown avec items `- step1\n- step2\n...`. Le rendu en lecture délègue
// à un render-prop `renderList` qui formate les items en <ol>/<ul> stylé
// (numéros oranges pour Exécution, bullets pour Conseils). En édition, on
// ouvre un <textarea> qui contient le markdown brut, l'admin édite/ajoute/
// supprime des lignes `- ...`, et on save tel quel.
//
// Pattern aligné avec InlineParagraphEditor : focus immédiat, blur = commit,
// Échap = annulation, Enter = saut de ligne autorisé.

"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";

export type InlineListEditorProps = {
  /** Markdown brut avec items `- step1\n- step2\n...` */
  initialValue: string;
  /**
   * Render-prop pour le mode lecture. Reçoit les items déjà parsés (lignes
   * sans le `-` initial, trim) + un onClick à attacher au wrapper pour
   * passer en mode édition. Le caller est libre d'utiliser un `<div>`,
   * `<ul>`, `<ol>` ou autre élément HTML qui accepte ces handlers.
   */
  renderList: (
    items: string[],
    handlers: {
      onClick: () => void;
      onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
      role: "button";
      tabIndex: 0;
      "aria-label": string;
      "data-testid": string;
      "data-section-key": string | undefined;
      className: string;
    },
  ) => ReactNode;
  /** Callback de sauvegarde, doit renvoyer une promesse. */
  onSave: (newValue: string) => Promise<void>;
  /** Callback d'erreur (toast). */
  onError?: (message: string) => void;
  /** Placeholder du textarea quand vide. */
  placeholder?: string;
  /** aria-label commun (lecture + édition). */
  ariaLabel?: string;
  /** Libellé du bouton "Enregistrer" en mode édition. */
  saveLabel?: string;
  /** Classes Tailwind appliquées au <textarea>. */
  textareaClassName?: string;
  /** Styles inline additionnels pour le <textarea>. */
  textareaStyle?: CSSProperties;
  /** Message générique si onSave rejette sans message. */
  genericErrorMessage?: string;
  /** Identifiant logique de la section (data-attr, debug). */
  sectionKey?: string;
};

/**
 * Parse le markdown de liste : retire les `- ` au début de chaque ligne
 * non-vide et trim. Conserve l'ordre.
 */
function parseListItems(markdown: string): string[] {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"))
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter((line) => line.length > 0);
}

export default function InlineListEditor({
  initialValue,
  renderList,
  onSave,
  onError,
  placeholder = "- Ajoute un item par ligne, préfixé d'un tiret",
  ariaLabel = "Cliquer pour modifier la liste",
  saveLabel = "Enregistrer",
  textareaClassName,
  textareaStyle,
  genericErrorMessage = "Échec de la sauvegarde",
  sectionKey,
}: InlineListEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cancelledRef = useRef(false);
  const savingViaButtonRef = useRef(false);

  useEffect(() => {
    if (!isEditing) setDraft(initialValue);
  }, [initialValue, isEditing]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
    }
  }, [isEditing]);

  useLayoutEffect(() => {
    if (isEditing && textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [isEditing, draft]);

  const enterEdit = useCallback(() => {
    if (isSaving) return;
    cancelledRef.current = false;
    savingViaButtonRef.current = false;
    setDraft(initialValue);
    setIsEditing(true);
  }, [isSaving, initialValue]);

  const handleDisplayKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        enterEdit();
      }
    },
    [enterEdit],
  );

  const commit = useCallback(async () => {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      setIsEditing(false);
      return;
    }
    const trimmed = draft.trim();
    if (trimmed === initialValue.trim()) {
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
      onError?.(message);
      setDraft(initialValue);
    } finally {
      setIsSaving(false);
    }
  }, [draft, initialValue, onSave, onError, genericErrorMessage]);

  const handleTextareaKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelledRef.current = true;
        textareaRef.current?.blur();
      }
    },
    [],
  );

  const handleSaveMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      savingViaButtonRef.current = true;
    },
    [],
  );

  const handleSaveClick = useCallback(async () => {
    await commit();
    savingViaButtonRef.current = false;
  }, [commit]);

  const handleBlur = useCallback(async () => {
    if (savingViaButtonRef.current) return;
    await commit();
  }, [commit]);

  if (isEditing) {
    return (
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleTextareaKeyDown}
          aria-label={ariaLabel}
          data-testid="inline-list-edit"
          data-section-key={sectionKey}
          placeholder={placeholder}
          rows={3}
          className={[
            textareaClassName ?? "",
            "block w-full bg-white/10 border-0 outline-none rounded px-2 py-1",
            "ring-1 ring-cyan-400/40 focus:ring-cyan-400/70",
            "resize-none overflow-hidden font-mono text-sm",
            isSaving ? "opacity-60 cursor-wait" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            color: "inherit",
            letterSpacing: "inherit",
            lineHeight: "1.5",
            ...textareaStyle,
          }}
        />
        <button
          type="button"
          onMouseDown={handleSaveMouseDown}
          onClick={handleSaveClick}
          disabled={isSaving}
          aria-label={saveLabel}
          data-testid="inline-list-save"
          className="absolute right-0 -bottom-7 text-[10px] uppercase tracking-wider text-cyan-300 hover:text-cyan-100 px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm"
        >
          {saveLabel}
        </button>
      </div>
    );
  }

  const items = parseListItems(initialValue);
  return renderList(items, {
    onClick: enterEdit,
    onKeyDown: handleDisplayKeyDown,
    role: "button",
    tabIndex: 0,
    "aria-label": ariaLabel,
    "data-testid": "inline-list-display",
    "data-section-key": sectionKey,
    className:
      "cursor-text hover:bg-white/5 focus:bg-white/10 focus:outline-none rounded px-2 -mx-2 transition-colors",
  });
}
