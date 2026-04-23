// Phase E.2.3.3 — Tests de teacherFirstNameFromEmail.

import { describe, it, expect } from "vitest";
import { teacherFirstNameFromEmail, TEACHER_NAV } from "@/lib/teacher/display";

describe("teacherFirstNameFromEmail", () => {
  it("extrait le prénom d'une adresse prenom.nom@academie.fr", () => {
    expect(teacherFirstNameFromEmail("jean.dupont@ac-bordeaux.fr")).toBe("Jean");
  });

  it("capitalise correctement (prenom tout minuscule → Prenom)", () => {
    expect(teacherFirstNameFromEmail("marie.curie@ac-paris.fr")).toBe("Marie");
  });

  it("met en minuscules le reste du prénom (même si MAJ dans l'email)", () => {
    expect(teacherFirstNameFromEmail("JEAN.DUPONT@ac-lyon.fr")).toBe("Jean");
  });

  it("fallback sur la partie locale si pas de point", () => {
    expect(teacherFirstNameFromEmail("admin@ac-paris.fr")).toBe("Admin");
  });

  it("chaîne vide si null", () => {
    expect(teacherFirstNameFromEmail(null)).toBe("");
  });

  it("chaîne vide si undefined", () => {
    expect(teacherFirstNameFromEmail(undefined)).toBe("");
  });

  it("chaîne vide si email vide", () => {
    expect(teacherFirstNameFromEmail("")).toBe("");
  });

  it("chaîne vide si @ en tête (local vide)", () => {
    expect(teacherFirstNameFromEmail("@ac-paris.fr")).toBe("");
  });
});

describe("TEACHER_NAV", () => {
  it("contient les 4 liens principaux dans l'ordre attendu", () => {
    const hrefs = TEACHER_NAV.map((item) => item.href);
    expect(hrefs).toEqual([
      "/tableau-de-bord",
      "/mes-classes",
      "/mes-annotations",
      "/exercices",
    ]);
  });
});
