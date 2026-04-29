// Sprint splash-reduction (29 avril 2026) — non-régression sur la durée
// totale du splash et la présence des éléments visuels clés.
//
// Décision Laurent : passer le splash de 5400 ms à 2000 ms tout en
// préservant l'identité visuelle Sport Vibrant. Ces tests garantissent
// qu'aucun futur sprint ne réintroduise un timer > 2000 ms et que les
// éléments incontournables (mannequin, titre, halo, fade-out) restent
// présents.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const SPLASH_PATH = resolve(process.cwd(), "public/splash.js");
const SPLASH_SOURCE = readFileSync(SPLASH_PATH, "utf8");

/**
 * Extrait tous les delays passés en 2e argument de `setTimeout(fn, delay)`.
 * Pattern accepté : `setTimeout(`...une-seule-fonction-arrow-ou-anonyme...`, NNN)`.
 * On capture juste le nombre suivant la dernière virgule de l'appel
 * top-level — assez robuste tant que la valeur reste un littéral numérique.
 */
function extractSetTimeoutDelays(source: string): number[] {
  const delays: number[] = [];
  const regex = /setTimeout\s*\([\s\S]*?,\s*(\d+)\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source)) !== null) {
    delays.push(Number(match[1]));
  }
  return delays;
}

describe("public/splash.js — durée et identité (sprint splash-reduction)", () => {
  it("expose au moins un setTimeout (sinon : pas de chronologie)", () => {
    const delays = extractSetTimeoutDelays(SPLASH_SOURCE);
    expect(delays.length).toBeGreaterThan(0);
  });

  it("aucun setTimeout ne dépasse 2000 ms (cible sprint = 2 s strict)", () => {
    const delays = extractSetTimeoutDelays(SPLASH_SOURCE);
    const tooLong = delays.filter((d) => d > 2000);
    expect(tooLong).toEqual([]);
  });

  it("le setTimeout de remove final est exactement à 2000 ms", () => {
    const delays = extractSetTimeoutDelays(SPLASH_SOURCE);
    const max = Math.max(...delays);
    expect(max).toBe(2000);
  });

  it("aucune transition CSS ne dépasse 1.5 s (sinon le splash dépasse 2 s)", () => {
    // On lit toutes les transitions `transition: ... Xs` ou `Xms` et on
    // vérifie que la durée la plus longue reste ≤ 1.5 s. Au-delà, la
    // transition court après le `splash.remove()` et est inutile.
    const re = /transition\s*[=:]\s*"[^"]*?(\d+(?:\.\d+)?)\s*s/g;
    const durations: number[] = [];
    let match: RegExpExecArray | null;
    while ((match = re.exec(SPLASH_SOURCE)) !== null) {
      durations.push(Number(match[1]));
    }
    const tooLong = durations.filter((d) => d > 1.5);
    expect(tooLong).toEqual([]);
  });

  it("conserve le mécanisme de skip session (sessionStorage.splash_shown)", () => {
    expect(SPLASH_SOURCE).toMatch(/sessionStorage\.getItem\("splash_shown"\)/);
    expect(SPLASH_SOURCE).toMatch(/sessionStorage\.setItem\("splash_shown"/);
  });

  it("contient les éléments visuels clés : mannequin, titre, subtitle, halo, signature", () => {
    // Mannequin : image ID `sp-mannequin` chargée depuis l'asset anatomie
    expect(SPLASH_SOURCE).toMatch(/sp-mannequin/);
    expect(SPLASH_SOURCE).toMatch(/mini-mannequin\.webp/);
    // Titre marque
    expect(SPLASH_SOURCE).toMatch(/MUSCU - EPS/);
    // Subtitle
    expect(SPLASH_SOURCE).toMatch(/TAZIEFF/);
    // Halo : un cercle SVG avec stroke `url(#sp-cg)` (gradient signature)
    expect(SPLASH_SOURCE).toMatch(/sp-cg/);
    // Signature bas
    expect(SPLASH_SOURCE).toMatch(/LYC[ÉE].*HAROUN.*TAZIEFF/);
  });

  it("conserve l'IIFE auto-exécutée (pas de refactor architectural cassant)", () => {
    // Forme attendue : `(function(){ ... })();` au début et fin du fichier.
    expect(SPLASH_SOURCE).toMatch(/^\(function\(\){/);
    expect(SPLASH_SOURCE.trimEnd()).toMatch(/}\)\(\);$/);
  });

  it("conserve l'injection asynchrone via requestAnimationFrame (pas de DOM sync)", () => {
    expect(SPLASH_SOURCE).toMatch(/requestAnimationFrame/);
  });
});
