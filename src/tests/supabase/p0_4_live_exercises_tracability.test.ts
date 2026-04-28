// Phase P0.4 — Tests structurels de la migration de traçabilité sur
// live_exercises. Calque sur p0_2_overrides_restructure.test.ts.
//
// Référence : GOUVERNANCE_EDITORIALE.md §3.1, §6, §7.

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const MIGRATIONS_DIR = resolve(REPO_ROOT, "supabase", "migrations");

function loadP04Migration(): { filename: string; sql: string } {
  const files = readdirSync(MIGRATIONS_DIR);
  const match = files.find((f) =>
    /p0_4_live_exercises_tracability\.sql$/.test(f),
  );
  if (!match) {
    throw new Error(
      `Migration P0.4 introuvable dans ${MIGRATIONS_DIR}`,
    );
  }
  const sql = readFileSync(resolve(MIGRATIONS_DIR, match), "utf8");
  return { filename: match, sql };
}

describe("P0.4 — traçabilité + soft-delete + audit sur live_exercises", () => {
  const { filename, sql } = loadP04Migration();

  it("le fichier de migration existe avec un timestamp 14 chars", () => {
    expect(filename).toMatch(
      /^\d{14}_p0_4_live_exercises_tracability\.sql$/,
    );
  });

  it("est enveloppée dans begin; ... commit; pour atomicité", () => {
    expect(sql).toMatch(/^\s*(--.*\n|\s)*begin;/m);
    expect(sql.trim().endsWith("commit;")).toBe(true);
  });

  it("supprime physiquement les lignes existantes avant la restructuration", () => {
    expect(sql).toMatch(/delete\s+from\s+public\.live_exercises\s*;/i);
    const deleteIdx = sql.search(
      /delete\s+from\s+public\.live_exercises\s*;/i,
    );
    const alterIdx = sql.search(
      /alter\s+table\s+public\.live_exercises[\s\S]*?add\s+column\s+deleted_at/i,
    );
    expect(deleteIdx).toBeGreaterThan(0);
    expect(alterIdx).toBeGreaterThan(deleteIdx);
  });

  it("ajoute les 4 colonnes attendues (author_user_id, created_at, created_by, deleted_at)", () => {
    const required = [
      /add\s+column\s+author_user_id\s+uuid\s+references\s+auth\.users\(id\)/i,
      /add\s+column\s+created_at\s+timestamptz\s+not\s+null\s+default\s+now\(\)/i,
      /add\s+column\s+created_by\s+uuid\s+references\s+auth\.users\(id\)/i,
      /add\s+column\s+deleted_at\s+timestamptz/i,
    ];
    for (const re of required) {
      expect(sql).toMatch(re);
    }
  });

  it("impose NOT NULL sur author_user_id (post-DELETE)", () => {
    expect(sql).toMatch(
      /alter\s+table\s+public\.live_exercises[\s\S]*?alter\s+column\s+author_user_id\s+set\s+not\s+null/i,
    );
  });

  it("crée les 2 index (author + actif)", () => {
    expect(sql).toMatch(
      /create\s+index\s+if\s+not\s+exists\s+ix_live_exercises_author\s+on\s+public\.live_exercises\(author_user_id\)/i,
    );
    expect(sql).toMatch(
      /create\s+index\s+if\s+not\s+exists\s+ix_live_exercises_active\s+on\s+public\.live_exercises\(slug,\s*locale\)\s+where\s+deleted_at\s+is\s+null/i,
    );
  });

  it("drop la policy historique \"public read live\"", () => {
    expect(sql).toMatch(
      /drop\s+policy\s+if\s+exists\s+"public read live"\s+on\s+public\.live_exercises/i,
    );
  });

  it("recrée 4 policies (SELECT public + INSERT/UPDATE/DELETE admin)", () => {
    const expected = [
      "live_exercises_select_active",
      "live_exercises_insert_admin",
      "live_exercises_update_admin",
      "live_exercises_delete_admin",
    ];
    for (const p of expected) {
      expect(sql).toMatch(
        new RegExp(
          `create\\s+policy\\s+"${p}"\\s+on\\s+public\\.live_exercises`,
          "i",
        ),
      );
    }
  });

  it("la policy SELECT publique filtre deleted_at is null", () => {
    const block = sql.match(
      /create\s+policy\s+"live_exercises_select_active"[\s\S]*?(?=create\s+policy|--|drop|alter|create\s+index|commit;)/i,
    );
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(/to\s+anon,\s*authenticated/i);
    expect(block![0]).toMatch(/using\s*\(\s*deleted_at\s+is\s+null\s*\)/i);
  });

  it("la policy INSERT exige is_admin() ET author_user_id = auth.uid() ET created_by = auth.uid()", () => {
    const block = sql.match(
      /create\s+policy\s+"live_exercises_insert_admin"[\s\S]*?(?=create\s+policy|--)/i,
    );
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(/public\.is_admin\(\s*\)/i);
    expect(block![0]).toMatch(
      /author_user_id\s*=\s*\(\s*select\s+auth\.uid\(\s*\)\s*\)/i,
    );
    expect(block![0]).toMatch(
      /created_by\s*=\s*\(\s*select\s+auth\.uid\(\s*\)\s*\)/i,
    );
  });

  it("crée le trigger soft-delete (BEFORE DELETE) et la fonction associée", () => {
    expect(sql).toMatch(
      /create\s+or\s+replace\s+function\s+public\.live_exercises_soft_delete\(\s*\)[\s\S]*?security\s+definer/i,
    );
    expect(sql).toMatch(
      /create\s+trigger\s+trg_live_exercises_soft_delete\s+before\s+delete\s+on\s+public\.live_exercises/i,
    );
    const fn = sql.match(
      /create\s+or\s+replace\s+function\s+public\.live_exercises_soft_delete[\s\S]*?\$\$;/i,
    );
    expect(fn).not.toBeNull();
    expect(fn![0]).toMatch(/update\s+public\.live_exercises[\s\S]*?set\s+deleted_at\s*=\s*now\(\)/i);
    expect(fn![0]).toMatch(/return\s+null;/i);
  });

  it("crée le trigger d'audit (AFTER INSERT OR UPDATE) ciblant audit_log", () => {
    expect(sql).toMatch(
      /create\s+or\s+replace\s+function\s+public\.audit_live_exercises\(\s*\)[\s\S]*?security\s+definer/i,
    );
    expect(sql).toMatch(
      /create\s+trigger\s+trg_live_exercises_audit\s+after\s+insert\s+or\s+update\s+on\s+public\.live_exercises/i,
    );
    const fn = sql.match(
      /create\s+or\s+replace\s+function\s+public\.audit_live_exercises[\s\S]*?\$\$;/i,
    );
    expect(fn).not.toBeNull();
    expect(fn![0]).toMatch(/insert\s+into\s+public\.audit_log/i);
    expect(fn![0]).toMatch(/'live_exercises'/);
  });

  it("toutes les policies live_exercises_* spécifient bien leur rôle attendu", () => {
    expect(sql).toMatch(
      /create\s+policy\s+"live_exercises_select_active"[\s\S]*?to\s+anon,\s*authenticated/i,
    );
    for (const p of [
      "live_exercises_insert_admin",
      "live_exercises_update_admin",
      "live_exercises_delete_admin",
    ]) {
      expect(sql).toMatch(
        new RegExp(`create\\s+policy\\s+"${p}"[\\s\\S]*?to\\s+authenticated`, "i"),
      );
    }
  });
});
