// Phase E.2.2 — Tests exhaustifs pour isAcademicEmail + extractAcademyFromEmail.
// Objectif : couverture ~33 cas (15+ positifs académiques, 10+ négatifs, 5+ extract).

import { describe, it, expect } from "vitest";
import {
  isAcademicEmail,
  extractAcademyFromEmail,
  ACADEMIC_EMAIL_PATTERN,
} from "@/lib/auth/academic-domains";

describe("isAcademicEmail — cas positifs (.fr)", () => {
  const ACADEMIES_FR = [
    "aix-marseille",
    "amiens",
    "besancon",
    "bordeaux",
    "caen",
    "clermont",
    "corse",
    "creteil",
    "dijon",
    "grenoble",
    "guadeloupe",
    "guyane",
    "lille",
    "limoges",
    "lyon",
    "martinique",
    "mayotte",
    "montpellier",
    "nancy-metz",
    "nantes",
    "nice",
    "normandie",
    "orleans-tours",
    "paris",
    "poitiers",
    "reims",
    "rennes",
    "reunion",
    "rouen",
    "strasbourg",
    "toulouse",
    "versailles",
  ];

  for (const academy of ACADEMIES_FR) {
    it(`accepte prof.dupont@ac-${academy}.fr`, () => {
      expect(isAcademicEmail(`prof.dupont@ac-${academy}.fr`)).toBe(true);
    });
  }
});

describe("isAcademicEmail — cas positifs (ministère + sous-domaines + DOM-TOM hors .fr)", () => {
  it.each([
    ["prof@education.gouv.fr"],
    ["agent.ministere@education.gouv.fr"],
    ["formateur@bordeaux.education.fr"],
    ["prof@paris.education.fr"],
    ["vicerectorat@ac-polynesie.pf"],
    ["fonctionnaire@ac-noumea.nc"],
    ["agent@ac-wf.wf"],
  ])("accepte %s", (email) => {
    expect(isAcademicEmail(email)).toBe(true);
  });
});

describe("isAcademicEmail — tolérances (casse, padding)", () => {
  it("accepte majuscules mixtes", () => {
    expect(isAcademicEmail("Prof.Dupont@AC-BORDEAUX.FR")).toBe(true);
  });
  it("trim les espaces", () => {
    expect(isAcademicEmail("   prof@ac-paris.fr   ")).toBe(true);
  });
  it("accepte '@ac-TETEE.fr' avec casse mélangée", () => {
    expect(isAcademicEmail("agent@Ac-Polynesie.PF")).toBe(true);
  });
});

describe("isAcademicEmail — cas négatifs", () => {
  it.each([
    ["gmail classique", "prof@gmail.com"],
    ["outlook", "jean@outlook.fr"],
    ["yahoo", "jean@yahoo.fr"],
    ["typo ac- manquant", "prof@bordeaux.fr"],
    ["underscore invalide", "prof@ac_bordeaux.fr"],
    ["TLD non autorisé", "prof@ac-bordeaux.com"],
    ["point au mauvais endroit", "prof@ac.bordeaux.fr"],
    ["sans @", "prof.ac-bordeaux.fr"],
    ["vide", ""],
    ["espaces seuls", "   "],
    ["education sans gouv", "prof@education.fr"],
    ["préfixe trompeur", "prof@fake-ac-bordeaux.fr"],
    ["suffixe trompeur", "prof@ac-bordeaux.fr.evil.com"],
    ["typo académie imaginaire avec chiffre", "prof@ac-bordeaux2.fr"],
  ])("rejette %s (%s)", (_label, email) => {
    expect(isAcademicEmail(email)).toBe(false);
  });

  it("rejette null", () => {
    expect(isAcademicEmail(null)).toBe(false);
  });
  it("rejette undefined", () => {
    expect(isAcademicEmail(undefined)).toBe(false);
  });
  it("rejette un number cast en any", () => {
    expect(isAcademicEmail(42 as unknown as string)).toBe(false);
  });
});

describe("extractAcademyFromEmail", () => {
  it.each([
    ["prof.dupont@ac-bordeaux.fr", "ac-bordeaux.fr"],
    ["AGENT@AC-PARIS.FR", "ac-paris.fr"],
    ["  prof@ac-versailles.fr  ", "ac-versailles.fr"],
    ["ministere@education.gouv.fr", "education.gouv.fr"],
    ["formateur@bordeaux.education.fr", "bordeaux.education.fr"],
    ["vicerectorat@ac-polynesie.pf", "ac-polynesie.pf"],
    ["agent@ac-noumea.nc", "ac-noumea.nc"],
    ["prof@ac-wf.wf", "ac-wf.wf"],
  ])("extrait '%s' → '%s'", (input, expected) => {
    expect(extractAcademyFromEmail(input)).toBe(expected);
  });

  it.each([
    ["prof@gmail.com"],
    ["prof@ac.bordeaux.fr"],
    [""],
    [null],
    [undefined],
  ])("retourne null pour '%s' (non-académique)", (input) => {
    expect(extractAcademyFromEmail(input as string | null | undefined)).toBeNull();
  });
});

describe("ACADEMIC_EMAIL_PATTERN", () => {
  it("reste une constante stable (utilisée dans UI placeholder)", () => {
    expect(ACADEMIC_EMAIL_PATTERN).toBe("nom.prenom@ac-academie.fr");
  });
});
