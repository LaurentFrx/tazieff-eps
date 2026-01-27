import { z } from "zod";

export const DifficultySchema = z.enum(["debutant", "intermediaire", "avance"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const ExerciseLevelSchema = z.union([
  DifficultySchema,
  z.number().int().min(1).max(3),
]);
export type ExerciseLevel = z.infer<typeof ExerciseLevelSchema>;

const SessionIdSchema = z.enum(["s1", "s2", "s3", "s4", "s5"]);
const ThemeSchema = z.enum(["t1", "t2", "t3"]);

const ExerciseMediaSchema = z.object({
  hero: z.string().min(1, "Lien média hero invalide."),
  thumb: z.string().min(1, "Lien média vignette invalide."),
});

const ExerciseSourceSchema = z.object({
  legacy: z.string().min(1, "Source legacy requise."),
  legacyRef: z.string().min(1, "Référence legacy requise."),
});

export const ExerciseFrontmatterSchema = z.object({
  title: z.string().min(1, "Le titre est requis."),
  slug: z.string().min(1, "Le slug est requis."),
  sessionId: SessionIdSchema,
  sessionTitle: z.string().min(1, "Le titre de séance est requis."),
  musclesPrimary: z
    .array(z.string().min(1, "Muscle invalide."))
    .min(1, "Ajoutez au moins un muscle principal."),
  musclesSecondary: z.array(z.string().min(1, "Muscle invalide.")).optional(),
  equipment: z.array(z.string().min(1, "Matériel invalide.")).optional(),
  level: ExerciseLevelSchema.optional(),
  themes: z.array(ThemeSchema).min(1, "Indiquez au moins un thème."),
  media: ExerciseMediaSchema,
  source: ExerciseSourceSchema,
});

export type ExerciseFrontmatter = z.infer<typeof ExerciseFrontmatterSchema>;

export const SeanceBlockSchema = z.object({
  exoSlug: z.string().min(1, "Le slug d'exercice est requis."),
  sets: z.number().int().positive().optional(),
  reps: z.union([z.number().int().positive(), z.string().min(1)]).optional(),
  restSec: z.number().int().positive().optional(),
});

export type SeanceBlock = z.infer<typeof SeanceBlockSchema>;

export const SeanceFrontmatterSchema = z.object({
  title: z.string().min(1, "Le titre est requis."),
  slug: z.string().min(1, "Le slug est requis."),
  durationMin: z.number().int().positive("Durée invalide."),
  level: DifficultySchema.optional(),
  tags: z.array(z.string().min(1, "Tag invalide.")).min(1, "Ajoutez au moins un tag."),
  blocks: z.array(SeanceBlockSchema).min(1, "Ajoutez au moins un bloc."),
});

export type SeanceFrontmatter = z.infer<typeof SeanceFrontmatterSchema>;
