/**
 * Academic email validation for French education system.
 *
 * Accepted patterns:
 * - @ac-XXXX.fr (31 metropolitan + overseas academies)
 * - @education.gouv.fr
 * - @*.education.fr (sub-domains)
 */

const AC_REGEX = /@ac-[a-z-]+\.fr$/i;
const EDUCATION_GOUV = /@education\.gouv\.fr$/i;
const EDUCATION_SUBDOMAIN = /@[a-z-]+\.education\.fr$/i;

export function isAcademicEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed || !trimmed.includes("@")) return false;
  return (
    AC_REGEX.test(trimmed) ||
    EDUCATION_GOUV.test(trimmed) ||
    EDUCATION_SUBDOMAIN.test(trimmed)
  );
}

export const ACADEMIC_EMAIL_PATTERN = "nom.prenom@ac-academie.fr";
