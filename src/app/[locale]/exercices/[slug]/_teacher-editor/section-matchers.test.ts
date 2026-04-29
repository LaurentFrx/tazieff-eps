// Sprint E.3 (28 avril 2026) — couverture des matchers de titre de section
// utilisés par l'édition inline (Resume / Execution / Respiration / Conseils
// / Securite / Dosage).
//
// Le matcher `dosage` est un ajout du sprint : il doit reconnaître la
// variante FR/EN ("Dosage") et la variante ES ("Dosificación", avec ou sans
// accent), tout en restant strict sur les sections homonymes.

import { describe, it, expect } from "vitest";

import {
  SECTION_TITLE_MATCHERS,
  type InlineParagraphKey,
} from "./section-matchers";

describe("SECTION_TITLE_MATCHERS", () => {
  it("expose les 6 clés attendues (resume, respiration, securite, execution, conseils, dosage)", () => {
    const keys = Object.keys(SECTION_TITLE_MATCHERS).sort();
    expect(keys).toEqual(
      [
        "conseils",
        "dosage",
        "execution",
        "respiration",
        "resume",
        "securite",
      ].sort(),
    );
  });

  it("dosage reconnaît la version française 'Dosage'", () => {
    expect(SECTION_TITLE_MATCHERS.dosage.test("Dosage")).toBe(true);
    expect(SECTION_TITLE_MATCHERS.dosage.test("dosage")).toBe(true);
    expect(SECTION_TITLE_MATCHERS.dosage.test("DOSAGE")).toBe(true);
  });

  it("dosage reconnaît la version espagnole avec accent 'Dosificación'", () => {
    expect(SECTION_TITLE_MATCHERS.dosage.test("Dosificación")).toBe(true);
    expect(SECTION_TITLE_MATCHERS.dosage.test("dosificación")).toBe(true);
  });

  it("dosage tolère la version espagnole sans accent 'Dosificacion'", () => {
    expect(SECTION_TITLE_MATCHERS.dosage.test("Dosificacion")).toBe(true);
  });

  it("dosage rejette les titres voisins (Doses, Dose, Dosé)", () => {
    expect(SECTION_TITLE_MATCHERS.dosage.test("Doses")).toBe(false);
    expect(SECTION_TITLE_MATCHERS.dosage.test("Dose")).toBe(false);
    expect(SECTION_TITLE_MATCHERS.dosage.test("Dosé")).toBe(false);
    expect(SECTION_TITLE_MATCHERS.dosage.test("Dosage Recommandé")).toBe(false);
  });

  it("resume reconnaît FR avec et sans accent", () => {
    expect(SECTION_TITLE_MATCHERS.resume.test("Résumé")).toBe(true);
    expect(SECTION_TITLE_MATCHERS.resume.test("Resume")).toBe(true);
    expect(SECTION_TITLE_MATCHERS.resume.test("RÉSUMÉ")).toBe(true);
  });

  it("conseils reconnaît singulier et pluriel", () => {
    expect(SECTION_TITLE_MATCHERS.conseils.test("Conseil")).toBe(true);
    expect(SECTION_TITLE_MATCHERS.conseils.test("Conseils")).toBe(true);
  });

  it("securite tolère l'absence d'accents", () => {
    expect(SECTION_TITLE_MATCHERS.securite.test("Sécurité")).toBe(true);
    expect(SECTION_TITLE_MATCHERS.securite.test("Securite")).toBe(true);
  });

  it("aucun matcher ne fait de match partiel sur le contenu de la section", () => {
    // Cf. comportement attendu : le matcher s'applique au titre brut tronqué
    // (`section.title.trim()`), pas à des phrases en cours de paragraphe.
    const allKeys: InlineParagraphKey[] = [
      "resume",
      "respiration",
      "securite",
      "execution",
      "conseils",
      "dosage",
    ];
    for (const key of allKeys) {
      expect(
        SECTION_TITLE_MATCHERS[key].test(
          "Voici quelques notes générales avant la section",
        ),
      ).toBe(false);
    }
  });
});
