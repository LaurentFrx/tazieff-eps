// Sprint E1 — Tests de POST /api/me/classes/join.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { POST } from "@/app/api/me/classes/join/route";

const mockCreate = createSupabaseServerClient as unknown as ReturnType<
  typeof vi.fn
>;

type EnrollmentRow = { class_id: string; classes: { join_code: string } } | null;

type ClassRow =
  | {
      id: string;
      name: string;
      school_year: string | null;
      organizations: { name: string };
    }
  | null;

function makeSupabase({
  user,
  signInAnonResult,
  upsertError = null,
  existingEnrollment = null,
  rpcResult = "00000000-0000-0000-0000-000000000abc",
  rpcError = null,
  classRow = null,
  upsertSpy,
}: {
  user: { id: string } | null;
  signInAnonResult?: { user: { id: string } | null; error: { message: string } | null };
  upsertError?: { code?: string; message: string } | null;
  existingEnrollment?: EnrollmentRow;
  rpcResult?: string | null;
  rpcError?: { code?: string; message: string } | null;
  classRow?: ClassRow;
  upsertSpy?: ReturnType<typeof vi.fn>;
}) {
  const upsertFn = upsertSpy ?? vi.fn();

  const profilesChain: Record<string, unknown> = {
    upsert: vi.fn((payload: unknown) => {
      upsertFn(payload);
      return Promise.resolve({ error: upsertError });
    }),
  };

  const enrollmentsChain: Record<string, unknown> = {
    select: vi.fn(() => enrollmentsChain),
    eq: vi.fn(() => enrollmentsChain),
    maybeSingle: vi.fn(() =>
      Promise.resolve({ data: existingEnrollment, error: null }),
    ),
  };

  const classesChain: Record<string, unknown> = {
    select: vi.fn(() => classesChain),
    eq: vi.fn(() => classesChain),
    maybeSingle: vi.fn(() => Promise.resolve({ data: classRow, error: null })),
  };

  // signInAnonymously() retourne { data: { user }, error } — on wrap.
  const signInAnonResolved = signInAnonResult
    ? {
        data: { user: signInAnonResult.user },
        error: signInAnonResult.error,
      }
    : { data: { user }, error: null };

  return {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user } })),
      signInAnonymously: vi.fn(() => Promise.resolve(signInAnonResolved)),
    },
    from: vi.fn((table: string) => {
      if (table === "student_profiles") return profilesChain;
      if (table === "class_enrollments") return enrollmentsChain;
      if (table === "classes") return classesChain;
      return classesChain;
    }),
    rpc: vi.fn((_fn: string, _args: unknown) =>
      Promise.resolve({ data: rpcResult, error: rpcError }),
    ),
  };
}

const validBody = {
  first_name: "Léa",
  last_name: "Dupont",
  code: "abcd12",
};

function makePostRequest(body: unknown) {
  return new Request("http://localhost/api/me/classes/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockCreate.mockReset();
});

describe("POST /api/me/classes/join", () => {
  it("400 si validation Zod échoue (champs manquants)", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({ user: { id: "u-1" } }),
    );
    const res = await POST(makePostRequest({ first_name: "", last_name: "", code: "x" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("validation");
  });

  it("401 si pas de session et signInAnonymously échoue", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({
        user: null,
        signInAnonResult: { user: null, error: { message: "anon failed" } },
      }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("unauthenticated");
    errorSpy.mockRestore();
  });

  it("200 et profil créé si anonyme rejoint avec succès", async () => {
    const upsertSpy = vi.fn();
    mockCreate.mockResolvedValue(
      makeSupabase({
        user: null,
        signInAnonResult: { user: { id: "u-anon" }, error: null },
        upsertSpy,
        rpcResult: "class-1",
        classRow: {
          id: "class-1",
          name: "2nde B",
          school_year: "Seconde",
          organizations: { name: "Lycée Tazieff" },
        },
      }),
    );
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.class.id).toBe("class-1");
    expect(body.class.name).toBe("2nde B");
    expect(body.organization.name).toBe("Lycée Tazieff");
    // Le profil doit avoir été upserté avec user.id de la session anonyme.
    expect(upsertSpy).toHaveBeenCalledTimes(1);
    const payload = upsertSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.user_id).toBe("u-anon");
    expect(payload.first_name).toBe("Léa");
    expect(payload.last_name).toBe("Dupont");
  });

  it("200 et profil mis à jour si user existant", async () => {
    const upsertSpy = vi.fn();
    mockCreate.mockResolvedValue(
      makeSupabase({
        user: { id: "u-existing" },
        upsertSpy,
        rpcResult: "class-2",
        classRow: {
          id: "class-2",
          name: "1ère A",
          school_year: null,
          organizations: { name: "Tazieff" },
        },
      }),
    );
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(200);
    expect(upsertSpy).toHaveBeenCalledTimes(1);
    const payload = upsertSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.user_id).toBe("u-existing");
  });

  it("404 code_not_found si la RPC lève \"Code invalide ou expiré\"", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({
        user: { id: "u-1" },
        rpcResult: null,
        rpcError: { message: "Code invalide ou expiré" },
      }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("code_not_found");
    errorSpy.mockRestore();
  });

  it("409 already_enrolled si l'utilisateur est déjà dans la classe (pré-check)", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({
        user: { id: "u-1" },
        existingEnrollment: {
          class_id: "class-3",
          classes: { join_code: "ABCD12" },
        },
      }),
    );
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("already_enrolled");
  });

  it("500 join_failed si une autre erreur RPC survient", async () => {
    mockCreate.mockResolvedValue(
      makeSupabase({
        user: { id: "u-1" },
        rpcResult: null,
        rpcError: { code: "P0001", message: "boom" },
      }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("join_failed");
    errorSpy.mockRestore();
  });

  it("le code est upper-case avant d'être passé à la RPC", async () => {
    const sb = makeSupabase({
      user: { id: "u-1" },
      rpcResult: "class-x",
      classRow: {
        id: "class-x",
        name: "X",
        school_year: null,
        organizations: { name: "Org" },
      },
    });
    mockCreate.mockResolvedValue(sb);
    await POST(makePostRequest({ ...validBody, code: " abcd12 " }));
    expect(sb.rpc).toHaveBeenCalledWith("join_class_with_code", {
      p_code: "ABCD12",
    });
  });
});
