// Phase P0.1 — Tests de POST + DELETE /api/teacher/live-exercise.
//
// Le PIN a disparu. Les deux verbes exigent requireAdmin().

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  POST,
  DELETE,
} from "@/app/api/teacher/live-exercise/route";

const mockCreate = createSupabaseServerClient as unknown as ReturnType<
  typeof vi.fn
>;

type AppAdminRow = { role: "super_admin" | "admin" } | null;

function makeSupabase({
  user,
  appAdminRow,
  upsertError = null,
  deleteError = null,
}: {
  user: { id: string } | null;
  appAdminRow: AppAdminRow;
  upsertError?: { code?: string; message: string } | null;
  deleteError?: { code?: string; message: string } | null;
}) {
  const appAdminsChain: Record<string, unknown> = {};
  appAdminsChain.select = vi.fn(() => appAdminsChain);
  appAdminsChain.eq = vi.fn(() => appAdminsChain);
  appAdminsChain.maybeSingle = vi.fn(() =>
    Promise.resolve({ data: appAdminRow, error: null }),
  );

  const liveChain: Record<string, unknown> = {};
  liveChain.upsert = vi.fn(() =>
    Promise.resolve({ error: upsertError, data: null }),
  );
  liveChain.delete = vi.fn(() => liveChain);
  liveChain.eq = vi.fn(() => {
    // pour le pattern .delete().eq().eq() on retourne un thenable au 2e .eq
    let count = 0;
    const chain: Record<string, unknown> = {};
    chain.eq = vi.fn(() => {
      count += 1;
      if (count >= 1) {
        return Promise.resolve({ error: deleteError });
      }
      return chain;
    });
    return chain;
  });

  return {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user } })),
    },
    from: vi.fn((table: string) => {
      if (table === "app_admins") return appAdminsChain;
      return liveChain;
    }),
  };
}

const validPostPayload = {
  slug: "s1-04",
  locale: "fr",
  dataJson: {
    frontmatter: {
      title: "Test",
      tags: ["a"],
      muscles: ["pectoraux"],
      themeCompatibility: [1],
    },
    content: "## Consignes\n- ok\n",
    status: "draft",
  },
};

function makePostRequest(body: unknown) {
  return new Request("http://localhost/api/teacher/live-exercise", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(slug: string, locale: string) {
  return new Request(
    `http://localhost/api/teacher/live-exercise?slug=${encodeURIComponent(slug)}&locale=${encodeURIComponent(locale)}`,
    { method: "DELETE" },
  );
}

beforeEach(() => {
  mockCreate.mockReset();
});

describe("POST /api/teacher/live-exercise (P0.1)", () => {
  it("401 si user non authentifié", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({ user: null, appAdminRow: null }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(makePostRequest(validPostPayload));
    expect(res.status).toBe(401);
    errorSpy.mockRestore();
  });

  it("403 si user authentifié non-admin", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({ user: { id: "u-1" }, appAdminRow: null }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(makePostRequest(validPostPayload));
    expect(res.status).toBe(403);
    errorSpy.mockRestore();
  });

  it("200 si admin + upsert OK", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({
        user: { id: "u-admin" },
        appAdminRow: { role: "admin" },
      }),
    );
    const res = await POST(makePostRequest(validPostPayload));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});

describe("DELETE /api/teacher/live-exercise (P0.1)", () => {
  it("401 si user non authentifié", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({ user: null, appAdminRow: null }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await DELETE(makeDeleteRequest("s1-04", "fr"));
    expect(res.status).toBe(401);
    errorSpy.mockRestore();
  });

  it("403 si user authentifié non-admin", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({ user: { id: "u-1" }, appAdminRow: null }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await DELETE(makeDeleteRequest("s1-04", "fr"));
    expect(res.status).toBe(403);
    errorSpy.mockRestore();
  });

  it("200 si super_admin + delete OK", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({
        user: { id: "u-admin" },
        appAdminRow: { role: "super_admin" },
      }),
    );
    const res = await DELETE(makeDeleteRequest("s1-04", "fr"));
    expect(res.status).toBe(200);
  });

  it("400 si slug manquant en query string", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({
        user: { id: "u-admin" },
        appAdminRow: { role: "super_admin" },
      }),
    );
    const res = await DELETE(makeDeleteRequest("", ""));
    expect(res.status).toBe(400);
  });
});
