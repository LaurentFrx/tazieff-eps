// Phase P0.1 — Tests de POST /api/teacher/upload-media.
//
// Vérifie uniquement le verrou admin (les chemins success-storage exigent
// un mock complexe du bucket Supabase Storage et de getBucket/createSignedUrl,
// hors scope des tests unitaires P0.1).

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
  getSupabaseServiceClient: vi.fn(() => ({
    storage: {
      from: () => ({
        upload: vi.fn(() => Promise.resolve({ error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://x" } })),
        createSignedUrl: vi.fn(() =>
          Promise.resolve({ data: { signedUrl: "https://signed" } }),
        ),
      }),
      getBucket: vi.fn(() =>
        Promise.resolve({ data: { public: false }, error: null }),
      ),
    },
    from: () => ({
      insert: () => ({
        select: () => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: {
                id: "media-1",
                bucket: "exercise-media",
                path: "exercises/s1-04/x.webp",
                canonical_url: null,
              },
              error: null,
            }),
          ),
        }),
      }),
    }),
  })),
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { POST } from "@/app/api/teacher/upload-media/route";

const mockCreate = createSupabaseServerClient as unknown as ReturnType<
  typeof vi.fn
>;

type AppAdminRow = { role: "super_admin" | "admin" } | null;

function makeSupabase({
  user,
  appAdminRow,
}: {
  user: { id: string } | null;
  appAdminRow: AppAdminRow;
}) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(() =>
    Promise.resolve({ data: appAdminRow, error: null }),
  );
  return {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user } })),
    },
    from: vi.fn(() => chain),
  };
}

function makeFormDataRequest(formData: FormData) {
  return new Request("http://localhost/api/teacher/upload-media", {
    method: "POST",
    body: formData,
  });
}

beforeEach(() => {
  mockCreate.mockReset();
  process.env.SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "stub-service-role-key";
});

describe("POST /api/teacher/upload-media (P0.1 verrou admin)", () => {
  it("401 si user non authentifié", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({ user: null, appAdminRow: null }),
    );
    const fd = new FormData();
    fd.set("slug", "s1-04");
    fd.set(
      "file",
      new File([new Uint8Array([1, 2, 3])], "x.webp", { type: "image/webp" }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(makeFormDataRequest(fd));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("UNAUTHORIZED");
    errorSpy.mockRestore();
  });

  it("403 si user authentifié non-admin", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({ user: { id: "u-1" }, appAdminRow: null }),
    );
    const fd = new FormData();
    fd.set("slug", "s1-04");
    fd.set(
      "file",
      new File([new Uint8Array([1, 2, 3])], "x.webp", { type: "image/webp" }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(makeFormDataRequest(fd));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("FORBIDDEN");
    errorSpy.mockRestore();
  });

  it("200 si super_admin avec un fichier valide", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({
        user: { id: "u-admin" },
        appAdminRow: { role: "super_admin" },
      }),
    );
    const fd = new FormData();
    fd.set("slug", "s1-04");
    fd.set(
      "file",
      new File([new Uint8Array([1, 2, 3])], "x.webp", { type: "image/webp" }),
    );
    const res = await POST(makeFormDataRequest(fd));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.mediaId).toBe("media-1");
  });

  it("415 si fichier valide mais MIME non supporté (admin présent)", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({
        user: { id: "u-admin" },
        appAdminRow: { role: "super_admin" },
      }),
    );
    const fd = new FormData();
    fd.set("slug", "s1-04");
    fd.set(
      "file",
      new File([new Uint8Array([1, 2])], "x.gif", { type: "image/gif" }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(makeFormDataRequest(fd));
    expect(res.status).toBe(415);
    errorSpy.mockRestore();
  });
});
