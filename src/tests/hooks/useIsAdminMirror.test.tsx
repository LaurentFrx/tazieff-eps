// Sprint hotfix admin-mirror-elements (28 avril 2026) — Tests du hook
// useIsAdminMirror() qui détecte si on est sur le miroir admin côté client.

import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsAdminMirror } from "@/hooks/useIsAdminMirror";

afterEach(() => {
  vi.unstubAllGlobals();
});

function setHost(host: string) {
  vi.stubGlobal("window", {
    location: { host },
  });
}

describe("useIsAdminMirror() — détection miroir admin côté client", () => {
  it("admin.muscu-eps.fr → true (prod admin)", async () => {
    setHost("admin.muscu-eps.fr");
    const { result } = renderHook(() => useIsAdminMirror());
    await act(async () => {});
    expect(result.current).toBe(true);
  });

  it("design-admin.muscu-eps.fr → true (preview admin)", async () => {
    setHost("design-admin.muscu-eps.fr");
    const { result } = renderHook(() => useIsAdminMirror());
    await act(async () => {});
    expect(result.current).toBe(true);
  });

  it("admin.localhost:3000 → true (dev admin)", async () => {
    setHost("admin.localhost:3000");
    const { result } = renderHook(() => useIsAdminMirror());
    await act(async () => {});
    expect(result.current).toBe(true);
  });
});

describe("useIsAdminMirror() — non-admin hosts → false", () => {
  it("muscu-eps.fr → false (prod élève)", async () => {
    setHost("muscu-eps.fr");
    const { result } = renderHook(() => useIsAdminMirror());
    await act(async () => {});
    expect(result.current).toBe(false);
  });

  it("design.muscu-eps.fr → false (preview élève)", async () => {
    setHost("design.muscu-eps.fr");
    const { result } = renderHook(() => useIsAdminMirror());
    await act(async () => {});
    expect(result.current).toBe(false);
  });

  it("prof.muscu-eps.fr → false (sous-domaine prof, pas admin)", async () => {
    setHost("prof.muscu-eps.fr");
    const { result } = renderHook(() => useIsAdminMirror());
    await act(async () => {});
    expect(result.current).toBe(false);
  });

  it("design-prof.muscu-eps.fr → false (preview prof)", async () => {
    setHost("design-prof.muscu-eps.fr");
    const { result } = renderHook(() => useIsAdminMirror());
    await act(async () => {});
    expect(result.current).toBe(false);
  });

  it("localhost:3000 → false (dev élève)", async () => {
    setHost("localhost:3000");
    const { result } = renderHook(() => useIsAdminMirror());
    await act(async () => {});
    expect(result.current).toBe(false);
  });

  it("host inconnu → false (deny by default)", async () => {
    setHost("preview-pr-42.example.com");
    const { result } = renderHook(() => useIsAdminMirror());
    await act(async () => {});
    expect(result.current).toBe(false);
  });
});
