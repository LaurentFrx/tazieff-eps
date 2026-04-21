/**
 * Academic email validation for French education system.
 *
 * Accepted patterns (étendus Phase E.2.2 pour couvrir DOM-TOM hors .fr) :
 * - @ac-XXXX.fr       : 30+ académies métropolitaines + ultramarines (Guadeloupe,
 *                        Guyane, Martinique, Mayotte, Réunion)
 * - @education.gouv.fr : personnels ministériels
 * - @*.education.fr    : sous-domaines éducation nationale
 * - @ac-polynesie.pf   : Vice-rectorat Polynésie française
 * - @ac-noumea.nc      : Vice-rectorat Nouvelle-Calédonie
 * - @ac-wf.wf          : Vice-rectorat Wallis-et-Futuna
 *
 * Ne traite que la validation domaine : ne vérifie pas l'existence de l'email
 * (c'est le rôle de Supabase magic link côté serveur).
 */

// Métropole + ultramarins en .fr (rectorats standards)
const AC_FR_REGEX = /@ac-[a-z-]+\.fr$/i;
// Ministère
const EDUCATION_GOUV = /@education\.gouv\.fr$/i;
// Sous-domaines édu (ex: @bordeaux.education.fr, @paris.education.fr)
const EDUCATION_SUBDOMAIN = /@[a-z-]+\.education\.fr$/i;
// Vice-rectorats Outre-mer (domaines nationaux différents de .fr)
const AC_POLYNESIE = /@ac-polynesie\.pf$/i;
const AC_NOUMEA = /@ac-noumea\.nc$/i;
const AC_WALLIS_FUTUNA = /@ac-wf\.wf$/i;

const PATTERNS: readonly RegExp[] = [
  AC_FR_REGEX,
  EDUCATION_GOUV,
  EDUCATION_SUBDOMAIN,
  AC_POLYNESIE,
  AC_NOUMEA,
  AC_WALLIS_FUTUNA,
];

/**
 * Vérifie si l'email fourni appartient à un domaine académique reconnu.
 * Tolère les espaces de padding et la casse. Refuse les entrées vides ou
 * les inputs non-string (null/undefined → false).
 */
export function isAcademicEmail(email: string | null | undefined): boolean {
  if (typeof email !== "string") return false;
  const trimmed = email.trim();
  if (!trimmed || !trimmed.includes("@")) return false;
  return PATTERNS.some((regex) => regex.test(trimmed));
}

/**
 * Extrait le domaine académique d'un email (ex: "ac-bordeaux.fr"), utilisable
 * pour pré-remplir `organizations.academic_domain` lors de la création d'un
 * établissement. Retourne null si le domaine n'est pas reconnu.
 *
 * Exemples :
 *   extractAcademyFromEmail("prof@ac-bordeaux.fr")       → "ac-bordeaux.fr"
 *   extractAcademyFromEmail("prof@ac-polynesie.pf")      → "ac-polynesie.pf"
 *   extractAcademyFromEmail("prof@education.gouv.fr")    → "education.gouv.fr"
 *   extractAcademyFromEmail("prof@bordeaux.education.fr")→ "bordeaux.education.fr"
 *   extractAcademyFromEmail("prof@gmail.com")            → null
 */
export function extractAcademyFromEmail(
  email: string | null | undefined,
): string | null {
  if (!isAcademicEmail(email)) return null;
  // Safe : isAcademicEmail a validé la forme. On extrait la partie après @.
  const trimmed = (email as string).trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf("@");
  if (atIndex === -1) return null;
  return trimmed.slice(atIndex + 1);
}

export const ACADEMIC_EMAIL_PATTERN = "nom.prenom@ac-academie.fr";
