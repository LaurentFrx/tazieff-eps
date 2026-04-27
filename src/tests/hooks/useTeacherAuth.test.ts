// Phase E.2.2 + Sprint P0.8 — Tests du hook useTeacherAuth.
//
// P0.8 : signInWithEmail effectue maintenant un flow client-initié :
//   1. POST /api/auth/teacher-magic-link → 200 { eligible: boolean }
//   2. Si eligible → signInWithOtp côté navigateur via createBrowserClient
//   3. Retourne { ok, eligible, error? }

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { User } from "@supabase/supabase-js";

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

describe("useTeacherAuth — signInWithEmail (P0.8 flow client-initié)", () => {
  it("eligible: true → signInWithOtp appelé, ok: true, eligible: true", async () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false, isAnonymous: false });
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
    const { result } = renderHook(() => useTeacherAuth());
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
    mockUseAuth.mockReturnValue({ user: null, isLoading: false, isAnonymous: false });
    const signInWithOtp = vi.fn();
    mockGetSupabase.mockReturnValue({
      auth: { signInWithOtp, signOut: vi.fn() },
    });
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ eligible: false }),
    });
    const { result } = renderHook(() => useTeacherAuth());
    let res: { ok: boolean; eligible: boolean; error?: string } | undefined;
    await act(async () => {
      res = await result.current.signInWithEmail("user@gmail.com");
    });
    expect(res?.ok).toBe(true);
    expect(res?.eligible).toBe(false);
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it("erreur Supabase signInWithOtp → ok: false, eligible: true, error renseigné", async () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false, isAnonymous: false });
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
    const { result } = renderHook(() => useTeacherAuth());
    let res: { ok: boolean; eligible: boolean; error?: string } | undefined;
    await act(async () => {
      res = await result.current.signInWithEmail("prof@ac-bordeaux.fr");
    });
    expect(res?.ok).toBe(false);
    expect(res?.eligible).toBe(true);
    expect(res?.error).toBe("rate limit");
  });

  it("erreur réseau → ok: false, eligible: false, error renseigné", async () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false, isAnonymous: false });
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network down"),
    );
    const { result } = renderHook(() => useTeacherAuth());
    let res: { ok: boolean; eligible: boolean; error?: string } | undefined;
    await act(async () => {
      res = await result.current.signInWithEmail("prof@ac-paris.fr");
    });
    expect(res?.ok).toBe(false);
    expect(res?.eligible).toBe(false);
    expect(res?.error).toBe("Network down");
  });

  it("HTTP 5xx → ok: false, eligible: false", async () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false, isAnonymous: false });
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
    const { result } = renderHook(() => useTeacherAuth());
    let res: { ok: boolean; eligible: boolean; error?: string } | undefined;
    await act(async () => {
      res = await result.current.signInWithEmail("prof@ac-bordeaux.fr");
    });
    expect(res?.ok).toBe(false);
    expect(res?.eligible).toBe(false);
    expect(res?.error).toContain("500");
  });
});

describe("useTeacherAuth — signOut", () => {
  it("appelle supabase.auth.signOut() quand client dispo", async () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false, isAnonymous: false });
    const signOutMock = vi.fn().mockResolvedValue({ error: null });
    mockGetSupabase.mockReturnValue({
      auth: { signOut: signOutMock, signInWithOtp: vi.fn() },
    });
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
