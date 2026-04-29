// Sprint E.3 (28 avril 2026) — clés logiques + matchers de section pour
// l'édition inline des paragraphes/listes dans ExerciseLiveDetail.
//
// Module isolé pour faciliter les tests unitaires : les regex peuvent être
// validées indépendamment de l'arbre React. ExerciseLiveDetail.tsx importe
// ces constantes plutôt que de les redéfinir localement.

export type InlineParagraphKey =
  | "resume"
  | "respiration"
  | "securite"
  | "execution"
  | "conseils"
  | "dosage";

/**
 * Matchers de titres de section (insensibles à la casse, accents tolérés).
 * Le matcher `dosage` reconnaît FR/EN ("Dosage") et ES ("Dosificación").
 * Les autres clés acceptent l'orthographe exacte FR avec accents optionnels
 * (Résumé/Resume, Sécurité/Securite, Exécution/Execution, Conseils/Conseil).
 */
export const SECTION_TITLE_MATCHERS: Record<InlineParagraphKey, RegExp> = {
  resume: /^r[eé]sum[eé]$/i,
  respiration: /^respiration$/i,
  securite: /^s[eé]curit[eé]$/i,
  execution: /^ex[eé]cution$/i,
  conseils: /^conseils?$/i,
  dosage: /^(dosage|dosificaci[oó]n)$/i,
};
