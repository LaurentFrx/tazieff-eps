// Sprint A3 — Tests du hook useTeacherSession (anciennement useTeacherAuth).
//
// useTeacherAuth.ts a été supprimé en A3 (zombie : 0 import runtime). Le
// hook officiel pour l'espace prof est désormais useTeacherSession() qui
// dérive d'IdentityContext via useIdentity().
//
// Couverture conservée :
//   - États (loading, anonymous, prof académique, email non académique)
//   - signInWithEmail (P0.8 flow client-initié) — 5 cas
//   - signOut — 2 cas

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { User } from "@supabase/supabase-js";
import type { Identity } from "@/lib/auth/IdentityContext";

vi.mock("@/lib/auth/IdentityContext", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/auth/IdentityContext")
  >("@/lib/auth/IdentityContext");
  return {
    ...actual,
    useIdentity: vi.fn(),
  };
});

vi.mock("@/lib/supabase/browser", () => ({
  getSupabaseBrowserClient: vi.fn(),
}));

import { useIdentity } from "@/lib/auth/IdentityContext";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useTeacherSession } from "@/hooks/useTeacherSession";

const mockUseIdentity = useIdentity as unknown as ReturnType<typeof vi.fn>;
const mockGetSupabase = getSupabaseBrowserClient as unknown as ReturnType<
  typeof vi.fn
>;

function setIdentity(partial: Partial<Identity>): void {
  mockUseIdentity.mockReturnValue({
    user: null,
    role: "anonymous",
    isLoading: false,
    mode: "prof",
    isSuperAdmin: false,
    isAdmin: false,
    isAcademic: false,
    ...partial,
  });
}

beforeEach(() => {
  mockUseIdentity.mockReset();
  mockGetSupabase.mockReset();
  (globalThis as unknown as { fetch: ReturnType<typeof vi.fn> }).fetch = vi.fn();
});

describe("useTeacherSession — états", () => {
  it("1. loading : isTeacher=false, isLoading=true", () => {
    setIdentity({ user: null, isLoading: true });
    const { result } = renderHook(() => useTeacherSession());
    expect(result.current.isTeacher).toBe(false);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it("2. anonymous élève remonté sur l'espace prof : isTeacher=false", () => {
    const anon = { id: "anon-1", email: null, is_anonymous: true } as unknown as User;
    setIdentity({ user: anon, role: "anonymous" });
    const { result } = renderHook(() => useTeacherSession());
    expect(result.current.isTeacher).toBe(false);
    expect(result.current.user?.id).toBe("anon-1");
  });

  it("3. prof académique connecté : isTeacher=true", () => {
    const prof = {
      id: "p-1",
      email: "prof.demo@ac-bordeaux.fr",
      is_anonymous: false,
    } as unknown as User;
    setIdentity({ user: prof, role: "teacher", isAcademic: true });
    const { result } = renderHook(() => useTeacherSession());
    expect(result.current.isTeacher).toBe(true);
    expect(result.current.user?.email).toBe("prof.demo@ac-bordeaux.fr");
  });

  it("4. email non-académique : isTeacher=false", () => {
    const other = {
      id: "x-1",
      email: "user@gmail.com",
      is_anonymous: false,
    } as unknown as User;
    setIdentity({ user: other, role: "student" });
    const { result } = renderHook(() => useTeacherSession());
    expect(result.current.isTeacher).toBe(false);
  });
});

describe("useTeacherSession — signInWithEmail (P0.8 flow client-initié)", () => {
  it("eligible: true → signInWithOtp appelé, ok: true, eligible: true", async () => {
    setIdentity({ user: null });
    const signInWithOtp = vi
      .fn()
      .mockResolvedValue({ data: {}, error: null });
    mockGetSupabase.mockReturnValue({
      auth: { signInWithOtp, signOut: vi.fn() },
    });
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ eligible: true }),
    });
    const { result } = renderHook(() => useTeacherSession());
    let res: { ok: boolean; eligible: boolean; error?: string } | undefined;
    await act(async () => {
      res = await result.current.signInWithEmail("prof@ac-bordeaux.fr");
    });
    expect(res?.ok).toBe(true);
    expect(res?.eligible).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/auth/teacher-magic-link",
      expect.objectContaining({ method: "POST" }),
    );
    expect(signInWithOtp).toHaveBeenCalledTimes(1);
    const otpArgs = signInWithOtp.mock.calls[0]?.[0] as {
      email: string;
      options: { emailRedirectTo: string; shouldCreateUser: boolean };
    };
    expect(otpArgs.email).toBe("prof@ac-bordeaux.fr");
    expect(otpArgs.options.shouldCreateUser).toBe(true);
    expect(otpArgs.options.emailRedirectTo).toMatch(
      /\/auth\/callback\?next=\/tableau-de-bord$/,
    );
  });

  it("eligible: false → signInWithOtp NON appelé, ok: true, eligible: false", async () => {
    setIdentity({ user: null });
    const signInWithOtp = vi.fn();
    mockGetSupabase.mockReturnValue({
      auth: { signInWithOtp, signOut: vi.fn() },
    });
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ eligible: false }),
    });
    const { result } = renderHook(() => useTeacherSession());
    let res: { ok: boolean; eligible: boolean; error?: string } | undefined;
    await act(async () => {
      res = await result.current.signInWithEmail("user@gmail.com");
    });
    expect(res?.ok).toBe(true);
    expect(res?.eligible).toBe(false);
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it("erreur Supabase signInWithOtp → ok: false, eligible: true, error renseigné", async () => {
    setIdentity({ user: null });
    const signInWithOtp = vi
      .fn()
      .mockResolvedValue({ data: {}, error: { message: "rate limit" } });
    mockGetSupabase.mockReturnValue({
      auth: { signInWithOtp, signOut: vi.fn() },
    });
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ eligible: true }),
    });
    const { result } = renderHook(() => useTeacherSession());
    let res: { ok: boolean; eligible: boolean; error?: string } | undefined;
    await act(async () => {
      res = await result.current.signInWithEmail("prof@ac-bordeaux.fr");
    });
    expect(res?.ok).toBe(false);
    expect(res?.eligible).toBe(true);
    expect(res?.error).toBe("rate limit");
  });

  it("erreur réseau → ok: false, eligible: false, error renseigné", async () => {
    setIdentity({ user: null });
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network down"),
    );
    const { result } = renderHook(() => useTeacherSession());
    let res: { ok: boolean; eligible: boolean; error?: string } | undefined;
    await act(async () => {
      res = await result.current.signInWithEmail("prof@ac-paris.fr");
    });
    expect(res?.ok).toBe(false);
    expect(res?.eligible).toBe(false);
    expect(res?.error).toBe("Network down");
  });

  it("HTTP 5xx → ok: false, eligible: false", async () => {
    setIdentity({ user: null });
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
    const { result } = renderHook(() => useTeacherSession());
    let res: { ok: boolean; eligible: boolean; error?: string } | undefined;
    await act(async () => {
      res = await result.current.signInWithEmail("prof@ac-bordeaux.fr");
    });
    expect(res?.ok).toBe(false);
    expect(res?.eligible).toBe(false);
    expect(res?.error).toContain("500");
  });
});

describe("useTeacherSession — signOut", () => {
  it("appelle supabase.auth.signOut() quand client dispo", async () => {
    setIdentity({ user: null });
    const signOutMock = vi.fn().mockResolvedValue({ error: null });
    mockGetSupabase.mockReturnValue({
      auth: { signOut: signOutMock, signInWithOtp: vi.fn() },
    });
    const { result } = renderHook(() => useTeacherSession());
    await act(async () => {
      await result.current.signOut();
    });
    expect(signOutMock).toHaveBeenCalledTimes(1);
  });

  it("no-op si supabase client = null", async () => {
    setIdentity({ user: null });
    mockGetSupabase.mockReturnValue(null);
    const { result } = renderHook(() => useTeacherSession());
    await expect(result.current.signOut()).resolves.toBeUndefined();
  });
});
