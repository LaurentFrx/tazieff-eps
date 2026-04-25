// Phase E.2.3.4 — Schémas Zod pour les routes /api/teacher/classes.

import { z } from "zod";

const UUID_LOOSE_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuid = () =>
  z.string().regex(UUID_LOOSE_RE, { message: "UUID invalide" });

// Niveaux proposés dans l'UI (select). Le champ DB `school_year` reste
// libre (text) pour laisser la place à des cas non prévus (BTS, CAP…).
export const CLASS_LEVELS = [
  "Seconde",
  "Première",
  "Terminale",
  "Autre",
] as const;

export const CreateClassSchema = z
  .object({
    organization_id: uuid(),
    name: z.string().min(1, "Nom requis").max(100),
    // Normalise la string vide en undefined pour simplifier la logique côté
    // API (school_year ?? null à l'insert).
    school_year: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.string().max(50).optional(),
    ),
  })
  .strict();

export type CreateClassInput = z.infer<typeof CreateClassSchema>;
