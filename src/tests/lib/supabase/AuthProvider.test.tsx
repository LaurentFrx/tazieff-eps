// Sprint P0.7-sexies — Tests du AuthProvider (élève).
// Sprint A3 — AuthProvider est désormais un alias d'IdentityProvider en
// mode="eleve". Le contrat critique reste identique (cf. tests ci-dessous) :
// si une session existe en cookies au mount, on ne déclenche PAS
// signInAnonymously. Le mock cible désormais `getSupabaseBrowserClient`
// (synchrone, source unique post-A3) au lieu de l'ancien wrapper async.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
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
    },
  })),
}));

import { AuthProvider, AuthContext } from "@/lib/supabase/AuthProvider";

function Probe() {
  const ctx = useContext(AuthContext);
  return (
    <div>
      <span data-testid="user-id">{ctx.user?.id ?? "null"}</span>
      <span data-testid="user-email">{ctx.user?.email ?? "anon"}</span>
      <span data-testid="loading">{ctx.isLoading ? "yes" : "no"}</span>
      <span data-testid="anon">{ctx.isAnonymous ? "yes" : "no"}</span>
    </div>
  );
}

beforeEach(() => {
  getSessionMock.mockReset();
  signInAnonymouslyMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AuthProvider — contrat critique miroir admin (P0.7-sexies)", () => {
  it("session admin valide → setUser(admin), AUCUN signInAnonymously", async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "u-admin-1",
            email: "contact@muscu-eps.fr",
            is_anonymous: false,
          },
        },
      },
    });

    const { getByTestId } = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("no");
    });
    expect(getByTestId("user-id").textContent).toBe("u-admin-1");
    expect(getByTestId("user-email").textContent).toBe("contact@muscu-eps.fr");
    expect(getByTestId("anon").textContent).toBe("no");
    expect(signInAnonymouslyMock).not.toHaveBeenCalled();
  });

  it("session anonyme préexistante → setUser(anonymous), pas de re-signin", async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: { id: "u-anon-1", email: null, is_anonymous: true },
        },
      },
    });

    const { getByTestId } = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("no");
    });
    expect(getByTestId("user-id").textContent).toBe("u-anon-1");
    expect(getByTestId("anon").textContent).toBe("yes");
    expect(signInAnonymouslyMock).not.toHaveBeenCalled();
  });

  it("aucune session → signInAnonymously appelé (host élève vierge)", async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });
    signInAnonymouslyMock.mockResolvedValue({
      data: { user: { id: "u-new-anon", email: null, is_anonymous: true } },
    });

    const { getByTestId } = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("no");
    });
    expect(signInAnonymouslyMock).toHaveBeenCalledTimes(1);
    expect(getByTestId("user-id").textContent).toBe("u-new-anon");
    expect(getByTestId("anon").textContent).toBe("yes");
  });

  it("getSession throw → ne crash pas, isLoading passe à false (sans signInAnonymously)", async () => {
    getSessionMock.mockRejectedValue(new Error("network"));

    const { getByTestId } = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("no");
    });
    expect(getByTestId("user-id").textContent).toBe("null");
    // Le catch silencieux n'appelle pas signInAnonymously en cas d'erreur,
    // ce qui évite d'écraser une session admin éventuellement valide.
    expect(signInAnonymouslyMock).not.toHaveBeenCalled();
  });
});

describe("AuthProvider — disableAnonymousFallback (P0.7-septies)", () => {
  it("disableAnonymousFallback=true + pas de session : user reste null, signInAnonymously NON appelé", async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });

    const { getByTestId } = render(
      <AuthProvider disableAnonymousFallback>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("no");
    });
    expect(getByTestId("user-id").textContent).toBe("null");
    expect(getByTestId("anon").textContent).toBe("no");
    expect(signInAnonymouslyMock).not.toHaveBeenCalled();
  });

  it("disableAnonymousFallback=true + session admin existante : user lu correctement (pas d'écrasement)", async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "u-admin-1",
            email: "contact@muscu-eps.fr",
            is_anonymous: false,
          },
        },
      },
    });

    const { getByTestId } = render(
      <AuthProvider disableAnonymousFallback>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("no");
    });
    expect(getByTestId("user-id").textContent).toBe("u-admin-1");
    expect(getByTestId("user-email").textContent).toBe("contact@muscu-eps.fr");
    expect(getByTestId("anon").textContent).toBe("no");
    expect(signInAnonymouslyMock).not.toHaveBeenCalled();
  });

  it("disableAnonymousFallback=false (défaut élève) + pas de session : signInAnonymously appelé (non-régression)", async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });
    signInAnonymouslyMock.mockResolvedValue({
      data: { user: { id: "u-anon-fresh", email: null, is_anonymous: true } },
    });

    const { getByTestId } = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("no");
    });
    expect(signInAnonymouslyMock).toHaveBeenCalledTimes(1);
    expect(getByTestId("user-id").textContent).toBe("u-anon-fresh");
    expect(getByTestId("anon").textContent).toBe("yes");
  });
});

