// Phase E.2.2 — Tests Zod pour les schémas annotations.
// Objectif : >20 cas (valides + invalides + cohérence scope/scope_id).

import { describe, it, expect } from "vitest";
import {
  CreateAnnotationSchema,
  UpdateAnnotationSchema,
  AnnotationContentSchema,
} from "@/lib/validation/annotations";

const ORG = "00000000-0000-0000-0001-000000000001";
const CLASS = "00000000-0000-0000-0001-100000000001";

describe("CreateAnnotationSchema — cas valides", () => {
  it("accepte private minimal (locale défaut)", () => {
    const result = CreateAnnotationSchema.safeParse({
      organization_id: ORG,
      exercise_slug: "s1-01",
      content: {},
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locale).toBe("fr");
      expect(result.data.visibility_scope).toBe("private");
    }
  });

  it("accepte class avec scope_id", () => {
    const result = CreateAnnotationSchema.safeParse({
      organization_id: ORG,
      exercise_slug: "s2-03",
      locale: "en",
      content: { title: "t", notes: "n" },
      visibility_scope: "class",
      scope_id: CLASS,
    });
    expect(result.success).toBe(true);
  });

  it("accepte school sans scope_id", () => {
    const result = CreateAnnotationSchema.safeParse({
      organization_id: ORG,
      exercise_slug: "s3-05",
      locale: "es",
      content: { title: "t" },
      visibility_scope: "school",
    });
    expect(result.success).toBe(true);
  });

  it("accepte exercise_version = null explicite", () => {
    const result = CreateAnnotationSchema.safeParse({
      organization_id: ORG,
      exercise_slug: "s1-01",
      content: {},
      exercise_version: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepte exercise_version positif", () => {
    const result = CreateAnnotationSchema.safeParse({
      organization_id: ORG,
      exercise_slug: "s1-01",
      content: {},
      exercise_version: 3,
    });
    expect(result.success).toBe(true);
  });

  it("accepte media_refs (liste d'UUIDs jusqu'à 10)", () => {
    const result = CreateAnnotationSchema.safeParse({
      organization_id: ORG,
      exercise_slug: "s1-01",
      content: {
        media_refs: Array.from({ length: 10 }, () => ORG),
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepte scope_id explicitement null en private", () => {
    const result = CreateAnnotationSchema.safeParse({
      organization_id: ORG,
      exercise_slug: "s1-01",
      content: {},
      visibility_scope: "private",
      scope_id: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("CreateAnnotationSchema — cas invalides", () => {
  it("rejette organization_id non-uuid", () => {
    const r = CreateAnnotationSchema.safeParse({
      organization_id: "not-a-uuid",
      exercise_slug: "s1-01",
      content: {},
    });
    expect(r.success).toBe(false);
  });

  it("rejette exercise_slug vide", () => {
    const r = CreateAnnotationSchema.safeParse({
      organization_id: ORG,
      exercise_slug: "",
      content: {},
    });
    expect(r.success).toBe(false);
  });

  it("rejette exercise_slug trop long (>100)", () => {
    const r = CreateAnnotationSchema.safeParse({
      organization_id: ORG,
      exercise_slug: "x".repeat(101),
      content: {},
    });
    expect(r.success).toBe(false);
  });

  it("rejette locale inconnue", () => {
    const r = CreateAnnotationSchema.safeParse({
      organization_id: ORG,
      exercise_slug: "s1-01",
      locale: "de",
      content: {},
    });
    expect(r.success).toBe(false);
  });

  it("rejette visibility_scope='class' SANS scope_id", () => {
    const r = CreateAnnotationSchema.safeParse({
      organization_id: ORG,
      exercise_slug: "s1-01",
      content: {},
      visibility_scope: "class",
    });
    expect(r.success).toBe(false);
  });

  it("rejette visibility_scope='private' AVEC scope_id", () => {
    const r = CreateAnnotationSchema.safeParse({
      organization_id: ORG,
      exercise_slug: "s1-01",
      content: {},
      visibility_scope: "private",
      scope_id: CLASS,
    });
    expect(r.success).toBe(false);
  });

  it("rejette visibility_scope='school' AVEC scope_id", () => {
    const r = CreateAnnotationSchema.safeParse({
      organization_id: ORG,
      exercise_slug: "s1-01",
      content: {},
      visibility_scope: "school",
      scope_id: CLASS,
    });
    expect(r.success).toBe(false);
  });

  it("rejette content avec champ inconnu (strict)", () => {
    const r = CreateAnnotationSchema.safeParse({
      organization_id: ORG,
      exercise_slug: "s1-01",
      content: { unknown_field: "x" },
    });
    expect(r.success).toBe(false);
  });

  it("rejette content.notes trop long (>5000)", () => {
    const r = CreateAnnotationSchema.safeParse({
      organization_id: ORG,
      exercise_slug: "s1-01",
      content: { notes: "x".repeat(5001) },
    });
    expect(r.success).toBe(false);
  });

  it("rejette exercise_version négatif", () => {
    const r = CreateAnnotationSchema.safeParse({
      organization_id: ORG,
      exercise_slug: "s1-01",
      content: {},
      exercise_version: -1,
    });
    expect(r.success).toBe(false);
  });

  it("rejette exercise_version = 0", () => {
    const r = CreateAnnotationSchema.safeParse({
      organization_id: ORG,
      exercise_slug: "s1-01",
      content: {},
      exercise_version: 0,
    });
    expect(r.success).toBe(false);
  });

  it("rejette media_refs avec 11 items (>10)", () => {
    const r = CreateAnnotationSchema.safeParse({
      organization_id: ORG,
      exercise_slug: "s1-01",
      content: { media_refs: Array.from({ length: 11 }, () => ORG) },
    });
    expect(r.success).toBe(false);
  });
});

describe("UpdateAnnotationSchema", () => {
  it("accepte un patch vide (aucun champ)", () => {
    const r = UpdateAnnotationSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it("accepte patch content seul", () => {
    const r = UpdateAnnotationSchema.safeParse({
      content: { title: "Nouveau titre" },
    });
    expect(r.success).toBe(true);
  });

  it("accepte changement vers scope=class avec scope_id", () => {
    const r = UpdateAnnotationSchema.safeParse({
      visibility_scope: "class",
      scope_id: CLASS,
    });
    expect(r.success).toBe(true);
  });

  it("accepte changement vers scope=private sans scope_id", () => {
    const r = UpdateAnnotationSchema.safeParse({
      visibility_scope: "private",
    });
    expect(r.success).toBe(true);
  });

  it("rejette scope=class sans scope_id quand fourni", () => {
    const r = UpdateAnnotationSchema.safeParse({
      visibility_scope: "class",
    });
    expect(r.success).toBe(false);
  });

  it("rejette scope=private AVEC scope_id", () => {
    const r = UpdateAnnotationSchema.safeParse({
      visibility_scope: "private",
      scope_id: CLASS,
    });
    expect(r.success).toBe(false);
  });

  it("rejette champs immuables via omit implicite", () => {
    // Le schéma ne les contient pas, donc les rejette via .strict implicite sur parse ? Non.
    // Zod par défaut ignore les clés inconnues (non strict). Notre schéma n'est pas strict.
    // Ici on vérifie qu'un user qui tenterait de passer organization_id se fait juste ignorer.
    const r = UpdateAnnotationSchema.safeParse({
      content: { title: "x" },
      organization_id: ORG, // ignoré
    });
    expect(r.success).toBe(true);
    if (r.success) {
      // organization_id n'est pas dans les champs modifiables
      expect("organization_id" in r.data).toBe(false);
    }
  });

  it("accepte needs_review = true", () => {
    const r = UpdateAnnotationSchema.safeParse({ needs_review: true });
    expect(r.success).toBe(true);
  });
});

describe("AnnotationContentSchema", () => {
  it("accepte un content vide", () => {
    expect(AnnotationContentSchema.safeParse({}).success).toBe(true);
  });

  it("rejette title trop long (>200)", () => {
    const r = AnnotationContentSchema.safeParse({ title: "x".repeat(201) });
    expect(r.success).toBe(false);
  });

  it("rejette un champ inconnu", () => {
    const r = AnnotationContentSchema.safeParse({ random: "x" });
    expect(r.success).toBe(false);
  });
});

// Sprint E.4 (29 avril 2026) — section_target ancrage paragraphe.
describe("CreateAnnotationSchema — section_target (Sprint E.4)", () => {
  it("accepte section_target='general' explicite", () => {
    const r = CreateAnnotationSchema.safeParse({
      organization_id: ORG,
      exercise_slug: "s1-01",
      content: { notes: "x" },
      section_target: "general",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.section_target).toBe("general");
  });

  it("accepte chaque clé InlineParagraphKey (resume/execution/respiration/conseils/securite/dosage)", () => {
    const keys = [
      "resume",
      "execution",
      "respiration",
      "conseils",
      "securite",
      "dosage",
    ] as const;
    for (const key of keys) {
      const r = CreateAnnotationSchema.safeParse({
        organization_id: ORG,
        exercise_slug: "s1-01",
        content: { notes: "x" },
        section_target: key,
      });
      expect(r.success).toBe(true);
    }
  });

  it("accepte section_target absent (équivaut à 'general' côté UI)", () => {
    const r = CreateAnnotationSchema.safeParse({
      organization_id: ORG,
      exercise_slug: "s1-01",
      content: { notes: "x" },
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.section_target).toBeUndefined();
  });

  it("accepte section_target null explicite", () => {
    const r = CreateAnnotationSchema.safeParse({
      organization_id: ORG,
      exercise_slug: "s1-01",
      content: { notes: "x" },
      section_target: null,
    });
    expect(r.success).toBe(true);
  });

  it("rejette une valeur hors enum (ex: 'summary' EN au lieu de 'resume' FR)", () => {
    const r = CreateAnnotationSchema.safeParse({
      organization_id: ORG,
      exercise_slug: "s1-01",
      content: { notes: "x" },
      section_target: "summary",
    });
    expect(r.success).toBe(false);
  });
});

describe("UpdateAnnotationSchema — section_target (Sprint E.4)", () => {
  it("accepte un PATCH ne contenant que section_target", () => {
    const r = UpdateAnnotationSchema.safeParse({ section_target: "dosage" });
    expect(r.success).toBe(true);
  });

  it("rejette un PATCH avec section_target invalide", () => {
    const r = UpdateAnnotationSchema.safeParse({
      section_target: "header",
    });
    expect(r.success).toBe(false);
  });

  it("accepte section_target null pour réancrer à 'general'", () => {
    const r = UpdateAnnotationSchema.safeParse({ section_target: null });
    expect(r.success).toBe(true);
  });
});
