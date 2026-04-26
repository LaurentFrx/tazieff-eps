// Phase P0.1 — Tests du hook useAppAdmin.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAppAdmin } from "@/hooks/useAppAdmin";

const originalFetch = global.fetch;

function mockFetch(payload: unknown, ok = true, status = 200) {
  return vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify(payload), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  ) as unknown as typeof fetch;
}

beforeEach(() => {
  // Fresh fetch mock each test
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("useAppAdmin", () => {
  it("anonymous user : isAdmin false, isSuperAdmin false après loading", async () => {
    global.fetch = mockFetch({ is_super_admin: false, is_admin: false });
    const { result } = renderHook(() => useAppAdmin());
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isSuperAdmin).toBe(false);
  });

  it("authentifié non-admin : booléens restent false", async () => {
    global.fetch = mockFetch({ is_super_admin: false, is_admin: false });
    const { result } = renderHook(() => useAppAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isSuperAdmin).toBe(false);
  });

  it("authentifié super_admin : isAdmin et isSuperAdmin true", async () => {
    global.fetch = mockFetch({ is_super_admin: true, is_admin: true });
    const { result } = renderHook(() => useAppAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isSuperAdmin).toBe(true);
  });

  it("authentifié admin simple : isAdmin true, isSuperAdmin false", async () => {
    global.fetch = mockFetch({ is_super_admin: false, is_admin: true });
    const { result } = renderHook(() => useAppAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isSuperAdmin).toBe(false);
  });

  it("refetch met à jour après changement de réponse serveur", async () => {
    let counter = 0;
    global.fetch = vi.fn(() => {
      counter += 1;
      const payload =
        counter === 1
          ? { is_super_admin: false, is_admin: false }
          : { is_super_admin: true, is_admin: true };
      return Promise.resolve(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => useAppAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAdmin).toBe(false);
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isSuperAdmin).toBe(true);
  });

  it("réponse non-OK : retombe en deny par défaut", async () => {
    global.fetch = mockFetch(
      { is_super_admin: true, is_admin: true },
      false,
      500,
    );
    const { result } = renderHook(() => useAppAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isSuperAdmin).toBe(false);
  });
});
