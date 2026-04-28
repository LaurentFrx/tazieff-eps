// Sprint P0.7-octies — Tests de buildLocalePath (LanguageSwitcher).
//
// Le selecteur de langue construit un href via buildLocalePath. Avant
// P0.7-octies, fr ne préfixait PAS le path → /reglages au lieu de /fr/reglages
// → 404 sur le miroir admin. Le fix préfixe TOUJOURS, y compris fr.

import { describe, it, expect } from "vitest";
import { buildLocalePath } from "@/lib/i18n/locale-path";

describe("buildLocalePath — matrice ES/EN/FR", () => {
  it("ES → FR : /es/reglages → /fr/reglages (fix P0.7-octies)", () => {
    expect(buildLocalePath("/es/reglages", "fr")).toBe("/fr/reglages");
  });

  it("EN → FR : /en/reglages → /fr/reglages", () => {
    expect(buildLocalePath("/en/reglages", "fr")).toBe("/fr/reglages");
  });

  it("FR → EN : /fr/reglages → /en/reglages", () => {
    expect(buildLocalePath("/fr/reglages", "en")).toBe("/en/reglages");
  });

  it("FR → ES : /fr/reglages → /es/reglages", () => {
    expect(buildLocalePath("/fr/reglages", "es")).toBe("/es/reglages");
  });

  it("/fr → /en (locale racine)", () => {
    expect(buildLocalePath("/fr", "en")).toBe("/en");
  });

  it("/fr → /fr (idempotent)", () => {
    expect(buildLocalePath("/fr", "fr")).toBe("/fr");
  });

  it("/ → /fr (path racine, locale fr)", () => {
    expect(buildLocalePath("/", "fr")).toBe("/fr");
  });

  it("/ → /en (path racine, locale en)", () => {
    expect(buildLocalePath("/", "en")).toBe("/en");
  });

  it("/fr/exercices/s1-01 → /es/exercices/s1-01 (slug profond préservé)", () => {
    expect(buildLocalePath("/fr/exercices/s1-01", "es")).toBe(
      "/es/exercices/s1-01",
    );
  });

  it("path sans préfixe locale → préfixé (cas legacy élève)", () => {
    // Avant P0.7-octies, "/reglages" → "/reglages" pour fr (pas de préfixe).
    // Après : préfixe systématique pour cohérence avec LocaleLink + miroir admin.
    expect(buildLocalePath("/reglages", "fr")).toBe("/fr/reglages");
  });
});
