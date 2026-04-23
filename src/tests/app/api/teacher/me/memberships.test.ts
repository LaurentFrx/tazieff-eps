// Phase E.2.3.1 — Tests de la route GET /api/teacher/me/memberships.
//
// On mocke `createSupabaseServerClient` pour isoler les 4 cas :
//   1. pas d'auth → 401
//   2. user authentifié, aucune membership → { memberships: [] }
//   3. user authentifié, plusieurs memberships → mapping correct
//   4. erreur DB → 500

import { describe, it, expect, vi, beforeEach } from "vitest";

// `server-only` est un marker Next.js qui throw côté client. En test,
// on le neutralise pour pouvoir importer la route handler.
vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GET } from "@/app/api/teacher/me/memberships/route";

const mockCreate = createSupabaseServerClient as unknown as ReturnType<
  typeof vi.fn
>;

type MockRow = {
  role: string;
  created_at: string | null;
  organization: { id: string; name: string; type: string | null } | null;
};

function makeSupabase(
  user: { id: string } | null,
  result: { data: MockRow[] | null; error: { message: string } | null },
) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
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

describe("GET /api/teacher/me/memberships", () => {
  it("401 si pas de user", async () => {
    mockCreate.mockResolvedValue(makeSupabase(null, { data: [], error: null }));
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("unauthenticated");
  });

  it("retourne { memberships: [] } si aucune membership", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({ id: "u-1" }, { data: [], error: null }),
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.memberships).toEqual([]);
  });

  it("mappe correctement plusieurs memberships", async () => {
    const rows: MockRow[] = [
      {
        role: "teacher",
        created_at: "2026-01-15T10:00:00Z",
        organization: {
          id: "00000000-0000-0000-0001-000000000001",
          name: "Lycée Haroun Tazieff",
          type: "lycee",
        },
      },
      {
        role: "org_admin",
        created_at: "2026-02-20T10:00:00Z",
        organization: {
          id: "00000000-0000-0000-0001-000000000002",
          name: "Lycée Autre",
          type: null,
        },
      },
    ];
    mockCreate.mockResolvedValue(
      makeSupabase({ id: "u-1" }, { data: rows, error: null }),
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.memberships).toHaveLength(2);
    expect(body.memberships[0]).toEqual({
      org_id: "00000000-0000-0000-0001-000000000001",
      org_name: "Lycée Haroun Tazieff",
      org_type: "lycee",
      role: "teacher",
      joined_at: "2026-01-15T10:00:00Z",
    });
    expect(body.memberships[1].org_type).toBeNull();
    expect(body.memberships[1].role).toBe("org_admin");
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

  it("gère une organisation retournée sous forme de tableau (edge Supabase)", async () => {
    const rows = [
      {
        role: "teacher",
        created_at: "2026-03-01T10:00:00Z",
        organization: [
          {
            id: "00000000-0000-0000-0001-000000000003",
            name: "Lycée Array",
            type: "lycee",
          },
        ],
      },
    ] as unknown as MockRow[];
    mockCreate.mockResolvedValue(
      makeSupabase({ id: "u-1" }, { data: rows, error: null }),
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.memberships[0].org_name).toBe("Lycée Array");
  });
});
