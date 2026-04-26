// Phase P0.2 — Tests structurels de la table audit_log.
// Vérifie le schéma append-only : table + colonnes, indexes, RLS activée,
// policy SELECT pour admins, ABSENCE de policies INSERT/UPDATE/DELETE
// (append-only via triggers SECURITY DEFINER uniquement).
//
// Référence : GOUVERNANCE_EDITORIALE.md §6.

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const MIGRATIONS_DIR = resolve(REPO_ROOT, "supabase", "migrations");

function loadP02Migration(): string {
  const files = readdirSync(MIGRATIONS_DIR);
  const match = files.find((f) =>
    /p0_2_admins_overrides_audit\.sql$/.test(f),
  );
  if (!match) {
    throw new Error(
      `Migration P0.2 introuvable dans ${MIGRATIONS_DIR}`,
    );
  }
  return readFileSync(resolve(MIGRATIONS_DIR, match), "utf8");
}

describe("P0.2 — table audit_log (append-only)", () => {
  const sql = loadP02Migration();

  it("crée la table public.audit_log avec PK uuid et toutes les colonnes attendues", () => {
    expect(sql).toMatch(/create\s+table\s+public\.audit_log\s*\(/i);
    const required = [
      /id\s+uuid\s+primary\s+key\s+default\s+gen_random_uuid\(\)/i,
      /actor_user_id\s+uuid\s+references\s+auth\.users\(id\)/i,
      /actor_role\s+text/i,
      /action_type\s+text\s+not\s+null\s+check\s*\(\s*action_type\s+in\s*\(\s*'insert'\s*,\s*'update'\s*,\s*'delete'\s*\)\s*\)/i,
      /target_table\s+text\s+not\s+null/i,
      /target_pk\s+jsonb\s+not\s+null/i,
      /diff_before\s+jsonb/i,
      /diff_after\s+jsonb/i,
      /created_at\s+timestamptz\s+not\s+null\s+default\s+now\(\)/i,
    ];
    for (const re of required) {
      expect(sql).toMatch(re);
    }
  });

  it("crée les 2 index (target_table+created_at desc, actor_user_id+created_at desc)", () => {
    expect(sql).toMatch(
      /create\s+index\s+ix_audit_log_target\s+on\s+public\.audit_log\(target_table,\s*created_at\s+desc\)/i,
    );
    expect(sql).toMatch(
      /create\s+index\s+ix_audit_log_actor\s+on\s+public\.audit_log\(actor_user_id,\s*created_at\s+desc\)/i,
    );
  });

  it("active RLS sur audit_log", () => {
    expect(sql).toMatch(
      /alter\s+table\s+public\.audit_log\s+enable\s+row\s+level\s+security/i,
    );
  });

  it("crée la policy SELECT admin et seulement celle-ci (append-only)", () => {
    // La policy SELECT doit exister
    expect(sql).toMatch(
      /create\s+policy\s+"audit_log_select_admins"\s+on\s+public\.audit_log\s+for\s+select\s+to\s+authenticated\s+using\s*\(\s*public\.is_admin\(\s*\)\s*\)/i,
    );
    // ABSENCE de policy INSERT/UPDATE/DELETE sur audit_log
    // (l'écriture passe exclusivement par les triggers SECURITY DEFINER).
    expect(sql).not.toMatch(
      /create\s+policy[^"]*"audit_log[^"]*"\s+on\s+public\.audit_log\s+for\s+insert/i,
    );
    expect(sql).not.toMatch(
      /create\s+policy[^"]*"audit_log[^"]*"\s+on\s+public\.audit_log\s+for\s+update/i,
    );
    expect(sql).not.toMatch(
      /create\s+policy[^"]*"audit_log[^"]*"\s+on\s+public\.audit_log\s+for\s+delete/i,
    );
  });

  it("la fonction audit_exercise_overrides est SECURITY DEFINER (peut bypasser RLS pour insérer)", () => {
    expect(sql).toMatch(
      /create\s+or\s+replace\s+function\s+public\.audit_exercise_overrides\(\s*\)[\s\S]*?security\s+definer/i,
    );
    // La fonction doit insérer dans audit_log avec les colonnes attendues
    const fn = sql.match(
      /create\s+or\s+replace\s+function\s+public\.audit_exercise_overrides[\s\S]*?\$\$;/i,
    );
    expect(fn).not.toBeNull();
    expect(fn![0]).toMatch(/insert\s+into\s+public\.audit_log/i);
    expect(fn![0]).toMatch(/'insert'/);
    expect(fn![0]).toMatch(/'update'/);
    expect(fn![0]).toMatch(/jsonb_build_object\(\s*'slug'/i);
  });

  it("la fonction audit_exercise_overrides fige son search_path à public, pg_catalog", () => {
    const fn = sql.match(
      /create\s+or\s+replace\s+function\s+public\.audit_exercise_overrides[\s\S]*?\$\$;/i,
    );
    expect(fn).not.toBeNull();
    expect(fn![0]).toMatch(
      /set\s+search_path\s*=\s*public,\s*pg_catalog/i,
    );
  });
});
