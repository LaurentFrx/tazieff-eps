// Phase E.2.3.3 — Utilitaires d'affichage pour l'espace prof.
//
// Extraction du prénom depuis une adresse académique. Une adresse de la
// forme `prenom.nom@ac-academie.fr` est décomposée en `Prenom`.
// Si le format ne colle pas, on fallback sur la partie locale avec une
// majuscule initiale.

export function teacherFirstNameFromEmail(email: string | null | undefined): string {
  if (!email) return "";
  const local = email.split("@")[0] ?? "";
  if (!local) return "";
  const first = local.split(".")[0] ?? local;
  if (!first) return "";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

// Ordre de priorité pour les liens de navigation prof. Ce tableau est
// la source de vérité utilisée par TeacherHeader.
export const TEACHER_NAV = [
  { href: "/tableau-de-bord", label: "Tableau de bord" },
  { href: "/mes-classes", label: "Mes classes" },
  { href: "/mes-annotations", label: "Mes annotations" },
  { href: "/exercices", label: "Exercices" },
] as const;

export type TeacherNavItem = (typeof TEACHER_NAV)[number];
