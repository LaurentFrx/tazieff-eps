// Sprint P0.7 — Tests de POST /api/auth/admin-magic-link.
//
// Anti-leak : la route répond 200 dans tous les cas (admin trouvé ou non),
// sauf en cas d'erreur Supabase réelle (500) ou de validation Zod (400).

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
  getSupabaseServiceClient: vi.fn(),
}));

import {
  createSupabaseServerClient,
  getSupabaseServiceClient,
} from "@/lib/supabase/server";
import { POST } from "@/app/api/auth/admin-magic-link/route";

const mockCreate = createSupabaseServerClient as unknown as ReturnType<
  typeof vi.fn
>;
const mockService = getSupabaseServiceClient as unknown as ReturnType<
  typeof vi.fn
>;

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

function makeUserClient({
  signInWithOtpError = null,
}: {
  signInWithOtpError?: { message: string } | null;
} = {}) {
  return {
    auth: {
      signInWithOtp: vi.fn(() =>
        Promise.resolve({ data: {}, error: signInWithOtpError }),
      ),
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
  mockCreate.mockReset();
  mockService.mockReset();
});

describe("POST /api/auth/admin-magic-link", () => {
  it("400 si email invalide (validation Zod)", async () => {
    mockService.mockReturnValue(makeServiceClient({}));
    mockCreate.mockResolvedValue(makeUserClient());
    const res = await POST(makePostRequest({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("validation");
  });

  it("200 sans envoi si email valide non admin (anti-leak)", async () => {
    const userClient = makeUserClient();
    mockService.mockReturnValue(
      makeServiceClient({
        appAdminRows: [{ user_id: "u-admin" }],
        authUsers: [{ id: "u-other", email: "stranger@example.com" }],
      }),
    );
    mockCreate.mockResolvedValue(userClient);
    const res = await POST(
      makePostRequest({ email: "stranger@example.com" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    // signInWithOtp NE doit PAS avoir été appelé
    expect(userClient.auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it("200 et signInWithOtp appelé si email correspond à un admin", async () => {
    const userClient = makeUserClient();
    mockService.mockReturnValue(
      makeServiceClient({
        appAdminRows: [{ user_id: "u-admin" }],
        authUsers: [{ id: "u-admin", email: "contact@muscu-eps.fr" }],
      }),
    );
    mockCreate.mockResolvedValue(userClient);
    const res = await POST(
      makePostRequest({ email: "contact@muscu-eps.fr" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(userClient.auth.signInWithOtp).toHaveBeenCalledTimes(1);
    const callArgs = userClient.auth.signInWithOtp.mock.calls[0]?.[0] as {
      email: string;
      options: { emailRedirectTo: string; shouldCreateUser: boolean };
    };
    expect(callArgs.email).toBe("contact@muscu-eps.fr");
    expect(callArgs.options.shouldCreateUser).toBe(false);
    expect(callArgs.options.emailRedirectTo).toMatch(/\/auth\/callback\?next=\/admin$/);
  });

  it("500 si Supabase signInWithOtp renvoie une erreur", async () => {
    const userClient = makeUserClient({
      signInWithOtpError: { message: "rate limit" },
    });
    mockService.mockReturnValue(
      makeServiceClient({
        appAdminRows: [{ user_id: "u-admin" }],
        authUsers: [{ id: "u-admin", email: "contact@muscu-eps.fr" }],
      }),
    );
    mockCreate.mockResolvedValue(userClient);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(
      makePostRequest({ email: "contact@muscu-eps.fr" }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("internal");
    errorSpy.mockRestore();
  });

  it("normalise email en minuscules avant lookup", async () => {
    const userClient = makeUserClient();
    mockService.mockReturnValue(
      makeServiceClient({
        appAdminRows: [{ user_id: "u-admin" }],
        authUsers: [{ id: "u-admin", email: "contact@muscu-eps.fr" }],
      }),
    );
    mockCreate.mockResolvedValue(userClient);
    const res = await POST(
      makePostRequest({ email: "  CONTACT@MUSCU-EPS.FR  " }),
    );
    expect(res.status).toBe(200);
    expect(userClient.auth.signInWithOtp).toHaveBeenCalledTimes(1);
    const callArgs = userClient.auth.signInWithOtp.mock.calls[0]?.[0] as {
      email: string;
    };
    expect(callArgs.email).toBe("contact@muscu-eps.fr");
  });

  it("200 sans envoi si app_admins est vide", async () => {
    const userClient = makeUserClient();
    mockService.mockReturnValue(
      makeServiceClient({
        appAdminRows: [],
        authUsers: [{ id: "u-x", email: "x@example.com" }],
      }),
    );
    mockCreate.mockResolvedValue(userClient);
    const res = await POST(makePostRequest({ email: "x@example.com" }));
    expect(res.status).toBe(200);
    expect(userClient.auth.signInWithOtp).not.toHaveBeenCalled();
  });
});
