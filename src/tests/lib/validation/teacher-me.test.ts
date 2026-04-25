// Phase E.2.3.1 — Tests Zod pour les schémas de réponse /api/teacher/me/*.

import { describe, it, expect } from "vitest";
import {
  MembershipItemSchema,
  MembershipsResponseSchema,
  TeacherClassItemSchema,
  TeacherClassesResponseSchema,
} from "@/lib/validation/teacher-me";

const ORG = "00000000-0000-0000-0001-000000000001";
const CLS = "00000000-0000-0000-0001-200000000001";

describe("MembershipItemSchema", () => {
  it("accepte un item valide", () => {
    const ok = MembershipItemSchema.safeParse({
      org_id: ORG,
      org_name: "Lycée Tazieff",
      org_type: "lycee",
      role: "teacher",
      joined_at: "2026-01-15T10:00:00Z",
    });
    expect(ok.success).toBe(true);
  });

  it("accepte org_type et joined_at null", () => {
    const ok = MembershipItemSchema.safeParse({
      org_id: ORG,
      org_name: "Lycée X",
      org_type: null,
      role: "org_admin",
      joined_at: null,
    });
    expect(ok.success).toBe(true);
  });

  it("refuse un org_id non UUID", () => {
    const ko = MembershipItemSchema.safeParse({
      org_id: "not-a-uuid",
      org_name: "X",
      org_type: null,
      role: "teacher",
      joined_at: null,
    });
    expect(ko.success).toBe(false);
  });
});

describe("MembershipsResponseSchema", () => {
  it("accepte un tableau vide", () => {
    const ok = MembershipsResponseSchema.safeParse({ memberships: [] });
    expect(ok.success).toBe(true);
  });

  it("valide un tableau d'items", () => {
    const ok = MembershipsResponseSchema.safeParse({
      memberships: [
        {
          org_id: ORG,
          org_name: "X",
          org_type: "lycee",
          role: "teacher",
          joined_at: null,
        },
      ],
    });
    expect(ok.success).toBe(true);
  });
});

describe("TeacherClassItemSchema", () => {
  it("accepte un item valide", () => {
    const ok = TeacherClassItemSchema.safeParse({
      id: CLS,
      name: "2nde B",
      level: "Seconde",
      org_id: ORG,
      org_name: "Lycée Tazieff",
      code: "ABC123",
      students_count: 15,
      created_at: "2026-03-01T09:00:00Z",
    });
    expect(ok.success).toBe(true);
  });

  it("accepte level et created_at null", () => {
    const ok = TeacherClassItemSchema.safeParse({
      id: CLS,
      name: "X",
      level: null,
      org_id: ORG,
      org_name: "Y",
      code: "CODE00",
      students_count: 0,
      created_at: null,
    });
    expect(ok.success).toBe(true);
  });

  it("refuse students_count négatif", () => {
    const ko = TeacherClassItemSchema.safeParse({
      id: CLS,
      name: "X",
      level: null,
      org_id: ORG,
      org_name: "Y",
      code: "CODE00",
      students_count: -1,
      created_at: null,
    });
    expect(ko.success).toBe(false);
  });

  it("refuse students_count décimal", () => {
    const ko = TeacherClassItemSchema.safeParse({
      id: CLS,
      name: "X",
      level: null,
      org_id: ORG,
      org_name: "Y",
      code: "CODE00",
      students_count: 1.5,
      created_at: null,
    });
    expect(ko.success).toBe(false);
  });
});

describe("TeacherClassesResponseSchema", () => {
  it("accepte un tableau vide", () => {
    const ok = TeacherClassesResponseSchema.safeParse({ classes: [] });
    expect(ok.success).toBe(true);
  });
});
