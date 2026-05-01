// Sprint fix-topbar-badges (30 avril 2026) — Tests useEffectiveRole.
//
// Couvre la combinaison IdentityContext + /api/me/role, point de friction
// du bug TopBar découvert par l'audit Claude in Chrome :
//   - Sur le miroir admin (admin.muscu-eps.fr en pass-through), le
//     IdentityProvider est monté avec mode="eleve" → refreshAdminRole
//     ne tourne pas → role déclaratif = "student" malgré super_admin
//     authentifié.
//   - useEffectiveRole interroge directement /api/me/role et upgrade le
//     rôle si super_admin / admin.

import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const useIdentityMock = vi.fn();
const useAppAdminMock = vi.fn();

vi.mock("@/lib/auth/IdentityContext", async () => {
  const actual =
    await vi.importActual<
      typeof import("@/lib/auth/IdentityContext")
    >("@/lib/auth/IdentityContext");
  return {
    ...actual,
    useIdentity: () => useIdentityMock(),
  };
});

vi.mock("@/hooks/useAppAdmin", () => ({
  useAppAdmin: () => useAppAdminMock(),
}));

import { useEffectiveRole } from "./useEffectiveRole";

const baseIdentity = {
  user: null,
  isLoading: false,
  mode: "eleve" as const,
  isSuperAdmin: false,
  isAdmin: false,
  isAcademic: false,
};

describe("useEffectiveRole", () => {
  it("isLoading=true côté useAppAdmin → conserve le rôle d'IdentityContext", () => {
    useIdentityMock.mockReturnValue({ ...baseIdentity, role: "student" });
    useAppAdminMock.mockReturnValue({
      isAdmin: false,
      isSuperAdmin: false,
      isLoading: true,
      refetch: vi.fn(),
    });
    const { result } = renderHook(() => useEffectiveRole());
    expect(result.current.role).toBe("student");
    expect(result.current.isLoading).toBe(true);
  });

  it("super_admin via /api/me/role → upgrade vers super_admin même si IdentityContext dit student", async () => {
    useIdentityMock.mockReturnValue({ ...baseIdentity, role: "student" });
    useAppAdminMock.mockReturnValue({
      isAdmin: true,
      isSuperAdmin: true,
      isLoading: false,
      refetch: vi.fn(),
    });
    const { result } = renderHook(() => useEffectiveRole());
    await waitFor(() => {
      expect(result.current.role).toBe("super_admin");
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("admin (pas super) via /api/me/role → upgrade vers admin", () => {
    useIdentityMock.mockReturnValue({ ...baseIdentity, role: "student" });
    useAppAdminMock.mockReturnValue({
      isAdmin: true,
      isSuperAdmin: false,
      isLoading: false,
      refetch: vi.fn(),
    });
    const { result } = renderHook(() => useEffectiveRole());
    expect(result.current.role).toBe("admin");
  });

  it("ni admin ni super_admin → conserve le rôle d'IdentityContext (teacher)", () => {
    useIdentityMock.mockReturnValue({ ...baseIdentity, role: "teacher" });
    useAppAdminMock.mockReturnValue({
      isAdmin: false,
      isSuperAdmin: false,
      isLoading: false,
      refetch: vi.fn(),
    });
    const { result } = renderHook(() => useEffectiveRole());
    expect(result.current.role).toBe("teacher");
  });

  it("ni admin ni super_admin + IdentityContext anonymous → reste anonymous", () => {
    useIdentityMock.mockReturnValue({ ...baseIdentity, role: "anonymous" });
    useAppAdminMock.mockReturnValue({
      isAdmin: false,
      isSuperAdmin: false,
      isLoading: false,
      refetch: vi.fn(),
    });
    const { result } = renderHook(() => useEffectiveRole());
    expect(result.current.role).toBe("anonymous");
  });

  it("super_admin résolu PRIME sur le rôle déclaratif teacher d'IdentityContext", () => {
    // Cas concret : super_admin authentifié avec email académique sur le
    // miroir admin → IdentityContext mode="eleve" + email académique →
    // role déclaratif = "teacher". Mais /api/me/role dit super_admin.
    // On veut « super_admin » côté UI (couleur rouge, accès admin).
    useIdentityMock.mockReturnValue({ ...baseIdentity, role: "teacher" });
    useAppAdminMock.mockReturnValue({
      isAdmin: true,
      isSuperAdmin: true,
      isLoading: false,
      refetch: vi.fn(),
    });
    const { result } = renderHook(() => useEffectiveRole());
    expect(result.current.role).toBe("super_admin");
  });
});
