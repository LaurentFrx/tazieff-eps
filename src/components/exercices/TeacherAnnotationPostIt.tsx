// Sprint E.4 (29 avril 2026) — Composant post-it pour afficher une
// annotation prof côté élève.
//
// Conformité GOUVERNANCE_EDITORIALE.md v1.1 §3.2 (pattern post-it Google
// Docs avec attribution explicite) :
//   - Encadré visuellement distinct : bordure latérale orange Tazieff
//     (4px), fond légèrement teinté (orange 8% opacité), padding,
//     coin arrondi.
//   - En-tête : icône crayon + nom du prof affiché.
//   - Corps : contenu textuel en italique (préserve la couleur standard
//     pour rester lisible). Markdown léger non rendu — on affiche le
//     texte brut pour rester safe (pas d'XSS via injection markdown
//     dans une fiche élève).
//   - Position : juste après le paragraphe officiel correspondant, jamais
//     en remplacement (la fiche officielle reste intégrale).
//
// Le scope `private` ne devrait jamais arriver côté élève (RLS filtre),
// mais en défense en profondeur on n'affiche pas le contenu si le scope
// est `private` (le composant retourne null).

"use client";

import type { ReactElement } from "react";

export type AnnotationScope = "private" | "class" | "school";

export type AnnotationContentShape = {
  title?: string | null;
  notes?: string | null;
};

export type TeacherAnnotationPostItProps = {
  /** Identifiant de l'annotation (utile pour le data-testid + key React). */
  id: string;
  /** Contenu jsonb tel que stocké en BD ({ title?, notes? }). */
  content: AnnotationContentShape;
  /**
   * Nom d'affichage choisi par le prof. Si vide ou null → fallback
   * "Ton prof" (cf. /api/exercises/[slug]/annotations qui sait calculer
   * ce fallback côté serveur, mais on le re-applique ici par sécurité).
   */
  authorDisplayName: string | null | undefined;
  /** Portée de l'annotation. `private` ne s'affiche jamais côté élève. */
  scope: AnnotationScope;
  /** Cible de section (utile au data-attribut de debug, pas affiché). */
  sectionTarget?: string | null;
};

const FALLBACK_DISPLAY_NAME = "Ton prof";

export default function TeacherAnnotationPostIt({
  id,
  content,
  authorDisplayName,
  scope,
  sectionTarget,
}: TeacherAnnotationPostItProps): ReactElement | null {
  // Défense en profondeur — un scope private ne devrait jamais transiter
  // côté élève (RLS le filtre), mais si jamais, on n'affiche rien.
  if (scope === "private") {
    return null;
  }

  const title = content.title?.trim() ?? "";
  const notes = content.notes?.trim() ?? "";
  if (!title && !notes) {
    return null;
  }

  const displayName =
    authorDisplayName && authorDisplayName.trim().length > 0
      ? authorDisplayName.trim()
      : FALLBACK_DISPLAY_NAME;

  return (
    <aside
      role="note"
      data-testid="teacher-annotation-post-it"
      data-annotation-id={id}
      data-annotation-scope={scope}
      data-annotation-section-target={sectionTarget ?? "general"}
      className="my-3 rounded-r-xl px-4 py-3"
      style={{
        // Bordure latérale orange Tazieff (4px), fond teinté.
        borderLeft: "4px solid #FF8C00",
        background: "rgba(255, 140, 0, 0.08)",
      }}
    >
      <header
        className="flex items-center gap-2 mb-1"
        style={{
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(255, 140, 0, 0.85)",
          fontWeight: 600,
        }}
      >
        {/* Icône crayon (inline SVG, pas de dépendance) */}
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
        <span data-testid="teacher-annotation-author">{displayName}</span>
      </header>

      {title ? (
        <p
          className="font-semibold mb-1"
          style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.95)" }}
        >
          {title}
        </p>
      ) : null}

      {notes ? (
        <p
          className="italic leading-relaxed whitespace-pre-line"
          style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.85)" }}
        >
          {notes}
        </p>
      ) : null}
    </aside>
  );
}
