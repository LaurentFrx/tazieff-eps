// Phase P0.1 — Tests de POST /api/teacher/exercise-override.
//
// Le PIN a disparu. La route exige requireAdmin() :
//   - 401 si pas de user authentifié
//   - 403 si user authentifié mais non admin
//   - 200 si super_admin / admin (upsert avec author_user_id et created_by)

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { POST } from "@/app/api/teacher/exercise-override/route";

const mockCreate = createSupabaseServerClient as unknown as ReturnType<
  typeof vi.fn
>;

type AppAdminRow = { role: "super_admin" | "admin" } | null;

function makeSupabase({
  user,
  appAdminRow,
  upsertError = null,
}: {
  user: { id: string } | null;
  appAdminRow: AppAdminRow;
  upsertError?: { code?: string; message: string } | null;
}) {
  const appAdminsChain: Record<string, unknown> = {};
  appAdminsChain.select = vi.fn(() => appAdminsChain);
  appAdminsChain.eq = vi.fn(() => appAdminsChain);
  appAdminsChain.maybeSingle = vi.fn(() =>
    Promise.resolve({ data: appAdminRow, error: null }),
  );

  const overridesChain: Record<string, unknown> = {};
  overridesChain.upsert = vi.fn(() =>
    Promise.resolve({ error: upsertError, data: null }),
  );

  return {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user } })),
    },
    from: vi.fn((table: string) => {
      if (table === "app_admins") return appAdminsChain;
      if (table === "exercise_overrides") return overridesChain;
      return overridesChain;
    }),
  };
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/teacher/exercise-override", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validPayload = {
  slug: "s1-04",
  locale: "fr",
  patchJson: { version: 2, doc: { sections: [] } },
};

beforeEach(() => {
  mockCreate.mockReset();
});

describe("POST /api/teacher/exercise-override (P0.1 verrou admin)", () => {
  it("401 si user non authentifié", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({ user: null, appAdminRow: null }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(makeRequest(validPayload));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("unauthenticated");
    errorSpy.mockRestore();
  });

  it("403 si user authentifié mais non admin", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({ user: { id: "u-1" }, appAdminRow: null }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(makeRequest(validPayload));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("forbidden");
    errorSpy.mockRestore();
  });

  it("200 si super_admin authentifié + upsert OK", async () => {
    const sb = makeSupabase({
      user: { id: "u-admin" },
      appAdminRow: { role: "super_admin" },
    });
    mockCreate.mockResolvedValue(sb);
    const res = await POST(makeRequest(validPayload));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    // Vérifie que author_user_id et created_by ont bien été alimentés.
    const upsertChain = sb.from("exercise_overrides") as unknown as {
      upsert: ReturnType<typeof vi.fn>;
    };
    const callArgs = upsertChain.upsert.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(callArgs.author_user_id).toBe("u-admin");
    expect(callArgs.created_by).toBe("u-admin");
    expect(callArgs.slug).toBe("s1-04");
  });

  it("400 si payload invalide (champs manquants)", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({
        user: { id: "u-admin" },
        appAdminRow: { role: "super_admin" },
      }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(makeRequest({ slug: "", locale: "fr" }));
    expect(res.status).toBe(400);
    errorSpy.mockRestore();
  });
});
