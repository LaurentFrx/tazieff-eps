// Sprint E1 — Tests de GET /api/me/classes.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GET } from "@/app/api/me/classes/route";

const mockCreate = createSupabaseServerClient as unknown as ReturnType<
  typeof vi.fn
>;

type Row = {
  id: string;
  name: string;
  school_year: string | null;
  teacher_user_id: string;
  organizations: { name: string } | { name: string }[] | null;
};

function makeSupabase(
  user: { id: string } | null,
  result: { data: Row[] | null; error: { message: string } | null },
) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
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

describe("GET /api/me/classes", () => {
  it("200 avec classes: [] si pas de user (anonyme)", async () => {
    mockCreate.mockResolvedValue(makeSupabase(null, { data: [], error: null }));
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store, must-revalidate");
    const body = await res.json();
    expect(body.classes).toEqual([]);
  });

  it("200 avec classes: [] si authentifié mais sans inscription", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({ id: "u-1" }, { data: [], error: null }),
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.classes).toEqual([]);
  });

  it("retourne le format attendu (id, name, school_year, teacher_name, org_name) pour une classe", async () => {
    const rows: Row[] = [
      {
        id: "c-1",
        name: "2nde B",
        school_year: "Seconde",
        teacher_user_id: "t-1",
        organizations: { name: "Lycée Tazieff" },
      },
    ];
    mockCreate.mockResolvedValue(
      makeSupabase({ id: "u-1" }, { data: rows, error: null }),
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.classes).toHaveLength(1);
    expect(body.classes[0]).toEqual({
      id: "c-1",
      name: "2nde B",
      school_year: "Seconde",
      teacher_name: null,
      org_name: "Lycée Tazieff",
    });
  });

  it("traite organizations comme tableau ou objet (compat Supabase)", async () => {
    const rows: Row[] = [
      {
        id: "c-1",
        name: "X",
        school_year: null,
        teacher_user_id: "t-1",
        organizations: [{ name: "Tazieff Array" }],
      },
    ];
    mockCreate.mockResolvedValue(
      makeSupabase({ id: "u-1" }, { data: rows, error: null }),
    );
    const res = await GET();
    const body = await res.json();
    expect(body.classes[0].org_name).toBe("Tazieff Array");
  });

  it("200 avec classes: [] si erreur Supabase (failsafe)", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase(
        { id: "u-1" },
        { data: null, error: { message: "boom" } },
      ),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.classes).toEqual([]);
    errorSpy.mockRestore();
  });
});
