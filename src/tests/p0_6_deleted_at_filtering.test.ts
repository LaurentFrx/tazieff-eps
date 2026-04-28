// Phase P0.6 — Tests de non-régression : aucune lecture côté client ne
// peut remonter une row soft-deletée (deleted_at IS NOT NULL).
//
// Stratégie : parsing des 4 sources de lecture impactées pour vérifier
// la présence du filtre `.is("deleted_at", null)` (polling / queries) ou
// du contrôle `payload.new.deleted_at` (realtime).
//
// Référence : GOUVERNANCE_EDITORIALE.md §3.1.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const REPO_ROOT = resolve(__dirname, "..", "..");

function readSource(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), "utf8");
}

describe("P0.6 — filtrage deleted_at dans les lectures client/serveur", () => {
  it("ExerciseLiveDetail.tsx : polling fetchOverride filtre deleted_at", () => {
    const src = readSource(
      "src/app/[locale]/exercices/[slug]/ExerciseLiveDetail.tsx",
    );
    // Le polling exercise_overrides doit inclure .is("deleted_at", null)
    const block = src.match(
      /fetchOverride[\s\S]*?\.from\("exercise_overrides"\)[\s\S]*?\.maybeSingle\(\)/,
    );
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(/\.is\(\s*"deleted_at"\s*,\s*null\s*\)/);
  });

  it("ExerciseLiveDetail.tsx : realtime channel détecte deleted_at sur UPDATE", () => {
    const src = readSource(
      "src/app/[locale]/exercices/[slug]/ExerciseLiveDetail.tsx",
    );
    // Le handler postgres_changes doit lire payload.new.deleted_at
    // et traiter comme un retrait (setPatch(null)) si non null.
    const block = src.match(
      /table:\s*"exercise_overrides"[\s\S]*?\}\s*,\s*\(payload\)[\s\S]*?\}\s*,\s*\)\s*;/,
    );
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(/deleted_at/);
    expect(block![0]).toMatch(/setPatch\(\s*null\s*\)/);
  });

  it("useExercisesLiveSync.ts : polling fetchLatest filtre deleted_at", () => {
    const src = readSource("src/hooks/useExercisesLiveSync.ts");
    const block = src.match(
      /fetchLatest[\s\S]*?\.from\("live_exercises"\)[\s\S]*?\.eq\("locale"[\s\S]*?\;/,
    );
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(/\.is\(\s*"deleted_at"\s*,\s*null\s*\)/);
  });

  it("useExercisesLiveSync.ts : realtime channel détecte deleted_at sur UPDATE", () => {
    const src = readSource("src/hooks/useExercisesLiveSync.ts");
    const block = src.match(
      /table:\s*"live_exercises"[\s\S]*?\}\s*,\s*\(payload\)[\s\S]*?upsertRow\(row\)/,
    );
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(/deleted_at/);
    // Doit retirer la row de la liste si soft-delete
    expect(block![0]).toMatch(
      /setLiveRows\(\(prev\)\s*=>\s*prev\.filter\(\(item\)\s*=>\s*item\.slug\s*!==\s*row\.slug\)\)/,
    );
  });

  it("lib/live/queries.ts : fetchLiveExercises filtre deleted_at", () => {
    const src = readSource("src/lib/live/queries.ts");
    const block = src.match(
      /export\s+async\s+function\s+fetchLiveExercises[\s\S]*?return\s+data\s+as\s+LiveExerciseRow\[\]/,
    );
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(/\.is\(\s*"deleted_at"\s*,\s*null\s*\)/);
  });

  it("lib/live/queries.ts : fetchLiveExercise filtre deleted_at", () => {
    const src = readSource("src/lib/live/queries.ts");
    const block = src.match(
      /export\s+async\s+function\s+fetchLiveExercise[\s\S]*?return\s+data\s+as\s+LiveExerciseRow/,
    );
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(/\.is\(\s*"deleted_at"\s*,\s*null\s*\)/);
  });
});
