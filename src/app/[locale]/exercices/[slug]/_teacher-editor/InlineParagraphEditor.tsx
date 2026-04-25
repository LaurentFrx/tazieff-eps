// Phase E.2 — édition inline d'un paragraphe simple (Résumé, Respiration, Sécurité).
// Composant UI pur : la logique de sauvegarde est injectée via `onSave`.
// Pattern aligné avec InlineTitleEditor (E.1) : focus immédiat, blur = commit,
// Échap = annulation. Différence clé : Enter ne valide pas (saut de ligne autorisé)
// et la zone est un <textarea> auto-grow (la hauteur s'adapte au contenu).

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
} from "react";

export type InlineParagraphEditorProps = {
  /** Valeur courante du paragraphe (déjà résolue par le parent). */
  initialValue: string;
  /**
   * Callback de sauvegarde, injectée par le parent. Reçoit le nouveau
   * contenu. Les sauts de ligne internes sont préservés. Doit renvoyer une
   * promesse qui rejette en cas d'erreur — dans ce cas, l'ancienne valeur
   * est restaurée et onError est invoqué.
   */
  onSave: (newValue: string) => Promise<void>;
  /** Callback d'erreur (toast). */
  onError?: (message: string) => void;
  /** Placeholder du textarea quand le paragraphe est vide. */
  placeholder?: string;
  /** aria-label commun (lecture + édition). */
  ariaLabel?: string;
  /** Libellé du bouton "Enregistrer" affiché en mode édition. */
  saveLabel?: string;
  /** Classes Tailwind appliquées au <p> ET au <textarea> pour héritage visuel. */
  className?: string;
  /** Styles inline additionnels (ex. fontFamily custom). */
  style?: CSSProperties;
  /** Message générique si onSave rejette sans message. */
  genericErrorMessage?: string;
  /** Identifiant logique de la section (data-attr, debug). */
  sectionKey?: string;
};

export default function InlineParagraphEditor({
  initialValue,
  onSave,
  onError,
  placeholder = "",
  ariaLabel = "Cliquer pour modifier",
  saveLabel = "Enregistrer",
  className,
  style,
  genericErrorMessage = "Échec de la sauvegarde",
  sectionKey,
}: InlineParagraphEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Flag : distingue Échap (annulation) du blur normal (commit).
  const cancelledRef = useRef(false);
  // Flag : distingue le clic sur "Enregistrer" (qui déclenche le blur) du blur
  // standard. On évite ainsi un double commit.
  const savingViaButtonRef = useRef(false);

  useEffect(() => {
    if (!isEditing) setDraft(initialValue);
  }, [initialValue, isEditing]);

  // Focus + curseur en fin de texte au passage en édition.
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
    }
  }, [isEditing]);

  // Auto-grow vertical : la hauteur s'adapte au contenu à chaque keystroke.
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

  const commit = useCallback(async () => {
    const original = initialValue.trim();
    const trimmedDraft = draft.trim();
    // No-op si vide ou identique (en ignorant le whitespace de bord).
    if (!trimmedDraft || trimmedDraft === original) {
      setDraft(initialValue);
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      // On envoie le draft tel quel (avec ses sauts de ligne internes), juste
      // débarassé du whitespace de bord pour éviter d'enregistrer des lignes
      // vides parasites.
      await onSave(draft.trim());
      setIsEditing(false);
    } catch (err) {
      const message =
        err instanceof Error && err.message ? err.message : genericErrorMessage;
      setDraft(initialValue);
      setIsEditing(false);
      onError?.(message);
    } finally {
      setIsSaving(false);
    }
  }, [draft, initialValue, onSave, onError, genericErrorMessage]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setDraft(initialValue);
    setIsEditing(false);
  }, [initialValue]);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancel();
      }
      // Enter intentionnellement non géré → saut de ligne natif.
    },
    [cancel],
  );

  const handleBlur = useCallback(() => {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      return;
    }
    if (savingViaButtonRef.current) {
      // Le clic bouton va déclencher commit() lui-même, on ne double-commit pas.
      return;
    }
    void commit();
  }, [commit]);

  const handleSaveClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      // Empêche le textarea de perdre le focus (et donc de déclencher onBlur
      // avant qu'on ait pu lire le draft courant).
      event.preventDefault();
      savingViaButtonRef.current = true;
      void commit();
    },
    [commit],
  );

  const handleSaveMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      // Le mousedown sur le bouton retire le focus du textarea avant le click ;
      // preventDefault l'en empêche.
      event.preventDefault();
    },
    [],
  );

  const handleDisplayKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLParagraphElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        enterEdit();
      }
    },
    [enterEdit],
  );

  if (isEditing) {
    return (
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={draft}
          disabled={isSaving}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          aria-label={ariaLabel}
          aria-busy={isSaving ? "true" : undefined}
          data-testid="inline-paragraph-textarea"
          data-section-key={sectionKey}
          placeholder={placeholder}
          rows={1}
          className={[
            className ?? "",
            "block w-full bg-white/10 border-0 outline-none rounded px-2 py-1 -mx-2 -my-1",
            "ring-1 ring-cyan-400/40 focus:ring-cyan-400/70",
            "resize-none overflow-hidden",
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
        <button
          type="button"
          onMouseDown={handleSaveMouseDown}
          onClick={handleSaveClick}
          disabled={isSaving}
          aria-label={saveLabel}
          data-testid="inline-paragraph-save"
          className="absolute right-0 -bottom-7 text-[10px] uppercase tracking-wider text-cyan-300 hover:text-cyan-100 px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm"
        >
          {saveLabel}
        </button>
      </div>
    );
  }

  return (
    <p
      role="button"
      tabIndex={0}
      onClick={enterEdit}
      onKeyDown={handleDisplayKeyDown}
      aria-label={ariaLabel}
      data-testid="inline-paragraph-display"
      data-section-key={sectionKey}
      className={[
        className ?? "",
        "cursor-text hover:bg-white/5 focus:bg-white/10 focus:outline-none",
        "rounded px-2 -mx-2 transition-colors whitespace-pre-line",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {initialValue || placeholder}
    </p>
  );
}
