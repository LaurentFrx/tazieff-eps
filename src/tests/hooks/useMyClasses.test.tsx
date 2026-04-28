// Sprint E1 — Tests du hook useMyClasses.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useMyClasses } from "@/hooks/useMyClasses";

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
  // fresh fetch mock per test
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("useMyClasses", () => {
  it("anonymous user : classes vide après loading", async () => {
    global.fetch = mockFetch({ classes: [] });
    const { result } = renderHook(() => useMyClasses());
    expect(result.current.classes).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.classes).toEqual([]);
  });

  it("authentifié sans classe : classes reste vide", async () => {
    global.fetch = mockFetch({ classes: [] });
    const { result } = renderHook(() => useMyClasses());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.classes).toEqual([]);
  });

  it("authentifié avec une classe : la liste reflète la réponse", async () => {
    global.fetch = mockFetch({
      classes: [
        {
          id: "c-1",
          name: "2nde B",
          school_year: "Seconde",
          teacher_name: null,
          org_name: "Lycée Tazieff",
        },
      ],
    });
    const { result } = renderHook(() => useMyClasses());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.classes).toHaveLength(1);
    expect(result.current.classes[0].name).toBe("2nde B");
  });

  it("refetch met à jour après changement serveur", async () => {
    let counter = 0;
    global.fetch = vi.fn(() => {
      counter += 1;
      const payload =
        counter === 1
          ? { classes: [] }
          : {
              classes: [
                {
                  id: "c-2",
                  name: "Term C",
                  school_year: "Terminale",
                  teacher_name: null,
                  org_name: "Tazieff",
                },
              ],
            };
      return Promise.resolve(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => useMyClasses());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.classes).toEqual([]);
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.classes).toHaveLength(1);
    expect(result.current.classes[0].id).toBe("c-2");
  });

  it("réponse non-OK : retombe sur classes vide (failsafe)", async () => {
    global.fetch = mockFetch({ classes: [] }, false, 500);
    const { result } = renderHook(() => useMyClasses());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.classes).toEqual([]);
  });
});
