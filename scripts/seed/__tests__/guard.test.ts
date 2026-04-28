/**
 * Sprint E.0 — Tests de la garde preview-only des scripts de seed Phase E.
 *
 * Vérifie que `assertPreviewOnly()` refuse l'exécution dans toutes les
 * configurations dangereuses (URL absente, projet prod connu, SEED_ALLOW
 * manquant, service-role key manquante) et accepte uniquement la
 * configuration explicitement préparée pour preview.
 *
 * Le script ne tente pas de tester la logique réseau Supabase (cf. C.2 du
 * sprint E.0). Seule la garde est testée — c'est la barrière de sécurité.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  assertPreviewOnly,
  PROD_PROJECT_REFS,
  SEED_ALLOW_VALUE,
  TEST_DATA,
} from "../guard";

const ENV_KEYS = [
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SEED_ALLOW",
] as const;

function clearGuardEnv(): void {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

describe("scripts/seed/guard", () => {
  let savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>;

  beforeEach(() => {
    savedEnv = {};
    for (const key of ENV_KEYS) {
      savedEnv[key] = process.env[key];
    }
    clearGuardEnv();
  });

  afterEach(() => {
    clearGuardEnv();
    for (const key of ENV_KEYS) {
      const value = savedEnv[key];
      if (typeof value === "string") {
        process.env[key] = value;
      }
    }
  });

  it("expose la liste des projets prod interdits (au moins un)", () => {
    expect(PROD_PROJECT_REFS.length).toBeGreaterThan(0);
    expect(PROD_PROJECT_REFS).toContain("zefkltkiigxkjcrdesrk");
  });

  it("refuse si SUPABASE_URL est absent", () => {
    expect(() => assertPreviewOnly()).toThrow(/SUPABASE_URL absent/);
  });

  it("refuse si l'URL pointe vers un projet de production connu", () => {
    process.env.SUPABASE_URL = "https://zefkltkiigxkjcrdesrk.supabase.co";
    process.env.SEED_ALLOW = SEED_ALLOW_VALUE;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-role-key";

    expect(() => assertPreviewOnly()).toThrow(/Projet de production détecté/);
  });

  it("refuse si NEXT_PUBLIC_SUPABASE_URL pointe vers la prod", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL =
      "https://zefkltkiigxkjcrdesrk.supabase.co";
    process.env.SEED_ALLOW = SEED_ALLOW_VALUE;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-role-key";

    expect(() => assertPreviewOnly()).toThrow(/Projet de production détecté/);
  });

  it("refuse si SEED_ALLOW est absent (URL preview valide pourtant)", () => {
    process.env.SUPABASE_URL = "https://abcde-preview-12345.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-role-key";

    expect(() => assertPreviewOnly()).toThrow(/SEED_ALLOW=preview-test requis/);
  });

  it("refuse si SEED_ALLOW a une valeur incorrecte", () => {
    process.env.SUPABASE_URL = "https://abcde-preview-12345.supabase.co";
    process.env.SEED_ALLOW = "yes-please";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-role-key";

    expect(() => assertPreviewOnly()).toThrow(/SEED_ALLOW=preview-test requis/);
  });

  it("refuse si SUPABASE_SERVICE_ROLE_KEY est absent", () => {
    process.env.SUPABASE_URL = "https://abcde-preview-12345.supabase.co";
    process.env.SEED_ALLOW = SEED_ALLOW_VALUE;

    expect(() => assertPreviewOnly()).toThrow(/SUPABASE_SERVICE_ROLE_KEY absent/);
  });

  it("accepte si toutes les conditions sont réunies", () => {
    process.env.SUPABASE_URL = "https://abcde-preview-12345.supabase.co";
    process.env.SEED_ALLOW = SEED_ALLOW_VALUE;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-role-key";

    const result = assertPreviewOnly();
    expect(result.url).toBe("https://abcde-preview-12345.supabase.co");
    expect(result.serviceRoleKey).toBe("fake-service-role-key");
  });

  it("expose les constantes TEST_DATA attendues par les scripts seed/cleanup", () => {
    expect(TEST_DATA.emailDomain).toBe("@test.local");
    expect(TEST_DATA.emails.prof).toBe("prof.test@test.local");
    expect(TEST_DATA.emails.eleve1).toBe("eleve1.test@test.local");
    expect(TEST_DATA.emails.eleve2).toBe("eleve2.test@test.local");
    expect(TEST_DATA.exerciseSlug).toBe("s1-01");
    expect(TEST_DATA.locale).toBe("fr");
    expect(TEST_DATA.annotations.map((a) => a.scope)).toEqual([
      "private",
      "class",
      "school",
    ]);
  });
});
