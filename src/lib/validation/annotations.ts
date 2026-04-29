// Phase E.2.2 — Schémas Zod pour l'API annotations prof.
//
// Couvre :
//   - Le body d'INSERT (POST /api/teacher/annotations)
//   - Le body de PATCH (PATCH /api/teacher/annotations/[id])
//   - Le sous-type `content` (jsonb libre mais borné)
//
// Règle métier critique : cohérence visibility_scope ↔ scope_id.
//   - scope='class'   → scope_id OBLIGATOIRE (c'est l'UUID de la classe)
//   - scope='private' → scope_id INTERDIT
//   - scope='school'  → scope_id INTERDIT
// Cette règle est doublement vérifiée : côté Zod (ici) ET côté DB (constraint
// `scope_id_coherent` sur la table — cf. migration E.2.1).

import { z } from "zod";

// Regex UUID générique (36 chars hex + dashes) — accepte toute forme valide
// côté Postgres, y compris nos UUIDs seed non RFC-4122-stricts
// (`00000000-0000-0000-0001-*`). Zod v4 strict refuserait ces formes.
const UUID_LOOSE_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuid = () =>
  z.string().regex(UUID_LOOSE_RE, { message: "UUID invalide" });

/**
 * Sprint E.4 — Cibles de section pour ancrer une annotation à un paragraphe
 * précis de la fiche exercice. Aligné sur InlineParagraphKey du composant
 * d'édition admin (cf. _teacher-editor/section-matchers.ts) plus la valeur
 * spéciale `general` (annotation à la fiche entière, fallback).
 */
export const ANNOTATION_SECTION_TARGETS = [
  "general",
  "resume",
  "execution",
  "respiration",
  "conseils",
  "securite",
  "dosage",
] as const;

export type AnnotationSectionTarget = (typeof ANNOTATION_SECTION_TARGETS)[number];

const sectionTargetSchema = z.enum(ANNOTATION_SECTION_TARGETS);

/**
 * Forme du champ `content` (jsonb). On accepte title/notes/media_refs en
 * option et on refuse tout autre champ (`strict`) pour cadrer l'évolution
 * du modèle. E.2.3 pourra étendre.
 */
export const AnnotationContentSchema = z
  .object({
    title: z.string().max(200).optional(),
    notes: z.string().max(5000).optional(),
    media_refs: z.array(uuid()).max(10).optional(),
  })
  .strict();

export const CreateAnnotationSchema = z
  .object({
    organization_id: uuid(),
    exercise_slug: z.string().min(1).max(100),
    locale: z.enum(["fr", "en", "es"]).default("fr"),
    exercise_version: z.number().int().positive().nullable().optional(),
    content: AnnotationContentSchema,
    visibility_scope: z
      .enum(["private", "class", "school"])
      .default("private"),
    scope_id: uuid().nullable().optional(),
    /**
     * Sprint E.4 — Section cible (paragraphe) sur lequel l'annotation est
     * ancrée. Optionnel : NULL signifie « annotation générale » (équivaut
     * à `general` côté UI). Permet l'affichage côté élève juste après le
     * paragraphe officiel correspondant (pattern post-it Google Docs).
     */
    section_target: sectionTargetSchema.nullable().optional(),
  })
  .refine(
    (data) =>
      data.visibility_scope === "class"
        ? typeof data.scope_id === "string" && data.scope_id.length > 0
        : data.scope_id == null,
    {
      message:
        "scope_id est requis si visibility_scope='class', et doit être null/absent sinon.",
      path: ["scope_id"],
    },
  );

/**
 * PATCH : sous-ensemble modifiable. On interdit la modification des champs
 * immuables (organization_id, exercise_slug, locale) : pour "déplacer" une
 * annotation entre exercices, l'application en crée une nouvelle et
 * soft-delete l'ancienne.
 */
export const UpdateAnnotationSchema = z
  .object({
    exercise_version: z.number().int().positive().nullable().optional(),
    content: AnnotationContentSchema.optional(),
    visibility_scope: z.enum(["private", "class", "school"]).optional(),
    scope_id: uuid().nullable().optional(),
    needs_review: z.boolean().optional(),
    /** Sprint E.4 — éditable a posteriori pour réancrer l'annotation. */
    section_target: sectionTargetSchema.nullable().optional(),
  })
  .refine(
    (data) => {
      // Si on change le scope vers 'class', scope_id doit être défini.
      // Si on change vers 'private'/'school', scope_id doit être null/absent.
      // Si on ne change pas le scope, aucune contrainte locale (la DB vérifiera).
      if (!data.visibility_scope) return true;
      return data.visibility_scope === "class"
        ? typeof data.scope_id === "string" && data.scope_id.length > 0
        : data.scope_id == null;
    },
    {
      message:
        "Si visibility_scope est fourni et = 'class', scope_id requis. Sinon interdit.",
      path: ["scope_id"],
    },
  );

export type AnnotationContent = z.infer<typeof AnnotationContentSchema>;
export type CreateAnnotationInput = z.infer<typeof CreateAnnotationSchema>;
export type UpdateAnnotationInput = z.infer<typeof UpdateAnnotationSchema>;
