// Phase P0.1 + P0.4 — Tests de POST + DELETE /api/teacher/live-exercise.
//
// P0.1 : verrouillage admin via requireAdmin() (PIN supprimé).
// P0.4 : la route fait désormais SELECT + INSERT|UPDATE explicite afin de
//        préserver author_user_id / created_by sur les mises à jour
//        successives (la création n'est attribuée qu'au premier auteur).

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
  existingLiveRow = null,
  insertError = null,
  updateError = null,
  deleteError = null,
  insertSpy,
  updateSpy,
}: {
  user: { id: string } | null;
  appAdminRow: AppAdminRow;
  existingLiveRow?: { slug: string } | null;
  insertError?: { code?: string; message: string } | null;
  updateError?: { code?: string; message: string } | null;
  deleteError?: { code?: string; message: string } | null;
  insertSpy?: ReturnType<typeof vi.fn>;
  updateSpy?: ReturnType<typeof vi.fn>;
}) {
  // app_admins lookup chain
  const appAdminsChain: Record<string, unknown> = {};
  appAdminsChain.select = vi.fn(() => appAdminsChain);
  appAdminsChain.eq = vi.fn(() => appAdminsChain);
  appAdminsChain.maybeSingle = vi.fn(() =>
    Promise.resolve({ data: appAdminRow, error: null }),
  );

  // live_exercises chain (lookup + insert + update + delete)
  const insertFn = insertSpy ?? vi.fn();
  const updateFn = updateSpy ?? vi.fn();

  const liveChain: Record<string, unknown> = {
    select: vi.fn(() => {
      const sel: Record<string, unknown> = {};
      sel.eq = vi.fn(() => sel);
      sel.is = vi.fn(() => sel);
      sel.maybeSingle = vi.fn(() =>
        Promise.resolve({ data: existingLiveRow, error: null }),
      );
      return sel;
    }),
    insert: vi.fn((payload: unknown) => {
      insertFn(payload);
      return Promise.resolve({ error: insertError });
    }),
    update: vi.fn((payload: unknown) => {
      updateFn(payload);
      const upd: Record<string, unknown> = {};
      // .update().eq().eq() → thenable au 2nd eq
      let count = 0;
      upd.eq = vi.fn(() => {
        count += 1;
        if (count >= 2) return Promise.resolve({ error: updateError });
        return upd;
      });
      return upd;
    }),
    delete: vi.fn(() => {
      const del: Record<string, unknown> = {};
      let count = 0;
      del.eq = vi.fn(() => {
        count += 1;
        if (count >= 2) return Promise.resolve({ error: deleteError });
        return del;
      });
      return del;
    }),
  };

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

describe("POST /api/teacher/live-exercise (P0.1 + P0.4)", () => {
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

  it("200 et INSERT avec author_user_id/created_by si la row n'existe pas (création initiale)", async () => {
    const insertSpy = vi.fn();
    mockCreate.mockResolvedValue(
      makeSupabase({
        user: { id: "u-admin" },
        appAdminRow: { role: "admin" },
        existingLiveRow: null,
        insertSpy,
      }),
    );
    const res = await POST(makePostRequest(validPostPayload));
    expect(res.status).toBe(200);
    expect(insertSpy).toHaveBeenCalledTimes(1);
    const payload = insertSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.author_user_id).toBe("u-admin");
    expect(payload.created_by).toBe("u-admin");
    expect(payload.slug).toBe("s1-04");
  });

  it("200 et UPDATE sans toucher author_user_id ni created_by si la row existe (P0.4)", async () => {
    const insertSpy = vi.fn();
    const updateSpy = vi.fn();
    mockCreate.mockResolvedValue(
      makeSupabase({
        user: { id: "u-other-admin" },
        appAdminRow: { role: "admin" },
        existingLiveRow: { slug: "s1-04" },
        insertSpy,
        updateSpy,
      }),
    );
    const res = await POST(makePostRequest(validPostPayload));
    expect(res.status).toBe(200);
    expect(insertSpy).not.toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledTimes(1);
    const payload = updateSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    // author_user_id et created_by ne doivent PAS être ré-attribués sur UPDATE
    expect(payload.author_user_id).toBeUndefined();
    expect(payload.created_by).toBeUndefined();
    expect(payload.data_json).toBeDefined();
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
