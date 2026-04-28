// Phase P0.1 — Tests de la route GET /api/me/role.
//
// Comportement : toujours 200 (pas de leak d'info), retourne deux booléens
// is_super_admin / is_admin. Cache-Control: no-store.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GET } from "@/app/api/me/role/route";

const mockCreate = createSupabaseServerClient as unknown as ReturnType<
  typeof vi.fn
>;

type AppAdminRow = { role: "super_admin" | "admin" } | null;

function makeSupabase(
  user: { id: string } | null,
  result: { data: AppAdminRow; error: { message: string } | null },
) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
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

describe("GET /api/me/role", () => {
  it("anonymous : 200 avec tout false (pas de leak)", async () => {
    mockCreate.mockResolvedValue(makeSupabase(null, { data: null, error: null }));
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store, must-revalidate");
    const body = await res.json();
    expect(body).toEqual({ is_super_admin: false, is_admin: false });
  });

  it("authentifié non-admin : 200 avec tout false", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({ id: "u-1" }, { data: null, error: null }),
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ is_super_admin: false, is_admin: false });
  });

  it("authentifié super_admin : 200 avec is_super_admin=true et is_admin=true", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase(
        { id: "u-1" },
        { data: { role: "super_admin" }, error: null },
      ),
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ is_super_admin: true, is_admin: true });
  });

  it("authentifié admin simple : 200 avec is_super_admin=false et is_admin=true", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({ id: "u-2" }, { data: { role: "admin" }, error: null }),
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ is_super_admin: false, is_admin: true });
  });

  it("Cache-Control no-store appliqué dans tous les cas", async () => {
    mockCreate.mockResolvedValue(makeSupabase(null, { data: null, error: null }));
    const res = await GET();
    expect(res.headers.get("Cache-Control")).toBe("no-store, must-revalidate");
  });
});
