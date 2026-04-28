// Sprint E1 — Tests structurels de la migration student_profiles.
//
// Référence : GOUVERNANCE_EDITORIALE.md §2.4, §3.3.

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const MIGRATIONS_DIR = resolve(REPO_ROOT, "supabase", "migrations");

function loadMigration(): { filename: string; sql: string } {
  const files = readdirSync(MIGRATIONS_DIR);
  const match = files.find((f) =>
    /e1_student_profiles\.sql$/.test(f),
  );
  if (!match) {
    throw new Error(`Migration E1 introuvable dans ${MIGRATIONS_DIR}`);
  }
  const sql = readFileSync(resolve(MIGRATIONS_DIR, match), "utf8");
  return { filename: match, sql };
}

describe("E1 — table student_profiles + helper is_teacher_of_student", () => {
  const { filename, sql } = loadMigration();

  it("le fichier de migration existe avec un timestamp 14 chars", () => {
    expect(filename).toMatch(/^\d{14}_e1_student_profiles\.sql$/);
  });

  it("est enveloppée dans begin; ... commit;", () => {
    expect(sql).toMatch(/^\s*(--.*\n|\s)*begin;/m);
    expect(sql.trim().endsWith("commit;")).toBe(true);
  });

  it("crée la table public.student_profiles avec PK user_id et FK auth.users", () => {
    expect(sql).toMatch(/create\s+table\s+public\.student_profiles\s*\(/i);
    expect(sql).toMatch(
      /user_id\s+uuid\s+primary\s+key\s+references\s+auth\.users\(id\)\s+on\s+delete\s+cascade/i,
    );
  });

  it("contraint first_name et last_name NOT NULL avec longueur 1-60", () => {
    expect(sql).toMatch(
      /first_name\s+text\s+not\s+null\s+check\s*\(\s*length\(\s*trim\(first_name\)\s*\)\s+between\s+1\s+and\s+60\s*\)/i,
    );
    expect(sql).toMatch(
      /last_name\s+text\s+not\s+null\s+check\s*\(\s*length\(\s*trim\(last_name\)\s*\)\s+between\s+1\s+and\s+60\s*\)/i,
    );
  });

  it("active RLS sur student_profiles", () => {
    expect(sql).toMatch(
      /alter\s+table\s+public\.student_profiles\s+enable\s+row\s+level\s+security/i,
    );
  });

  it("crée l'index ix_student_profiles_lastname (last_name, first_name)", () => {
    expect(sql).toMatch(
      /create\s+index\s+ix_student_profiles_lastname\s+on\s+public\.student_profiles\(last_name,\s*first_name\)/i,
    );
  });

  it("définit le trigger updated_at avant chaque UPDATE", () => {
    expect(sql).toMatch(
      /create\s+or\s+replace\s+function\s+public\.tg_set_updated_at_student_profiles\(\s*\)/i,
    );
    expect(sql).toMatch(
      /create\s+trigger\s+trg_student_profiles_updated_at\s+before\s+update\s+on\s+public\.student_profiles/i,
    );
  });

  it("définit le helper SECURITY DEFINER is_teacher_of_student avec search_path figé", () => {
    expect(sql).toMatch(
      /create\s+or\s+replace\s+function\s+public\.is_teacher_of_student\s*\(\s*p_student_user_id\s+uuid\s*\)[\s\S]*?security\s+definer/i,
    );
    expect(sql).toMatch(
      /create\s+or\s+replace\s+function\s+public\.is_teacher_of_student[\s\S]*?set\s+search_path\s*=\s*public,\s*pg_catalog/i,
    );
    expect(sql).toMatch(
      /grant\s+execute\s+on\s+function\s+public\.is_teacher_of_student\(uuid\)\s+to\s+authenticated/i,
    );
  });

  it("crée les 4 policies RLS attendues", () => {
    const expected = [
      "student_profiles_select",
      "student_profiles_insert_self",
      "student_profiles_update_self",
      "student_profiles_delete",
    ];
    for (const p of expected) {
      expect(sql).toMatch(
        new RegExp(
          `create\\s+policy\\s+"${p}"\\s+on\\s+public\\.student_profiles`,
          "i",
        ),
      );
    }
  });

  it("la policy SELECT combine self + is_teacher_of_student + is_admin via OR", () => {
    const block = sql.match(
      /create\s+policy\s+"student_profiles_select"[\s\S]*?(?=create\s+policy|commit;)/i,
    );
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(/user_id\s*=\s*\(\s*select\s+auth\.uid\(\s*\)\s*\)/i);
    expect(block![0]).toMatch(/public\.is_teacher_of_student\(\s*user_id\s*\)/i);
    expect(block![0]).toMatch(/public\.is_admin\(\s*\)/i);
  });

  it("la policy INSERT exige user_id = auth.uid() (auto-création uniquement)", () => {
    const block = sql.match(
      /create\s+policy\s+"student_profiles_insert_self"[\s\S]*?(?=create\s+policy|commit;)/i,
    );
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(
      /with\s+check\s*\(\s*user_id\s*=\s*\(\s*select\s+auth\.uid\(\s*\)\s*\)\s*\)/i,
    );
  });

  it("toutes les policies student_profiles_* spécifient TO authenticated", () => {
    const policies =
      sql.match(/create\s+policy\s+"student_profiles_[\s\S]*?(?=create\s+policy|commit;)/gi) ??
      [];
    expect(policies.length).toBe(4);
    for (const p of policies) {
      expect(p).toMatch(/to\s+authenticated\b/i);
    }
  });
});
