// Phase E.2.3.4 — Tests de POST /api/teacher/classes.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { POST } from "@/app/api/teacher/classes/route";

const mockCreate = createSupabaseServerClient as unknown as ReturnType<
  typeof vi.fn
>;

type SupabaseMockOpts = {
  user: { id: string } | null;
  rpcResult?: { data: string | null; error: { message: string } | null };
  insertResult?: {
    data: Record<string, unknown> | null;
    error: { code: string; message: string } | null;
  };
};

function makeSupabase(opts: SupabaseMockOpts) {
  const insertChain: Record<string, unknown> = {};
  insertChain.select = vi.fn(() => insertChain);
  insertChain.single = vi.fn(() =>
    Promise.resolve(
      opts.insertResult ?? { data: { id: "c-1" }, error: null },
    ),
  );

  const fromChain: Record<string, unknown> = {
    insert: vi.fn(() => insertChain),
  };

  return {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: opts.user } })),
    },
    from: vi.fn(() => fromChain),
    rpc: vi.fn(() =>
      Promise.resolve(opts.rpcResult ?? { data: "ABC123", error: null }),
    ),
  };
}

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/teacher/classes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockCreate.mockReset();
});

describe("POST /api/teacher/classes", () => {
  it("401 si pas d'auth", async () => {
    mockCreate.mockResolvedValue(makeSupabase({ user: null }));
    const res = await POST(
      makeRequest({ organization_id: "00000000-0000-0000-0001-000000000001", name: "A" }) as never,
    );
    expect(res.status).toBe(401);
  });

  it("400 si validation Zod échoue (name vide)", async () => {
    mockCreate.mockResolvedValue(makeSupabase({ user: { id: "u-1" } }));
    const res = await POST(
      makeRequest({
        organization_id: "00000000-0000-0000-0001-000000000001",
        name: "",
      }) as never,
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("validation");
  });

  it("500 si generate_class_join_code échoue", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({
        user: { id: "u-1" },
        rpcResult: { data: null, error: { message: "boom" } },
      }),
    );
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(
      makeRequest({
        organization_id: "00000000-0000-0000-0001-000000000001",
        name: "A",
      }) as never,
    );
    expect(res.status).toBe(500);
    errSpy.mockRestore();
  });

  it("403 si RLS refuse (42501)", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({
        user: { id: "u-1" },
        insertResult: {
          data: null,
          error: { code: "42501", message: "rls" },
        },
      }),
    );
    const res = await POST(
      makeRequest({
        organization_id: "00000000-0000-0000-0001-000000000001",
        name: "A",
      }) as never,
    );
    expect(res.status).toBe(403);
  });

  it("201 si succès, retourne la classe créée", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({
        user: { id: "u-1" },
        insertResult: {
          data: {
            id: "c-1",
            name: "A",
            join_code: "ABC123",
          },
          error: null,
        },
      }),
    );
    const res = await POST(
      makeRequest({
        organization_id: "00000000-0000-0000-0001-000000000001",
        name: "A",
        school_year: "Seconde",
      }) as never,
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("c-1");
    expect(body.join_code).toBe("ABC123");
  });
});
