// Sprint E.4 (29 avril 2026) — couverture des endpoints
// GET et PATCH /api/me/profile (saisie display_name par membership).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GET, PATCH } from "@/app/api/me/profile/route";

const mockCreate = createSupabaseServerClient as unknown as ReturnType<
  typeof vi.fn
>;

const ORG = "00000000-0000-0000-0001-000000000001";

type MembershipRow = {
  organization_id: string;
  role: string;
  display_name: string | null;
  organizations: { name: string } | null;
};

function makeSupabaseGet(
  user: { id: string } | null,
  rows: MembershipRow[] | null,
  error?: { message: string },
) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  let calls = 0;
  chain.eq = vi.fn(() => {
    calls += 1;
    if (calls >= 2) {
      return Promise.resolve({ data: rows, error: error ?? null });
    }
    return chain;
  });
  return {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user } })),
    },
    from: vi.fn(() => chain),
  };
}

function makeSupabasePatch({
  user,
  result,
}: {
  user: { id: string } | null;
  result: { data: unknown; error: { code: string; message: string } | null };
}) {
  const chain: Record<string, unknown> = {};
  chain.update = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.select = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve(result));
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

describe("GET /api/me/profile", () => {
  it("401 si non authentifié", async () => {
    mockCreate.mockResolvedValue(makeSupabaseGet(null, null));
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("200 avec memberships transformés (organization_name extrait)", async () => {
    mockCreate.mockResolvedValue(
      makeSupabaseGet({ id: "u-1" }, [
        {
          organization_id: ORG,
          role: "teacher",
          display_name: "Mme D.",
          organizations: { name: "Lycée Tazieff" },
        },
      ]),
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      memberships: Array<{ organization_name: string; display_name: string | null }>;
    };
    expect(body.memberships).toHaveLength(1);
    expect(body.memberships[0].organization_name).toBe("Lycée Tazieff");
    expect(body.memberships[0].display_name).toBe("Mme D.");
  });
});

describe("PATCH /api/me/profile", () => {
  function makeRequest(body: unknown) {
    return new NextRequest("https://test.local/api/me/profile", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  it("401 si non authentifié", async () => {
    mockCreate.mockResolvedValue(
      makeSupabasePatch({ user: null, result: { data: null, error: null } }),
    );
    const res = await PATCH(makeRequest({ organization_id: ORG, display_name: "X" }));
    expect(res.status).toBe(401);
  });

  it("400 si display_name trop court (1 char après trim)", async () => {
    mockCreate.mockResolvedValue(
      makeSupabasePatch({
        user: { id: "u-1" },
        result: { data: null, error: null },
      }),
    );
    const res = await PATCH(
      makeRequest({ organization_id: ORG, display_name: "A" }),
    );
    expect(res.status).toBe(400);
  });

  it("400 si display_name trop long (>50 chars)", async () => {
    mockCreate.mockResolvedValue(
      makeSupabasePatch({
        user: { id: "u-1" },
        result: { data: null, error: null },
      }),
    );
    const res = await PATCH(
      makeRequest({
        organization_id: ORG,
        display_name: "x".repeat(51),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("200 + ok:true quand display_name valide", async () => {
    mockCreate.mockResolvedValue(
      makeSupabasePatch({
        user: { id: "u-1" },
        result: {
          data: { organization_id: ORG, role: "teacher", display_name: "Mme D." },
          error: null,
        },
      }),
    );
    const res = await PATCH(
      makeRequest({ organization_id: ORG, display_name: "Mme D." }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      membership: { display_name: string };
    };
    expect(body.ok).toBe(true);
    expect(body.membership.display_name).toBe("Mme D.");
  });

  it("200 + null quand display_name=null (effacement)", async () => {
    mockCreate.mockResolvedValue(
      makeSupabasePatch({
        user: { id: "u-1" },
        result: {
          data: { organization_id: ORG, role: "teacher", display_name: null },
          error: null,
        },
      }),
    );
    const res = await PATCH(
      makeRequest({ organization_id: ORG, display_name: null }),
    );
    expect(res.status).toBe(200);
  });

  it("404 si membership introuvable (PGRST116)", async () => {
    mockCreate.mockResolvedValue(
      makeSupabasePatch({
        user: { id: "u-1" },
        result: {
          data: null,
          error: { code: "PGRST116", message: "no rows" },
        },
      }),
    );
    const res = await PATCH(
      makeRequest({ organization_id: ORG, display_name: "Mme D." }),
    );
    expect(res.status).toBe(404);
  });
});
