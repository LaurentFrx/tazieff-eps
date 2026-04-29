// Sprint perf-quick-wins (29 avril 2026) — verrous de non-régression sur
// les optimisations Core Web Vitals appliquées :
//   - preconnect + dns-prefetch vers Supabase
//   - font-display: "optional" sur les 3 polices Google
//   - logo TopBar pointe vers logo-eps-72.webp (et non plus le 512x512)
//   - splash.js pointe vers mini-mannequin-260.webp (taille native d'affichage)
//
// Le but de ces tests n'est pas de mesurer les CWV (impossible en Vitest)
// mais d'éviter qu'un futur sprint réintroduise les anciens chemins lourds.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const layoutSource = readFileSync(
  resolve(root, "src/app/layout.tsx"),
  "utf8",
);
const splashSource = readFileSync(
  resolve(root, "public/splash.js"),
  "utf8",
);
const topBarSource = readFileSync(
  resolve(root, "src/components/TopBar.tsx"),
  "utf8",
);

describe("perf-quick-wins — layout (preconnect + fonts)", () => {
  it("ajoute un <link rel=\"preconnect\"> vers Supabase", () => {
    expect(layoutSource).toMatch(
      /rel="preconnect"\s*\n?\s*href="https:\/\/zefkltkiigxkjcrdesrk\.supabase\.co"/,
    );
  });

  it("ajoute un <link rel=\"dns-prefetch\"> de secours vers Supabase", () => {
    expect(layoutSource).toMatch(
      /rel="dns-prefetch"\s*\n?\s*href="https:\/\/zefkltkiigxkjcrdesrk\.supabase\.co"/,
    );
  });

  it("configure display: \"optional\" sur Bebas Neue", () => {
    const block = layoutSource.match(/Bebas_Neue\(\{[\s\S]*?\}\)/);
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(/display:\s*"optional"/);
  });

  it("configure display: \"optional\" sur DM Sans", () => {
    const block = layoutSource.match(/DM_Sans\(\{[\s\S]*?\}\)/);
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(/display:\s*"optional"/);
  });

  it("configure display: \"optional\" sur JetBrains Mono", () => {
    const block = layoutSource.match(/JetBrains_Mono\(\{[\s\S]*?\}\)/);
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(/display:\s*"optional"/);
  });
});

describe("perf-quick-wins — assets allégés", () => {
  it("TopBar utilise la version 72×72 du logo (et non plus le 512×512)", () => {
    expect(topBarSource).toMatch(/\/media\/branding\/logo-eps-72\.webp/);
    expect(topBarSource).not.toMatch(
      /src="\/media\/branding\/logo-eps\.webp"/,
    );
  });

  it("splash.js charge mini-mannequin-260.webp (taille native d'affichage)", () => {
    expect(splashSource).toMatch(
      /src:"\/images\/anatomy\/mini-mannequin-260\.webp"/,
    );
    expect(splashSource).not.toMatch(
      /src:"\/images\/anatomy\/mini-mannequin\.webp"/,
    );
  });

  it("le splash conserve l'identité Sport Vibrant (pas de régression du sprint)", () => {
    // Ces éléments ont été restaurés après revert du sprint splash-reduction
    // et doivent rester présents : signature visuelle non négociable.
    expect(splashSource).toMatch(/MUSCU - EPS/);
    expect(splashSource).toMatch(/sp-mannequin/);
    expect(splashSource).toMatch(/sp-cg/);
  });
});
