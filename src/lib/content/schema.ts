import { z } from "zod";

export const DifficultySchema = z.enum(["debutant", "intermediaire", "avance"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

const themeValue = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const ExerciseFrontmatterSchema = z.object({
  title: z.string().min(1, "Le titre est requis."),
  slug: z.string().min(1, "Le slug est requis."),
  tags: z.array(z.string().min(1, "Tag invalide.")).min(1, "Ajoutez au moins un tag."),
  level: DifficultySchema.optional(),
  themeCompatibility: z
    .array(themeValue)
    .min(1, "Indiquez au moins un thème compatible."),
  muscles: z
    .array(z.string().min(1, "Muscle invalide."))
    .min(1, "Ajoutez au moins un muscle."),
  equipment: z.array(z.string().min(1, "Matériel invalide.")).optional(),
  media: z.string().min(1, "Lien média invalide.").optional(),
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

export const CategorieMethodeSchema = z.enum([
  "endurance-de-force",
  "gain-de-volume",
  "gain-de-puissance",
]);
export type CategorieMethode = z.infer<typeof CategorieMethodeSchema>;

export const NiveauMethodeSchema = z.enum(["seconde", "premiere", "terminale"]);
export type NiveauMethode = z.infer<typeof NiveauMethodeSchema>;

export const MethodeFrontmatterSchema = z.object({
  slug: z.string().min(1),
  titre: z.string().min(1),
  soustitre: z.string().optional(),
  categorie: CategorieMethodeSchema,
  niveau_minimum: NiveauMethodeSchema,
  description: z.string().min(1),
  scores: z.object({
    endurance: z.number().int().min(1).max(5),
    hypertrophie: z.number().int().min(1).max(5),
    force: z.number().int().min(1).max(5),
    puissance: z.number().int().min(1).max(5),
  }),
  parametres: z.object({
    series: z.string(),
    repetitions: z.string(),
    intensite: z.string(),
    recuperation: z.string(),
    duree: z.string().optional(),
  }),
  exercices_compatibles: z.array(z.string()),
  methodes_complementaires: z.array(z.string()),
  timer: z.boolean().optional(),
});
export type MethodeFrontmatter = z.infer<typeof MethodeFrontmatterSchema>;

export const NiveauLearnSchema = z.enum(["seconde", "premiere", "terminale"]);
export type NiveauLearn = z.infer<typeof NiveauLearnSchema>;

export const LearnFrontmatterSchema = z.object({
  slug: z.string().min(1),
  titre: z.string().min(1),
  section: z.literal("apprendre"),
  ordre: z.number().int().min(1),
  niveau_minimum: NiveauLearnSchema,
  description: z.string().min(1),
  mots_cles: z.array(z.string()),
});
export type LearnFrontmatter = z.infer<typeof LearnFrontmatterSchema>;
