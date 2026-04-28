// Sprint A2 — Tests de localizedRedirect() (helper Server Component).
//
// Couvre :
//   - locale fournie (fr/en/es)
//   - locale absente ou invalide → fallback fr
//   - path avec ou sans slash de tête
//   - path racine "/" → /{locale} sans double slash

import { describe, expect, it, vi } from "vitest";

// Mock de redirect() de next/navigation : il throw normalement (NEXT_REDIRECT),
// on intercepte pour pouvoir asserter l'URL cible passée.
//
// Note : vi.mock est hoisté tout en haut du fichier. La factory ne peut pas
// référencer de variable de module-scope. On déclare donc le mock à
// l'intérieur de la factory et on récupère son spy via vi.mocked() après
// import statique.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`__REDIRECT__:${url}`);
  }),
}));

import { localizedRedirect } from "@/lib/navigation";

function captureRedirect(call: () => void): string {
  try {
    call();
    return "";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const match = msg.match(/^__REDIRECT__:(.+)$/);
    return match ? match[1] : "";
  }
}

describe("localizedRedirect()", () => {
  it("locale fournie 'fr' avec path à slash → /fr/exercices", () => {
    const url = captureRedirect(() => localizedRedirect("/exercices", "fr"));
    expect(url).toBe("/fr/exercices");
  });

  it("locale fournie 'en' avec path à slash → /en/exercices", () => {
    const url = captureRedirect(() => localizedRedirect("/exercices", "en"));
    expect(url).toBe("/en/exercices");
  });

  it("locale fournie 'es' avec path à slash → /es/exercices", () => {
    const url = captureRedirect(() => localizedRedirect("/exercices", "es"));
    expect(url).toBe("/es/exercices");
  });

  it("path SANS slash de tête → ajoute le slash", () => {
    const url = captureRedirect(() => localizedRedirect("exercices", "fr"));
    expect(url).toBe("/fr/exercices");
  });

  it("path avec slug dynamique préservé", () => {
    const url = captureRedirect(() =>
      localizedRedirect("/exercices/s1-01", "es"),
    );
    expect(url).toBe("/es/exercices/s1-01");
  });

  it("path racine '/' → /{locale} sans double slash", () => {
    const url = captureRedirect(() => localizedRedirect("/", "fr"));
    expect(url).toBe("/fr");
  });

  it("path racine '/' en es → /es", () => {
    const url = captureRedirect(() => localizedRedirect("/", "es"));
    expect(url).toBe("/es");
  });

  it("locale absente (undefined) → fallback fr", () => {
    const url = captureRedirect(() => localizedRedirect("/exercices"));
    expect(url).toBe("/fr/exercices");
  });

  it("locale invalide ('xx') → fallback fr", () => {
    const url = captureRedirect(() => localizedRedirect("/exercices", "xx"));
    expect(url).toBe("/fr/exercices");
  });

  it("locale chaîne vide → fallback fr", () => {
    const url = captureRedirect(() => localizedRedirect("/exercices", ""));
    expect(url).toBe("/fr/exercices");
  });
});
