// Sprint A2 — Test de non-régression : aucun fichier sous src/app/[locale]/**
// ni src/components/** (hors LocaleLink lui-même et teacher/) ne doit
// importer Link depuis "next/link" ou redirect depuis "next/navigation".
//
// Pendant: la lint rule no-restricted-imports le bloque déjà, mais ce test
// agit en garde-fou complémentaire qui s'exécute au CI Vitest sans dépendre
// de l'exécution explicite d'eslint.

import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "src");

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, files);
    } else if (
      entry.endsWith(".ts") ||
      entry.endsWith(".tsx")
    ) {
      files.push(full);
    }
  }
  return files;
}

const ALL_FILES = walk(ROOT);

// Fichiers exemptés (raison contextuelle documentée).
//   - LocaleLink lui-même : wrapper, doit importer Link.
//   - navigation.ts : helper, doit importer redirect.
//   - admin/* : sous-domaine non-localisé.
//   - prof/* : sous-domaine non-localisé.
//   - legal/* : pages légales non-localisées (existantes en racine).
//   - not-found.tsx : page 404 non-localisée.
//   - auth/*, callback/* : routes globales.
//   - tests : whitelist totale.
//   - components/teacher/* : composants prof, rendus en /prof/* uniquement.
const EXEMPT_PATTERNS = [
  /\/components\/LocaleLink\.tsx$/,
  /\/lib\/navigation\.ts$/,
  /\/app\/admin\//,
  /\/app\/prof\//,
  /\/app\/legal\//,
  /\/app\/not-found\.tsx$/,
  /\/app\/auth\//,
  /\/app\/callback\//,
  /\/components\/teacher\//,
  /\/tests\//,
  /\.test\.(ts|tsx)$/,
];

function isExempt(file: string): boolean {
  return EXEMPT_PATTERNS.some((re) => re.test(file));
}

describe("Non-régression : pas d'import next/link interdit en routes localisées", () => {
  it("aucun fichier non-exempté n'importe Link depuis next/link", () => {
    const violators: string[] = [];
    for (const file of ALL_FILES) {
      if (isExempt(file)) continue;
      const src = readFileSync(file, "utf8");
      // Détecte `from "next/link"` (import default ou nommé).
      if (/from\s+["']next\/link["']/.test(src)) {
        violators.push(file.replace(ROOT, "src"));
      }
    }
    expect(violators).toEqual([]);
  });

  it("aucun fichier non-exempté n'importe redirect depuis next/navigation", () => {
    const violators: string[] = [];
    for (const file of ALL_FILES) {
      if (isExempt(file)) continue;
      const src = readFileSync(file, "utf8");
      // Détecte `import { ..., redirect, ... } from "next/navigation"`.
      // Match sur les imports nommés contenant "redirect".
      const importMatch = src.match(
        /import\s*\{([^}]+)\}\s*from\s*["']next\/navigation["']/g,
      );
      if (importMatch) {
        for (const importStmt of importMatch) {
          const names = importStmt
            .replace(/import\s*\{|\}\s*from.+/g, "")
            .split(",")
            .map((s) => s.trim());
          if (names.includes("redirect")) {
            violators.push(file.replace(ROOT, "src"));
            break;
          }
        }
      }
    }
    expect(violators).toEqual([]);
  });
});
