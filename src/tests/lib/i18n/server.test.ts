// Sprint A5 — Tests de getServerLang() (helper i18n côté serveur).
//
// Couvre le bug L17 corrigé en A5 : sur src/app/admin/page.tsx, l'appel
// `getServerLang()` SANS argument retournait toujours "fr" (donc l'admin
// voyait toujours l'UI en français même si son cookie eps_lang valait "en"
// ou "es"). Le fix consiste à lire le cookie eps_lang dans admin/page.tsx
// et à le passer explicitement à getServerLang(cookieValue).
//
// Cette suite vérifie que la fonction retourne bien la bonne langue selon
// l'argument fourni, et fallback sur fr (DEFAULT_LOCALE) si invalide.

import { describe, it, expect } from "vitest";
import { getServerLang, getServerT } from "@/lib/i18n/server";

describe("getServerLang() — argument valide", () => {
  it("'fr' → 'fr'", () => {
    expect(getServerLang("fr")).toBe("fr");
  });

  it("'en' → 'en'", () => {
    expect(getServerLang("en")).toBe("en");
  });

  it("'es' → 'es'", () => {
    expect(getServerLang("es")).toBe("es");
  });
});

describe("getServerLang() — fallback DEFAULT_LOCALE", () => {
  it("undefined (pas d'argument) → 'fr'", () => {
    expect(getServerLang()).toBe("fr");
  });

  it("chaîne vide → 'fr'", () => {
    expect(getServerLang("")).toBe("fr");
  });

  it("locale invalide ('xx') → 'fr'", () => {
    expect(getServerLang("xx")).toBe("fr");
  });

  it("locale invalide ('it') → 'fr' (non supportée pour l'instant)", () => {
    expect(getServerLang("it")).toBe("fr");
  });
});

describe("getServerT() — retourne une fonction t", () => {
  it("clé existante en fr → traduction fr", () => {
    const t = getServerT("fr");
    expect(typeof t("header.exercices")).toBe("string");
    expect(t("header.exercices")).not.toBe("header.exercices");
  });

  it("clé existante en en → traduction en", () => {
    const t = getServerT("en");
    expect(typeof t("header.exercices")).toBe("string");
    expect(t("header.exercices")).not.toBe("header.exercices");
  });

  it("clé inexistante → retourne la clé telle quelle", () => {
    const t = getServerT("fr");
    expect(t("nonexistent.key.path")).toBe("nonexistent.key.path");
  });
});
