// Sprint A3 — Tests d'IdentityProvider (source unique des sessions par mode).
//
// Couvre :
//   1. mode="eleve" + disableAnonymousFallback=false (defaut) → signInAnonymously si pas de session
//   2. mode="eleve" + disableAnonymousFallback=true → AUCUN signInAnonymously
//   3. mode="prof" → AUCUN signInAnonymously, isAcademic dérivé de l'email
//   4. mode="admin" → fetch /api/me/role hydrate isAdmin / isSuperAdmin
//   5. mode="admin" sans session → role reste anonymous, isAdmin=false
//   6. Cross-mode : useAdminSession() depuis mode="eleve" → throw explicite
//   7. Cross-mode : useTeacherSession() depuis mode="admin" → throw explicite
//   8. Helpers dérivés : isSuperAdmin, isAdmin, isAcademic cohérents avec role

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import { render, waitFor, renderHook } from "@testing-library/react";
import React, { useContext } from "react";

const getSessionMock = vi.fn();
const signInAnonymouslyMock = vi.fn();
const onAuthStateChangeMock = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}));

vi.mock("@/lib/supabase/browser", () => ({
  getSupabaseBrowserClient: vi.fn(() => ({
    auth: {
      getSession: getSessionMock,
      signInAnonymously: signInAnonymouslyMock,
      onAuthStateChange: onAuthStateChangeMock,
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  })),
}));

import {
  IdentityProvider,
  useIdentity,
} from "@/lib/auth/IdentityContext";
import {
  useStudentSession,
  useTeacherSession,
  useAdminSession,
} from "@/lib/auth/sessions";

function Probe() {
  const ctx = useIdentity();
  return (
    <div>
      <span data-testid="user-id">{ctx.user?.id ?? "null"}</span>
      <span data-testid="role">{ctx.role}</span>
      <span data-testid="loading">{ctx.isLoading ? "yes" : "no"}</span>
      <span data-testid="mode">{ctx.mode}</span>
      <span data-testid="is-admin">{ctx.isAdmin ? "yes" : "no"}</span>
      <span data-testid="is-super-admin">{ctx.isSuperAdmin ? "yes" : "no"}</span>
      <span data-testid="is-academic">{ctx.isAcademic ? "yes" : "no"}</span>
    </div>
  );
}

beforeEach(() => {
  getSessionMock.mockReset();
  signInAnonymouslyMock.mockReset();
  (globalThis as unknown as { fetch: ReturnType<typeof vi.fn> }).fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("IdentityProvider — mode='eleve'", () => {
  it("disableAnonymousFallback=false (défaut) + pas de session → signInAnonymously appelé", async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });
    signInAnonymouslyMock.mockResolvedValue({
      data: { user: { id: "u-anon", email: null, is_anonymous: true } },
    });

    const { getByTestId } = render(
      <IdentityProvider mode="eleve">
        <Probe />
      </IdentityProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("no");
    });
    expect(signInAnonymouslyMock).toHaveBeenCalledTimes(1);
    expect(getByTestId("user-id").textContent).toBe("u-anon");
    expect(getByTestId("role").textContent).toBe("anonymous");
    expect(getByTestId("mode").textContent).toBe("eleve");
  });

  it("disableAnonymousFallback=true + pas de session → user reste null, signInAnonymously NON appelé", async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });

    const { getByTestId } = render(
      <IdentityProvider mode="eleve" disableAnonymousFallback>
        <Probe />
      </IdentityProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("no");
    });
    expect(signInAnonymouslyMock).not.toHaveBeenCalled();
    expect(getByTestId("user-id").textContent).toBe("null");
  });

  it("session existante (admin lu en miroir) → user lu, role=student, pas de re-signin", async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "u-laurent",
            email: "laurent@feroux.fr",
            is_anonymous: false,
          },
        },
      },
    });

    const { getByTestId } = render(
      <IdentityProvider mode="eleve">
        <Probe />
      </IdentityProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("no");
    });
    expect(getByTestId("user-id").textContent).toBe("u-laurent");
    expect(getByTestId("role").textContent).toBe("student"); // pas teacher (email non académique)
    expect(signInAnonymouslyMock).not.toHaveBeenCalled();
  });
});

describe("IdentityProvider — mode='prof'", () => {
  it("PAS de signInAnonymously par défaut (effectiveDisable=true sur prof)", async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });

    const { getByTestId } = render(
      <IdentityProvider mode="prof">
        <Probe />
      </IdentityProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("no");
    });
    expect(signInAnonymouslyMock).not.toHaveBeenCalled();
    expect(getByTestId("user-id").textContent).toBe("null");
    expect(getByTestId("role").textContent).toBe("anonymous");
    expect(getByTestId("mode").textContent).toBe("prof");
  });

  it("session prof académique → role=teacher, isAcademic=true", async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "u-prof",
            email: "fred@ac-bordeaux.fr",
            is_anonymous: false,
          },
        },
      },
    });

    const { getByTestId } = render(
      <IdentityProvider mode="prof">
        <Probe />
      </IdentityProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("no");
    });
    expect(getByTestId("role").textContent).toBe("teacher");
    expect(getByTestId("is-academic").textContent).toBe("yes");
    expect(getByTestId("is-admin").textContent).toBe("no");
  });
});

describe("IdentityProvider — mode='admin'", () => {
  it("session admin + /api/me/role retourne is_super_admin=true → role='super_admin'", async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "u-laurent",
            email: "laurent@feroux.fr",
            is_anonymous: false,
          },
        },
      },
    });
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ is_admin: true, is_super_admin: true }),
    });

    const { getByTestId } = render(
      <IdentityProvider mode="admin">
        <Probe />
      </IdentityProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("no");
    });
    await waitFor(() => {
      expect(getByTestId("is-super-admin").textContent).toBe("yes");
    });
    expect(getByTestId("role").textContent).toBe("super_admin");
    expect(getByTestId("is-admin").textContent).toBe("yes");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/me/role",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("session admin + /api/me/role retourne is_admin=true mais is_super_admin=false → role='admin'", async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "u-admin-2",
            email: "admin@example.com",
            is_anonymous: false,
          },
        },
      },
    });
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ is_admin: true, is_super_admin: false }),
    });

    const { getByTestId } = render(
      <IdentityProvider mode="admin">
        <Probe />
      </IdentityProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("no");
    });
    await waitFor(() => {
      expect(getByTestId("is-admin").textContent).toBe("yes");
    });
    expect(getByTestId("role").textContent).toBe("admin");
    expect(getByTestId("is-super-admin").textContent).toBe("no");
  });

  it("mode='admin' sans session → role reste 'anonymous', isAdmin=false, AUCUN appel /api/me/role", async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });

    const { getByTestId } = render(
      <IdentityProvider mode="admin">
        <Probe />
      </IdentityProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("no");
    });
    expect(getByTestId("role").textContent).toBe("anonymous");
    expect(getByTestId("is-admin").textContent).toBe("no");
    expect(signInAnonymouslyMock).not.toHaveBeenCalled();
    // /api/me/role n'est pas appelé tant que user est null.
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("mode='admin' + /api/me/role HTTP 500 → fallback deny (isAdmin=false)", async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "u-admin-3",
            email: "admin@example.com",
            is_anonymous: false,
          },
        },
      },
    });
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const { getByTestId } = render(
      <IdentityProvider mode="admin">
        <Probe />
      </IdentityProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("no");
    });
    expect(getByTestId("is-admin").textContent).toBe("no");
    expect(getByTestId("role").textContent).toBe("student"); // fallback non-admin
  });
});

/* ── Cross-mode : assertIdentityMode garde les hooks spécialisés ──────── */

describe("Hooks spécialisés — refus cross-mode (assertIdentityMode)", () => {
  it("useAdminSession() appelé sous IdentityProvider mode='eleve' → throw", () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });

    function wrapper({ children }: { children: React.ReactNode }) {
      return (
        <IdentityProvider mode="eleve" disableAnonymousFallback>
          {children}
        </IdentityProvider>
      );
    }

    // renderHook capture les exceptions dans result.error.
    const { result } = renderHook(() => {
      try {
        return useAdminSession();
      } catch (err) {
        return err instanceof Error ? err.message : String(err);
      }
    }, { wrapper });

    expect(result.current).toMatch(/mode "admin".*mode "eleve"/);
  });

  it("useTeacherSession() appelé sous IdentityProvider mode='admin' → throw", () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });

    function wrapper({ children }: { children: React.ReactNode }) {
      return (
        <IdentityProvider mode="admin">
          {children}
        </IdentityProvider>
      );
    }

    const { result } = renderHook(() => {
      try {
        return useTeacherSession();
      } catch (err) {
        return err instanceof Error ? err.message : String(err);
      }
    }, { wrapper });

    expect(result.current).toMatch(/mode "prof".*mode "admin"/);
  });

  it("useStudentSession() appelé sous IdentityProvider mode='prof' → throw", () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });

    function wrapper({ children }: { children: React.ReactNode }) {
      return (
        <IdentityProvider mode="prof">
          {children}
        </IdentityProvider>
      );
    }

    const { result } = renderHook(() => {
      try {
        return useStudentSession();
      } catch (err) {
        return err instanceof Error ? err.message : String(err);
      }
    }, { wrapper });

    expect(result.current).toMatch(/mode "eleve".*mode "prof"/);
  });
});

/* ── Hors-context : valeur par défaut sécurisée ──────────────────────── */

describe("useIdentity() hors d'un IdentityProvider — valeur par défaut", () => {
  it("retourne mode='eleve', role='anonymous', isLoading=true par défaut", () => {
    function Bare() {
      const ctx = useIdentity();
      return (
        <>
          <span data-testid="role">{ctx.role}</span>
          <span data-testid="mode">{ctx.mode}</span>
          <span data-testid="loading">{ctx.isLoading ? "yes" : "no"}</span>
        </>
      );
    }

    const { getByTestId } = render(<Bare />);
    expect(getByTestId("role").textContent).toBe("anonymous");
    expect(getByTestId("mode").textContent).toBe("eleve");
    expect(getByTestId("loading").textContent).toBe("yes");
  });
});
