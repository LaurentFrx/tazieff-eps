// Sprint P0.7 + P0.8 — Tests de POST /api/auth/admin-magic-link.
//
// P0.8 : la route est désormais un pré-check d'éligibilité pur.
// Plus d'appel signInWithOtp côté serveur (déplacé côté client). La route
// retourne 200 { eligible: boolean } dans tous les cas (anti-leak).
// Délai constant 1.5s minimum avant retour (anti-énumération via timing).

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServiceClient: vi.fn(),
}));

vi.mock("@/lib/auth/constantDelay", () => ({
  // Mock par défaut : délai instantané pour les tests rapides.
  // Test dédié au délai utilise un override explicite.
  constantResponseDelay: vi.fn(() => Promise.resolve()),
}));

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { constantResponseDelay } from "@/lib/auth/constantDelay";
import { POST } from "@/app/api/auth/admin-magic-link/route";

const mockService = getSupabaseServiceClient as unknown as ReturnType<
  typeof vi.fn
>;
const mockDelay = constantResponseDelay as unknown as ReturnType<typeof vi.fn>;

type AppAdminRow = { user_id: string };

function makeServiceClient({
  appAdminRows = [],
  authUsers = [],
}: {
  appAdminRows?: AppAdminRow[];
  authUsers?: { id: string; email: string }[];
}) {
  const fromAdmins: Record<string, unknown> = {
    select: vi.fn(() => fromAdmins),
    returns: vi.fn(() => Promise.resolve({ data: appAdminRows, error: null })),
  };
  return {
    from: vi.fn((table: string) => {
      if (table === "app_admins") return fromAdmins;
      return fromAdmins;
    }),
    auth: {
      admin: {
        listUsers: vi.fn(() =>
          Promise.resolve({ data: { users: authUsers }, error: null }),
        ),
      },
    },
  };
}

function makePostRequest(body: unknown) {
  return new Request("https://admin.muscu-eps.fr/api/auth/admin-magic-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockService.mockReset();
  mockDelay.mockReset();
  mockDelay.mockImplementation(() => Promise.resolve());
});

describe("POST /api/auth/admin-magic-link", () => {
  it("400 si email invalide (validation Zod)", async () => {
    mockService.mockReturnValue(makeServiceClient({}));
    const res = await POST(makePostRequest({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("validation");
  });

  it("200 eligible: false si email valide non admin (anti-leak)", async () => {
    mockService.mockReturnValue(
      makeServiceClient({
        appAdminRows: [{ user_id: "u-admin" }],
        authUsers: [{ id: "u-other", email: "stranger@example.com" }],
      }),
    );
    const res = await POST(
      makePostRequest({ email: "stranger@example.com" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.eligible).toBe(false);
  });

  it("200 eligible: true si email correspond à un admin", async () => {
    mockService.mockReturnValue(
      makeServiceClient({
        appAdminRows: [{ user_id: "u-admin" }],
        authUsers: [{ id: "u-admin", email: "contact@muscu-eps.fr" }],
      }),
    );
    const res = await POST(
      makePostRequest({ email: "contact@muscu-eps.fr" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.eligible).toBe(true);
  });

  it("normalise email en minuscules avant lookup", async () => {
    mockService.mockReturnValue(
      makeServiceClient({
        appAdminRows: [{ user_id: "u-admin" }],
        authUsers: [{ id: "u-admin", email: "contact@muscu-eps.fr" }],
      }),
    );
    const res = await POST(
      makePostRequest({ email: "  CONTACT@MUSCU-EPS.FR  " }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.eligible).toBe(true);
  });

  it("200 eligible: false si app_admins est vide", async () => {
    mockService.mockReturnValue(
      makeServiceClient({
        appAdminRows: [],
        authUsers: [{ id: "u-x", email: "x@example.com" }],
      }),
    );
    const res = await POST(makePostRequest({ email: "x@example.com" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.eligible).toBe(false);
  });

  it("appelle constantResponseDelay pour absorber le timing", async () => {
    mockService.mockReturnValue(makeServiceClient({}));
    await POST(makePostRequest({ email: "anyone@example.com" }));
    expect(mockDelay).toHaveBeenCalledWith(1500);
  });

  it("respecte le délai minimum côté wall-clock", async () => {
    // On simule un délai réel court (50ms) pour vérifier que la route
    // attend bien la promesse avant de retourner.
    mockDelay.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 50)),
    );
    mockService.mockReturnValue(makeServiceClient({}));
    const start = Date.now();
    await POST(makePostRequest({ email: "anyone@example.com" }));
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40);
  });
});
