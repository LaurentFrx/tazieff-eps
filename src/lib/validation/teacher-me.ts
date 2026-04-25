// Phase E.2.3.1 — Schémas Zod pour les routes /api/teacher/me/*.
//
// Le serveur normalise les réponses dans un contrat stable pour le front
// (l'ordre des champs et les types sont garantis). Les schémas servent
// aussi à la validation et peuvent être réutilisés côté client si besoin
// (React Query, tests, etc.).

import { z } from "zod";

// UUID loose (accepte nos seeds non-RFC-4122 comme `00000000-0000-0000-0001-*`)
// Pattern aligné sur src/lib/validation/annotations.ts.
const UUID_LOOSE_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuid = () =>
  z.string().regex(UUID_LOOSE_RE, { message: "UUID invalide" });

export const MembershipItemSchema = z.object({
  org_id: uuid(),
  org_name: z.string(),
  org_type: z.string().nullable(),
  role: z.string(),
  joined_at: z.string().nullable(),
});

export const MembershipsResponseSchema = z.object({
  memberships: z.array(MembershipItemSchema),
});

export const TeacherClassItemSchema = z.object({
  id: uuid(),
  name: z.string(),
  level: z.string().nullable(),
  org_id: uuid(),
  org_name: z.string(),
  code: z.string(),
  // Supabase renvoie les COUNT en number, on tolère les entiers zéro
  // et positifs.
  students_count: z.number().int().min(0),
  created_at: z.string().nullable(),
});

export const TeacherClassesResponseSchema = z.object({
  classes: z.array(TeacherClassItemSchema),
});

export type MembershipItem = z.infer<typeof MembershipItemSchema>;
export type MembershipsResponse = z.infer<typeof MembershipsResponseSchema>;
export type TeacherClassItem = z.infer<typeof TeacherClassItemSchema>;
export type TeacherClassesResponse = z.infer<
  typeof TeacherClassesResponseSchema
>;
