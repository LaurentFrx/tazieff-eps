// Sprint P0.7 — Tests du provider AdminAuthProvider.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

let mockSession: { user: { id: string; email: string } | null } | null = null;
let onAuthChangeCallback:
  | ((event: string, session: typeof mockSession) => void)
  | null = null;

vi.mock("@/lib/supabase/browser", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: mockSession } }),
      ),
      onAuthStateChange: vi.fn((cb) => {
        onAuthChangeCallback = cb;
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        };
      }),
    },
  }),
}));

import {
  AdminAuthProvider,
  useAdminAuthContext,
} from "@/lib/supabase/AdminAuthProvider";

const originalFetch = global.fetch;

function mockRoleFetch(role: { is_admin: boolean; is_super_admin: boolean }) {
  return vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify(role), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  ) as unknown as typeof fetch;
}

function StatusProbe() {
  const ctx = useAdminAuthContext();
  return (
    <div>
      <span data-testid="email">{ctx.user?.email ?? "anon"}</span>
      <span data-testid="loading">{ctx.isLoading ? "yes" : "no"}</span>
      <span data-testid="is-admin">{ctx.isAdmin ? "yes" : "no"}</span>
      <span data-testid="is-super">{ctx.isSuperAdmin ? "yes" : "no"}</span>
    </div>
  );
}

beforeEach(() => {
  mockSession = null;
  onAuthChangeCallback = null;
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("AdminAuthProvider", () => {
  it("pas de session : user null, isAdmin false", async () => {
    mockSession = null;
    global.fetch = mockRoleFetch({ is_admin: false, is_super_admin: false });
    render(
      <AdminAuthProvider>
        <StatusProbe />
      </AdminAuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("no"),
    );
    expect(screen.getByTestId("email").textContent).toBe("anon");
    expect(screen.getByTestId("is-admin").textContent).toBe("no");
  });

  it("session admin : isAdmin true et user.email exposé", async () => {
    mockSession = { user: { id: "u-admin", email: "contact@muscu-eps.fr" } };
    global.fetch = mockRoleFetch({ is_admin: true, is_super_admin: true });
    render(
      <AdminAuthProvider>
        <StatusProbe />
      </AdminAuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("is-admin").textContent).toBe("yes"),
    );
    expect(screen.getByTestId("is-super").textContent).toBe("yes");
    expect(screen.getByTestId("email").textContent).toBe("contact@muscu-eps.fr");
  });

  it("session non-admin : user présent mais isAdmin false", async () => {
    mockSession = { user: { id: "u-other", email: "noadmin@example.com" } };
    global.fetch = mockRoleFetch({ is_admin: false, is_super_admin: false });
    render(
      <AdminAuthProvider>
        <StatusProbe />
      </AdminAuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("no"),
    );
    expect(screen.getByTestId("email").textContent).toBe("noadmin@example.com");
    expect(screen.getByTestId("is-admin").textContent).toBe("no");
  });

  it("onAuthStateChange : login pousse isAdmin", async () => {
    mockSession = null;
    global.fetch = mockRoleFetch({ is_admin: true, is_super_admin: true });
    render(
      <AdminAuthProvider>
        <StatusProbe />
      </AdminAuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("no"),
    );
    expect(screen.getByTestId("is-admin").textContent).toBe("no");

    // Simule un login via onAuthStateChange
    onAuthChangeCallback?.("SIGNED_IN", {
      user: { id: "u-admin", email: "contact@muscu-eps.fr" },
    });

    await waitFor(() =>
      expect(screen.getByTestId("is-admin").textContent).toBe("yes"),
    );
    expect(screen.getByTestId("email").textContent).toBe("contact@muscu-eps.fr");
  });

  it("onAuthStateChange : logout reset isAdmin", async () => {
    mockSession = { user: { id: "u-admin", email: "admin@x.fr" } };
    global.fetch = mockRoleFetch({ is_admin: true, is_super_admin: true });
    render(
      <AdminAuthProvider>
        <StatusProbe />
      </AdminAuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("is-admin").textContent).toBe("yes"),
    );

    onAuthChangeCallback?.("SIGNED_OUT", null);

    await waitFor(() =>
      expect(screen.getByTestId("is-admin").textContent).toBe("no"),
    );
    expect(screen.getByTestId("email").textContent).toBe("anon");
  });
});
