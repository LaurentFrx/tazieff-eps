// Phase P0.5 — Tests structurels des policies RLS sur le bucket Storage
// `exercise-media`.
//
// Référence : GOUVERNANCE_EDITORIALE.md §3.1, §7.

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const MIGRATIONS_DIR = resolve(REPO_ROOT, "supabase", "migrations");

function loadP05Migration(): { filename: string; sql: string } {
  const files = readdirSync(MIGRATIONS_DIR);
  const match = files.find((f) =>
    /p0_5_storage_exercise_media_rls\.sql$/.test(f),
  );
  if (!match) {
    throw new Error(`Migration P0.5 introuvable dans ${MIGRATIONS_DIR}`);
  }
  const sql = readFileSync(resolve(MIGRATIONS_DIR, match), "utf8");
  return { filename: match, sql };
}

describe("P0.5 — policies RLS sur storage.objects (bucket exercise-media)", () => {
  const { filename, sql } = loadP05Migration();

  it("le fichier de migration existe avec un timestamp 14 chars", () => {
    expect(filename).toMatch(
      /^\d{14}_p0_5_storage_exercise_media_rls\.sql$/,
    );
  });

  it("est enveloppée dans begin; ... commit;", () => {
    expect(sql).toMatch(/^\s*(--.*\n|\s)*begin;/m);
    expect(sql.trim().endsWith("commit;")).toBe(true);
  });

  it("crée 4 policies sur storage.objects, toutes filtrées par bucket_id='exercise-media'", () => {
    const expected = [
      "storage_exercise_media_select_public",
      "storage_exercise_media_insert_admin",
      "storage_exercise_media_update_admin",
      "storage_exercise_media_delete_admin",
    ];
    for (const p of expected) {
      expect(sql).toMatch(
        new RegExp(
          `create\\s+policy\\s+"${p}"\\s+on\\s+storage\\.objects`,
          "i",
        ),
      );
    }
    // Toutes les policies doivent référencer le bucket cible
    const policyMatches = sql.match(/create\s+policy\s+"storage_exercise_media_[\s\S]*?(?=create\s+policy|commit;|drop\s+policy|$)/gi) ?? [];
    expect(policyMatches.length).toBeGreaterThanOrEqual(4);
    for (const block of policyMatches) {
      expect(block).toMatch(/bucket_id\s*=\s*'exercise-media'/i);
    }
  });

  it("la policy SELECT autorise anon + authenticated (lecture publique)", () => {
    const block = sql.match(
      /create\s+policy\s+"storage_exercise_media_select_public"[\s\S]*?(?=create\s+policy|commit;)/i,
    );
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(/for\s+select\s+to\s+anon,\s*authenticated/i);
    expect(block![0]).toMatch(/using\s*\(\s*bucket_id\s*=\s*'exercise-media'/i);
  });

  it("les 3 policies d'écriture exigent public.is_admin()", () => {
    for (const p of [
      "storage_exercise_media_insert_admin",
      "storage_exercise_media_update_admin",
      "storage_exercise_media_delete_admin",
    ]) {
      const block = sql.match(
        new RegExp(
          `create\\s+policy\\s+"${p}"[\\s\\S]*?(?=create\\s+policy|commit;|drop\\s+policy|$)`,
          "i",
        ),
      );
      expect(block).not.toBeNull();
      expect(block![0]).toMatch(/public\.is_admin\(\s*\)/i);
      expect(block![0]).toMatch(/to\s+authenticated\b/i);
    }
  });

  it("aucune policy ne crée d'accès anonyme en écriture", () => {
    // Pour chaque policy d'écriture nommée, on extrait le bloc isolé et
    // on vérifie que `to anon` n'y figure pas.
    for (const p of [
      "storage_exercise_media_insert_admin",
      "storage_exercise_media_update_admin",
      "storage_exercise_media_delete_admin",
    ]) {
      const block = sql.match(
        new RegExp(
          `create\\s+policy\\s+"${p}"[\\s\\S]*?(?:with\\s+check\\s*\\([^)]*\\)|using\\s*\\([\\s\\S]*?\\))\\s*;`,
          "i",
        ),
      );
      expect(block).not.toBeNull();
      expect(block![0]).not.toMatch(/to\s+anon\b/i);
    }
  });
});
