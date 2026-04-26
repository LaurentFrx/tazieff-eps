// Phase P0.2 — Tests structurels de la migration app_admins.
// Stratégie : parsing du fichier SQL (pas de DB live requise) pour valider la
// présence de la table app_admins, des helpers SECURITY DEFINER, des policies
// RLS, et du bootstrap super_admin.
//
// Référence : GOUVERNANCE_EDITORIALE.md §3.1, §6, §7.

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
      `Migration P0.2 introuvable dans ${MIGRATIONS_DIR} (expected *_p0_2_admins_overrides_audit.sql)`,
    );
  }
  const sql = readFileSync(resolve(MIGRATIONS_DIR, match), "utf8");
  return { filename: match, sql };
}

describe("P0.2 — table app_admins (schema, helpers, policies, bootstrap)", () => {
  const { filename, sql } = loadP02Migration();

  it("le fichier de migration existe avec un timestamp 14 chars", () => {
    expect(filename).toMatch(/^\d{14}_p0_2_admins_overrides_audit\.sql$/);
  });

  it("est enveloppée dans begin; ... commit; pour atomicité", () => {
    expect(sql).toMatch(/^\s*(--.*\n|\s)*begin;/m);
    expect(sql.trim().endsWith("commit;")).toBe(true);
  });

  it("crée la table public.app_admins avec PK user_id et FK auth.users", () => {
    expect(sql).toMatch(/create\s+table\s+public\.app_admins\s*\(/i);
    expect(sql).toMatch(
      /user_id\s+uuid\s+primary\s+key\s+references\s+auth\.users\(id\)\s+on\s+delete\s+cascade/i,
    );
  });

  it("contraint le rôle à ('super_admin','admin')", () => {
    expect(sql).toMatch(
      /role\s+text\s+not\s+null\s+check\s*\(\s*role\s+in\s*\(\s*'super_admin'\s*,\s*'admin'\s*\)\s*\)/i,
    );
  });

  it("active RLS sur app_admins", () => {
    expect(sql).toMatch(
      /alter\s+table\s+public\.app_admins\s+enable\s+row\s+level\s+security/i,
    );
  });

  it("définit les 2 helpers SECURITY DEFINER (is_super_admin, is_admin) avec search_path figé", () => {
    for (const fn of ["is_super_admin", "is_admin"]) {
      expect(sql).toMatch(
        new RegExp(
          `create\\s+or\\s+replace\\s+function\\s+public\\.${fn}\\(\\s*\\)[\\s\\S]*?security\\s+definer`,
          "i",
        ),
      );
      expect(sql).toMatch(
        new RegExp(
          `create\\s+or\\s+replace\\s+function\\s+public\\.${fn}\\(\\s*\\)[\\s\\S]*?set\\s+search_path\\s*=\\s*public,\\s*pg_catalog`,
          "i",
        ),
      );
    }
  });

  it("grant execute sur les 2 helpers à authenticated", () => {
    expect(sql).toMatch(
      /grant\s+execute\s+on\s+function\s+public\.is_super_admin\(\)\s+to\s+authenticated/i,
    );
    expect(sql).toMatch(
      /grant\s+execute\s+on\s+function\s+public\.is_admin\(\)\s+to\s+authenticated/i,
    );
  });

  it("crée 4 policies RLS sur app_admins (SELECT/INSERT/UPDATE/DELETE)", () => {
    const expected = [
      "app_admins_select_admins",
      "app_admins_insert_super_admin",
      "app_admins_update_super_admin",
      "app_admins_delete_super_admin_not_self",
    ];
    for (const p of expected) {
      expect(sql).toMatch(
        new RegExp(
          `create\\s+policy\\s+"${p}"\\s+on\\s+public\\.app_admins`,
          "i",
        ),
      );
    }
  });

  it("la policy DELETE bloque l'auto-révocation (user_id <> auth.uid())", () => {
    // On vérifie la présence des deux conditions dans la policy DELETE
    const block = sql.match(
      /create\s+policy\s+"app_admins_delete_super_admin_not_self"[\s\S]*?(?=create\s+policy|commit;)/i,
    );
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(/public\.is_super_admin\(\s*\)/i);
    expect(block![0]).toMatch(
      /user_id\s*<>\s*\(\s*select\s+auth\.uid\(\s*\)\s*\)/i,
    );
  });

  it("INSERT du premier super_admin (UUID bda83e06-…)", () => {
    expect(sql).toMatch(
      /insert\s+into\s+public\.app_admins\s*\([^)]*\)\s*values\s*\(\s*'bda83e06-83f4-4134-b704-99442996a543'\s*,\s*'super_admin'/i,
    );
  });

  it("toutes les policies app_admins spécifient TO authenticated", () => {
    const policies =
      sql.match(/create\s+policy\s+"app_admins_[\s\S]*?(?=create\s+policy|insert\s+into\s+public\.app_admins|delete\s+from\s+public\.exercise_overrides|commit;)/gi) ??
      [];
    expect(policies.length).toBe(4);
    for (const p of policies) {
      expect(p).toMatch(/to\s+authenticated\b/i);
    }
  });
});
