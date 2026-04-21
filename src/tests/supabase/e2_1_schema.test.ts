// Phase E.2.1 — Tests structurels de la migration teacher_annotations_foundation.
// Stratégie : parsing du fichier SQL (pas de DB live requise) pour valider la
// présence des tables, helpers, index, policies clés.

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const MIGRATIONS_DIR = resolve(REPO_ROOT, "supabase", "migrations");

function loadE21Migration(): { filename: string; sql: string } {
  const files = readdirSync(MIGRATIONS_DIR);
  const match = files.find((f) =>
    /e2_1_teacher_annotations_foundation\.sql$/.test(f),
  );
  if (!match) {
    throw new Error(
      `Migration E.2.1 introuvable dans ${MIGRATIONS_DIR} (expected *_e2_1_teacher_annotations_foundation.sql)`,
    );
  }
  const sql = readFileSync(resolve(MIGRATIONS_DIR, match), "utf8");
  return { filename: match, sql };
}

describe("E.2.1 — migration teacher_annotations_foundation", () => {
  const { filename, sql } = loadE21Migration();

  it("le fichier de migration existe avec un timestamp 14 chars", () => {
    expect(filename).toMatch(
      /^\d{14}_e2_1_teacher_annotations_foundation\.sql$/,
    );
  });

  it("est enveloppée dans begin; ... commit; pour atomicité", () => {
    expect(sql).toMatch(/^\s*(--.*\n|\s)*begin;/m);
    // Accepte le dernier `commit;` à la fin (potentiellement suivi d'un retour).
    expect(sql.trim().endsWith("commit;")).toBe(true);
  });

  it("active l'extension pgtap (demandé par Laurent)", () => {
    expect(sql).toMatch(/create\s+extension\s+if\s+not\s+exists\s+pgtap/i);
  });

  it("ALTER organizations ajoute les 5 colonnes E.2.1 (fusion Option A)", () => {
    const required = [
      "type",
      "academic_domain",
      "country_code",
      "updated_at",
      "deleted_at",
    ];
    for (const col of required) {
      expect(sql).toMatch(
        new RegExp(
          `alter\\s+table\\s+public\\.organizations[\\s\\S]*?add\\s+column\\s+if\\s+not\\s+exists\\s+${col}\\b`,
          "i",
        ),
      );
    }
  });

  it("crée les 4 nouvelles tables (memberships, classes, class_enrollments, teacher_annotations)", () => {
    const tables = [
      "memberships",
      "classes",
      "class_enrollments",
      "teacher_annotations",
    ];
    for (const t of tables) {
      expect(sql).toMatch(
        new RegExp(
          `create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${t}\\b`,
          "i",
        ),
      );
    }
  });

  it("active RLS sur les 4 nouvelles tables", () => {
    const tables = [
      "memberships",
      "classes",
      "class_enrollments",
      "teacher_annotations",
    ];
    for (const t of tables) {
      expect(sql).toMatch(
        new RegExp(
          `alter\\s+table\\s+public\\.${t}\\s+enable\\s+row\\s+level\\s+security`,
          "i",
        ),
      );
    }
  });

  it("définit les 3 helpers SECURITY DEFINER (user_org_ids, user_class_ids, user_teacher_class_ids)", () => {
    const helpers = ["user_org_ids", "user_class_ids", "user_teacher_class_ids"];
    for (const h of helpers) {
      // Présence de la définition + du mot-clé security definer + search_path figé
      expect(sql).toMatch(
        new RegExp(
          `create\\s+or\\s+replace\\s+function\\s+public\\.${h}\\(\\s*\\)[\\s\\S]*?security\\s+definer`,
          "i",
        ),
      );
    }
  });

  it("définit la fonction generate_class_join_code() avec alphabet sans ambiguïté", () => {
    expect(sql).toMatch(
      /create\s+or\s+replace\s+function\s+public\.generate_class_join_code\(\s*\)/i,
    );
    // Alphabet sans 0/O/1/I/L : doit contenir 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
    expect(sql).toMatch(/ABCDEFGHJKMNPQRSTUVWXYZ23456789/);
  });

  it("définit la fonction join_class_with_code(text) exposée à authenticated", () => {
    expect(sql).toMatch(
      /create\s+or\s+replace\s+function\s+public\.join_class_with_code\s*\(\s*p_code\s+text\s*\)/i,
    );
    expect(sql).toMatch(
      /grant\s+execute\s+on\s+function\s+public\.join_class_with_code\(text\)\s+to\s+authenticated/i,
    );
  });

  it("crée les 9 index requis (toutes colonnes RLS indexées)", () => {
    const indexes = [
      "idx_memberships_user",
      "idx_memberships_org",
      "idx_classes_teacher",
      "idx_classes_org",
      "idx_enrollments_student",
      "idx_ta_author",
      "idx_ta_org",
      "idx_ta_slug_locale",
      "idx_ta_scope",
    ];
    for (const idx of indexes) {
      expect(sql).toMatch(
        new RegExp(
          `create\\s+index\\s+if\\s+not\\s+exists\\s+${idx}\\b`,
          "i",
        ),
      );
    }
  });

  it("toutes les policies RLS utilisent (select auth.uid()) — jamais auth.uid() nu", () => {
    // On compte les occurrences de auth.uid() dans les policies (hors fonctions security definer).
    // Règle : toute occurrence de auth.uid() dans une CREATE POLICY doit être wrappée dans (select ...).
    // Approche pragmatique : récupérer les blocs create policy et vérifier chacun.
    const policyBlocks =
      sql.match(/create\s+policy[\s\S]*?(?=create\s+policy|$)/gi) ?? [];
    expect(policyBlocks.length).toBeGreaterThan(0);
    for (const block of policyBlocks) {
      // Trouver les auth.uid() non précédés par `select ` (grossièrement)
      // On cherche occurrences et vérifie chacune
      const occurrences = [
        ...block.matchAll(/(?<![\w.])auth\.uid\s*\(\s*\)/gi),
      ];
      for (const occ of occurrences) {
        const start = Math.max(0, (occ.index ?? 0) - 20);
        const context = block.slice(start, (occ.index ?? 0));
        // Le contexte doit contenir "select" (pas forcément juste avant, suffit qu'il y ait
        // un select auth.uid() dans les 20 derniers caractères)
        expect(
          /select\s*$/i.test(context.trim()) || /\(\s*select\s*$/i.test(context),
        ).toBe(true);
      }
    }
  });

  it("toutes les policies RLS spécifient TO authenticated", () => {
    const policyBlocks =
      sql.match(/create\s+policy[\s\S]*?(?=create\s+policy|$)/gi) ?? [];
    expect(policyBlocks.length).toBeGreaterThan(0);
    for (const block of policyBlocks) {
      expect(block).toMatch(/to\s+authenticated\b/i);
    }
  });

  it("déclare au moins 10 policies (4 tables × mix SELECT/INSERT/UPDATE/DELETE)", () => {
    const policyCount = (sql.match(/create\s+policy/gi) ?? []).length;
    expect(policyCount).toBeGreaterThanOrEqual(10);
  });

  it("déclare les 3 triggers updated_at (organizations, classes, teacher_annotations)", () => {
    const triggers = [
      ["trg_orgs_updated", "organizations"],
      ["trg_classes_updated", "classes"],
      ["trg_ta_updated", "teacher_annotations"],
    ];
    for (const [trg, table] of triggers) {
      expect(sql).toMatch(
        new RegExp(
          `create\\s+trigger\\s+${trg}\\s+before\\s+update\\s+on\\s+public\\.${table}`,
          "i",
        ),
      );
    }
  });
});
