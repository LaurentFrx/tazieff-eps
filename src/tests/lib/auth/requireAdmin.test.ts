// Phase P0.1 — Tests unitaires de requireAdmin / isAdminUser.
//
// On mocke un SupabaseClient minimal exposant `auth.getUser` et la chaîne
// `from(table).select().eq().maybeSingle()`. Pas de DB réelle.

import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { requireAdmin, isAdminUser, AuthError } from "@/lib/auth/requireAdmin";

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("requireAdmin", () => {
  it("throw 401 unauthenticated si pas de user", async () => {
    const sb = makeSupabase(null, { data: null, error: null });
    await expect(requireAdmin(sb)).rejects.toMatchObject({
      status: 401,
      code: "unauthenticated",
    });
    await expect(requireAdmin(sb)).rejects.toBeInstanceOf(AuthError);
  });

  it("throw 403 forbidden si user authentifié mais absent de app_admins", async () => {
    const sb = makeSupabase({ id: "u-1" }, { data: null, error: null });
    await expect(requireAdmin(sb)).rejects.toMatchObject({
      status: 403,
      code: "forbidden",
    });
  });

  it("retourne { user, role: 'super_admin' } si user dans app_admins comme super_admin", async () => {
    const sb = makeSupabase(
      { id: "u-1" },
      { data: { role: "super_admin" }, error: null },
    );
    const result = await requireAdmin(sb);
    expect(result.user.id).toBe("u-1");
    expect(result.role).toBe("super_admin");
  });

  it("retourne { user, role: 'admin' } si user dans app_admins comme admin", async () => {
    const sb = makeSupabase(
      { id: "u-2" },
      { data: { role: "admin" }, error: null },
    );
    const result = await requireAdmin(sb);
    expect(result.role).toBe("admin");
  });

  it("throw 403 si erreur DB sur le SELECT app_admins (failsafe deny)", async () => {
    const sb = makeSupabase(
      { id: "u-1" },
      { data: null, error: { message: "boom" } },
    );
    await expect(requireAdmin(sb)).rejects.toMatchObject({
      status: 403,
      code: "forbidden",
    });
  });
});

describe("isAdminUser", () => {
  it("retourne tout false si userId vide (anonyme)", async () => {
    const sb = makeSupabase(null, { data: null, error: null });
    const r = await isAdminUser("", sb);
    expect(r).toEqual({ is_super_admin: false, is_admin: false });
  });

  it("retourne tout false si user absent de app_admins (RLS row vide)", async () => {
    const sb = makeSupabase({ id: "u-1" }, { data: null, error: null });
    const r = await isAdminUser("u-1", sb);
    expect(r).toEqual({ is_super_admin: false, is_admin: false });
  });

  it("retourne is_super_admin=true et is_admin=true pour un super_admin", async () => {
    const sb = makeSupabase(
      { id: "u-1" },
      { data: { role: "super_admin" }, error: null },
    );
    const r = await isAdminUser("u-1", sb);
    expect(r).toEqual({ is_super_admin: true, is_admin: true });
  });

  it("retourne is_super_admin=false et is_admin=true pour un admin simple", async () => {
    const sb = makeSupabase(
      { id: "u-2" },
      { data: { role: "admin" }, error: null },
    );
    const r = await isAdminUser("u-2", sb);
    expect(r).toEqual({ is_super_admin: false, is_admin: true });
  });

  it("retourne tout false si erreur DB (failsafe deny)", async () => {
    const sb = makeSupabase(
      { id: "u-1" },
      { data: null, error: { message: "boom" } },
    );
    const r = await isAdminUser("u-1", sb);
    expect(r).toEqual({ is_super_admin: false, is_admin: false });
  });
});
