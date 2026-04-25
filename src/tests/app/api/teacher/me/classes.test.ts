// Phase E.2.3.1 — Tests de la route GET /api/teacher/me/classes.
//
// On mocke `createSupabaseServerClient`. Cas couverts :
//   1. pas d'auth → 401
//   2. user authentifié, aucune classe → { classes: [] }
//   3. user authentifié, classes avec enrollments → mapping + count
//   4. classes sans enrollments → students_count = 0
//   5. erreur DB → 500

import { describe, it, expect, vi, beforeEach } from "vitest";

// `server-only` est un marker Next.js qui throw côté client. En test,
// on le neutralise pour pouvoir importer la route handler.
vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GET } from "@/app/api/teacher/me/classes/route";

const mockCreate = createSupabaseServerClient as unknown as ReturnType<
  typeof vi.fn
>;

type MockRow = {
  id: string;
  name: string;
  school_year: string | null;
  join_code: string;
  created_at: string | null;
  organization: { id: string; name: string } | null;
  enrollments: { student_user_id: string }[] | null;
};

function makeSupabase(
  user: { id: string } | null,
  result: { data: MockRow[] | null; error: { message: string } | null },
) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.is = vi.fn(() => chain);
  chain.order = vi.fn(() => Promise.resolve(result));
  return {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user } })),
    },
    from: vi.fn(() => chain),
  };
}

beforeEach(() => {
  mockCreate.mockReset();
});

describe("GET /api/teacher/me/classes", () => {
  it("401 si pas de user", async () => {
    mockCreate.mockResolvedValue(makeSupabase(null, { data: [], error: null }));
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("unauthenticated");
  });

  it("retourne { classes: [] } si aucune classe", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({ id: "u-1" }, { data: [], error: null }),
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.classes).toEqual([]);
  });

  it("mappe correctement classes + orga + count élèves", async () => {
    const rows: MockRow[] = [
      {
        id: "00000000-0000-0000-0001-200000000001",
        name: "2nde B",
        school_year: "Seconde",
        join_code: "ABC123",
        created_at: "2026-03-01T09:00:00Z",
        organization: {
          id: "00000000-0000-0000-0001-000000000001",
          name: "Lycée Tazieff",
        },
        enrollments: [
          { student_user_id: "s-1" },
          { student_user_id: "s-2" },
          { student_user_id: "s-3" },
        ],
      },
      {
        id: "00000000-0000-0000-0001-200000000002",
        name: "1ère A",
        school_year: null,
        join_code: "XYZ789",
        created_at: "2026-03-15T09:00:00Z",
        organization: {
          id: "00000000-0000-0000-0001-000000000001",
          name: "Lycée Tazieff",
        },
        enrollments: [],
      },
    ];
    mockCreate.mockResolvedValue(
      makeSupabase({ id: "u-1" }, { data: rows, error: null }),
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.classes).toHaveLength(2);
    expect(body.classes[0]).toEqual({
      id: "00000000-0000-0000-0001-200000000001",
      name: "2nde B",
      level: "Seconde",
      org_id: "00000000-0000-0000-0001-000000000001",
      org_name: "Lycée Tazieff",
      code: "ABC123",
      students_count: 3,
      created_at: "2026-03-01T09:00:00Z",
    });
    expect(body.classes[1].level).toBeNull();
    expect(body.classes[1].students_count).toBe(0);
  });

  it("traite enrollments null (Supabase peut renvoyer null si aucune ligne)", async () => {
    const rows = [
      {
        id: "00000000-0000-0000-0001-200000000003",
        name: "Term C",
        school_year: "Terminale",
        join_code: "TRM456",
        created_at: "2026-04-01T09:00:00Z",
        organization: {
          id: "00000000-0000-0000-0001-000000000001",
          name: "Lycée Tazieff",
        },
        enrollments: null,
      },
    ] as unknown as MockRow[];
    mockCreate.mockResolvedValue(
      makeSupabase({ id: "u-1" }, { data: rows, error: null }),
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.classes[0].students_count).toBe(0);
  });

  it("500 si erreur Supabase", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase(
        { id: "u-1" },
        { data: null, error: { message: "boom" } },
      ),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("internal");
    errorSpy.mockRestore();
  });
});
