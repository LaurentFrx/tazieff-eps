// Phase E.2.2 — Tests du hook useTeacherAuth.
// On mocke useAuth et getSupabaseBrowserClient pour isoler les 4 états :
//   1. pas de user, en cours de load
//   2. anonymous élève (user avec is_anonymous: true)
//   3. prof connecté (email académique)
//   4. user avec email non-académique (edge case, théorique)

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { User } from "@supabase/supabase-js";

// Mocks hoistés
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));
vi.mock("@/lib/supabase/browser", () => ({
  getSupabaseBrowserClient: vi.fn(),
}));

import { useAuth } from "@/hooks/useAuth";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useTeacherAuth } from "@/hooks/useTeacherAuth";

const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;
const mockGetSupabase = getSupabaseBrowserClient as unknown as ReturnType<
  typeof vi.fn
>;

beforeEach(() => {
  mockUseAuth.mockReset();
  mockGetSupabase.mockReset();
  // fetch mock global
  (globalThis as unknown as { fetch: ReturnType<typeof vi.fn> }).fetch = vi.fn();
});

describe("useTeacherAuth — états", () => {
  it("1. loading : isTeacher=false, isLoading=true", () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: true, isAnonymous: false });
    const { result } = renderHook(() => useTeacherAuth());
    expect(result.current.isTeacher).toBe(false);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it("2. anonymous élève : isTeacher=false", () => {
    const anon = { id: "anon-1", email: null, is_anonymous: true } as unknown as User;
    mockUseAuth.mockReturnValue({ user: anon, isLoading: false, isAnonymous: true });
    const { result } = renderHook(() => useTeacherAuth());
    expect(result.current.isTeacher).toBe(false);
    expect(result.current.user?.id).toBe("anon-1");
  });

  it("3. prof académique connecté : isTeacher=true", () => {
    const prof = {
      id: "p-1",
      email: "prof.demo@ac-bordeaux.fr",
      is_anonymous: false,
    } as unknown as User;
    mockUseAuth.mockReturnValue({ user: prof, isLoading: false, isAnonymous: false });
    const { result } = renderHook(() => useTeacherAuth());
    expect(result.current.isTeacher).toBe(true);
    expect(result.current.user?.email).toBe("prof.demo@ac-bordeaux.fr");
  });

  it("4. email non-académique : isTeacher=false", () => {
    const other = {
      id: "x-1",
      email: "user@gmail.com",
      is_anonymous: false,
    } as unknown as User;
    mockUseAuth.mockReturnValue({ user: other, isLoading: false, isAnonymous: false });
    const { result } = renderHook(() => useTeacherAuth());
    expect(result.current.isTeacher).toBe(false);
  });
});

describe("useTeacherAuth — signInWithEmail", () => {
  it("POST /api/auth/teacher-magic-link, 200 → ok: true", async () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false, isAnonymous: false });
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    const { result } = renderHook(() => useTeacherAuth());
    let res: { ok: boolean; error?: string } | undefined;
    await act(async () => {
      res = await result.current.signInWithEmail("prof@ac-bordeaux.fr");
    });
    expect(res?.ok).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/auth/teacher-magic-link",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("403 non-académique → ok: false avec message", async () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false, isAnonymous: false });
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: "not_academic", message: "Email non académique." }),
    });
    const { result } = renderHook(() => useTeacherAuth());
    let res: { ok: boolean; error?: string } | undefined;
    await act(async () => {
      res = await result.current.signInWithEmail("user@gmail.com");
    });
    expect(res?.ok).toBe(false);
    expect(res?.error).toContain("non académique");
  });

  it("erreur réseau → ok: false avec error", async () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false, isAnonymous: false });
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network down"),
    );
    const { result } = renderHook(() => useTeacherAuth());
    let res: { ok: boolean; error?: string } | undefined;
    await act(async () => {
      res = await result.current.signInWithEmail("prof@ac-paris.fr");
    });
    expect(res?.ok).toBe(false);
    expect(res?.error).toBe("Network down");
  });
});

describe("useTeacherAuth — signOut", () => {
  it("appelle supabase.auth.signOut() quand client dispo", async () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false, isAnonymous: false });
    const signOutMock = vi.fn().mockResolvedValue({ error: null });
    mockGetSupabase.mockReturnValue({ auth: { signOut: signOutMock } });
    const { result } = renderHook(() => useTeacherAuth());
    await act(async () => {
      await result.current.signOut();
    });
    expect(signOutMock).toHaveBeenCalledTimes(1);
  });

  it("no-op si supabase client = null", async () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false, isAnonymous: false });
    mockGetSupabase.mockReturnValue(null);
    const { result } = renderHook(() => useTeacherAuth());
    await expect(result.current.signOut()).resolves.toBeUndefined();
  });
});
