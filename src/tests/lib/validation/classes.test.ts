// Phase E.2.3.4 — Tests Zod pour les schémas classes.

import { describe, it, expect } from "vitest";
import { CreateClassSchema, CLASS_LEVELS } from "@/lib/validation/classes";

const ORG = "00000000-0000-0000-0001-000000000001";

describe("CreateClassSchema", () => {
  it("accepte un payload minimal valide", () => {
    const ok = CreateClassSchema.safeParse({
      organization_id: ORG,
      name: "2nde B",
    });
    expect(ok.success).toBe(true);
  });

  it("accepte school_year optionnel", () => {
    const ok = CreateClassSchema.safeParse({
      organization_id: ORG,
      name: "1ère A",
      school_year: "Première",
    });
    expect(ok.success).toBe(true);
  });

  it("accepte school_year vide (transformé en undefined)", () => {
    const ok = CreateClassSchema.safeParse({
      organization_id: ORG,
      name: "Test",
      school_year: "",
    });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.school_year).toBeUndefined();
    }
  });

  it("refuse un name vide", () => {
    const ko = CreateClassSchema.safeParse({
      organization_id: ORG,
      name: "",
    });
    expect(ko.success).toBe(false);
  });

  it("refuse un name > 100 chars", () => {
    const ko = CreateClassSchema.safeParse({
      organization_id: ORG,
      name: "x".repeat(101),
    });
    expect(ko.success).toBe(false);
  });

  it("refuse un organization_id non UUID", () => {
    const ko = CreateClassSchema.safeParse({
      organization_id: "nope",
      name: "Test",
    });
    expect(ko.success).toBe(false);
  });

  it("refuse les champs en trop (strict)", () => {
    const ko = CreateClassSchema.safeParse({
      organization_id: ORG,
      name: "Test",
      teacher_user_id: "u-1", // interdit (doit être forcé serveur)
    });
    expect(ko.success).toBe(false);
  });
});

describe("CLASS_LEVELS", () => {
  it("contient les 4 niveaux UI", () => {
    expect(CLASS_LEVELS).toEqual(["Seconde", "Première", "Terminale", "Autre"]);
  });
});
