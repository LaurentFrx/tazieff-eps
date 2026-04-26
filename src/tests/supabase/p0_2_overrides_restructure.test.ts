// Phase P0.2 — Tests structurels de la restructuration de exercise_overrides.
// Vérifie l'ajout des 4 colonnes (author_user_id, created_at, created_by,
// deleted_at), la contrainte NOT NULL sur author_user_id, les index, le drop
// de l'ancienne policy, la recréation de la matrice INSERT/UPDATE/DELETE
// gatée par is_admin(), et les 2 triggers (soft-delete + audit).
//
// Référence : GOUVERNANCE_EDITORIALE.md §3.1, §7.

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const MIGRATIONS_DIR = resolve(REPO_ROOT, "supabase", "migrations");

function loadP02Migration(): { filename: string; sql: string } {
  const files = readdirSync(MIGRATIONS_DIR);
  const match = files.find((f) =>
    /p0_2_admins_overrides_audit\.sql$/.test(f),
  );
  if (!match) {
    throw new Error(
      `Migration P0.2 introuvable dans ${MIGRATIONS_DIR}`,
    );
  }
  const sql = readFileSync(resolve(MIGRATIONS_DIR, match), "utf8");
  return { filename: match, sql };
}

describe("P0.2 — restructuration exercise_overrides", () => {
  const { sql } = loadP02Migration();

  it("supprime physiquement les lignes existantes avant la restructuration", () => {
    expect(sql).toMatch(/delete\s+from\s+public\.exercise_overrides\s*;/i);
    // Le DELETE doit précéder l'ALTER TABLE ... ADD COLUMN deleted_at
    const deleteIdx = sql.search(
      /delete\s+from\s+public\.exercise_overrides\s*;/i,
    );
    const alterIdx = sql.search(
      /alter\s+table\s+public\.exercise_overrides[\s\S]*?add\s+column\s+deleted_at/i,
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
      /alter\s+table\s+public\.exercise_overrides[\s\S]*?alter\s+column\s+author_user_id\s+set\s+not\s+null/i,
    );
  });

  it("crée les 2 index (author + actif)", () => {
    expect(sql).toMatch(
      /create\s+index\s+if\s+not\s+exists\s+ix_exercise_overrides_author\s+on\s+public\.exercise_overrides\(author_user_id\)/i,
    );
    expect(sql).toMatch(
      /create\s+index\s+if\s+not\s+exists\s+ix_exercise_overrides_active\s+on\s+public\.exercise_overrides\(slug,\s*locale\)\s+where\s+deleted_at\s+is\s+null/i,
    );
  });

  it("drop la policy historique \"public read overrides\"", () => {
    expect(sql).toMatch(
      /drop\s+policy\s+if\s+exists\s+"public read overrides"\s+on\s+public\.exercise_overrides/i,
    );
  });

  it("recrée 4 policies (SELECT public + INSERT/UPDATE/DELETE admin)", () => {
    const expected = [
      "exercise_overrides_select_public_active",
      "exercise_overrides_insert_admin",
      "exercise_overrides_update_admin",
      "exercise_overrides_delete_admin",
    ];
    for (const p of expected) {
      expect(sql).toMatch(
        new RegExp(
          `create\\s+policy\\s+"${p}"\\s+on\\s+public\\.exercise_overrides`,
          "i",
        ),
      );
    }
  });

  it("la policy SELECT publique filtre deleted_at is null et autorise anon+authenticated", () => {
    const block = sql.match(
      /create\s+policy\s+"exercise_overrides_select_public_active"[\s\S]*?(?=create\s+policy|--|drop|alter|create\s+index|commit;)/i,
    );
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(/to\s+anon,\s*authenticated/i);
    expect(block![0]).toMatch(/using\s*\(\s*deleted_at\s+is\s+null\s*\)/i);
  });

  it("les policies INSERT/UPDATE/DELETE référencent public.is_admin()", () => {
    for (const p of [
      "exercise_overrides_insert_admin",
      "exercise_overrides_update_admin",
      "exercise_overrides_delete_admin",
    ]) {
      const block = sql.match(
        new RegExp(
          `create\\s+policy\\s+"${p}"[\\s\\S]*?(?=create\\s+policy|--|drop|alter|create\\s+index|commit;|$)`,
          "i",
        ),
      );
      expect(block).not.toBeNull();
      expect(block![0]).toMatch(/public\.is_admin\(\s*\)/i);
    }
  });

  it("la policy INSERT exige author_user_id = auth.uid() ET created_by = auth.uid()", () => {
    const block = sql.match(
      /create\s+policy\s+"exercise_overrides_insert_admin"[\s\S]*?(?=create\s+policy|--)/i,
    );
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(
      /author_user_id\s*=\s*\(\s*select\s+auth\.uid\(\s*\)\s*\)/i,
    );
    expect(block![0]).toMatch(
      /created_by\s*=\s*\(\s*select\s+auth\.uid\(\s*\)\s*\)/i,
    );
  });

  it("crée le trigger soft-delete (BEFORE DELETE) et la fonction associée", () => {
    expect(sql).toMatch(
      /create\s+or\s+replace\s+function\s+public\.exercise_overrides_soft_delete\(\s*\)[\s\S]*?security\s+definer/i,
    );
    expect(sql).toMatch(
      /create\s+trigger\s+trg_exercise_overrides_soft_delete\s+before\s+delete\s+on\s+public\.exercise_overrides/i,
    );
    // La fonction doit annuler le DELETE physique (return null) et faire un UPDATE deleted_at
    const fn = sql.match(
      /create\s+or\s+replace\s+function\s+public\.exercise_overrides_soft_delete[\s\S]*?\$\$;/i,
    );
    expect(fn).not.toBeNull();
    expect(fn![0]).toMatch(/update\s+public\.exercise_overrides[\s\S]*?set\s+deleted_at\s*=\s*now\(\)/i);
    expect(fn![0]).toMatch(/return\s+null;/i);
  });

  it("crée le trigger d'audit (AFTER INSERT OR UPDATE) et la fonction associée", () => {
    expect(sql).toMatch(
      /create\s+or\s+replace\s+function\s+public\.audit_exercise_overrides\(\s*\)[\s\S]*?security\s+definer/i,
    );
    expect(sql).toMatch(
      /create\s+trigger\s+trg_exercise_overrides_audit\s+after\s+insert\s+or\s+update\s+on\s+public\.exercise_overrides/i,
    );
  });
});
