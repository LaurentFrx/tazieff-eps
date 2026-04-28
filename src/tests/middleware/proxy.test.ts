// Phase E.2.2.5 — Tests du proxy (ex-middleware) Next.js 16.
// Vérifie les 3 grandes responsabilités du proxy :
//   1. Admin basic auth (non testé ici — état initial préservé)
//   2. Host-based routing (rewrite /prof/*, protection croisée) — CE TEST
//   3. i18n locale rewrite (fallback /fr/) — partiel

import { describe, it, expect, vi } from "vitest";

// Mocks pour NextResponse sans importer Next.js runtime
vi.mock("next/server", async () => {
  return {
    NextResponse: {
      next: () => ({ type: "next", rewriteUrl: null }) as unknown,
      rewrite: (url: URL) =>
        ({ type: "rewrite", rewriteUrl: url.toString() }) as unknown,
    },
  };
});

import { proxy } from "@/proxy";

type MockReq = {
  headers: { get: (k: string) => string | null };
  nextUrl: URL & { clone(): URL };
};

function makeRequest(host: string, pathname: string): MockReq {
  const url = new URL(`https://${host}${pathname}`);
  const nextUrl = Object.assign(url, {
    clone(): URL {
      return new URL(url.toString());
    },
  });
  return {
    headers: {
      get: (k: string) => (k.toLowerCase() === "host" ? host : null),
    },
    nextUrl,
  };
}

describe("proxy — host prof → rewrite vers /prof/*", () => {
  it("rewrite / vers /prof sur prof.muscu-eps.fr", () => {
    const req = makeRequest("prof.muscu-eps.fr", "/");
    const result = proxy(req as never) as {
      type: string;
      rewriteUrl: string;
    };
    expect(result.type).toBe("rewrite");
    expect(result.rewriteUrl).toMatch(/\/prof$/);
  });

  it("rewrite /connexion vers /prof/connexion sur prof.muscu-eps.fr", () => {
    const req = makeRequest("prof.muscu-eps.fr", "/connexion");
    const result = proxy(req as never) as {
      type: string;
      rewriteUrl: string;
    };
    expect(result.type).toBe("rewrite");
    expect(result.rewriteUrl).toMatch(/\/prof\/connexion$/);
  });

  it("rewrite sur design-prof.muscu-eps.fr (preview)", () => {
    const req = makeRequest("design-prof.muscu-eps.fr", "/connexion");
    const result = proxy(req as never) as {
      type: string;
      rewriteUrl: string;
    };
    expect(result.type).toBe("rewrite");
    expect(result.rewriteUrl).toMatch(/\/prof\/connexion$/);
  });

  it("pass-through si path déjà /prof/* sur host prof (pas de double rewrite)", () => {
    const req = makeRequest("prof.muscu-eps.fr", "/prof/connexion");
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });
});

describe("proxy — protection croisée : host élève + /prof/* = 404", () => {
  it("rewrite /prof/connexion vers /_not-found sur muscu-eps.fr", () => {
    const req = makeRequest("muscu-eps.fr", "/prof/connexion");
    const result = proxy(req as never) as {
      type: string;
      rewriteUrl: string;
    };
    expect(result.type).toBe("rewrite");
    expect(result.rewriteUrl).toMatch(/\/_not-found$/);
  });

  it("rewrite /prof/dev/login vers /_not-found sur design.muscu-eps.fr", () => {
    const req = makeRequest("design.muscu-eps.fr", "/prof/dev/login");
    const result = proxy(req as never) as {
      type: string;
      rewriteUrl: string;
    };
    expect(result.type).toBe("rewrite");
    expect(result.rewriteUrl).toMatch(/\/_not-found$/);
  });
});

describe("proxy — pass-through assets / API / auth", () => {
  it("pass-through sur /api/* (host prof)", () => {
    const req = makeRequest("prof.muscu-eps.fr", "/api/teacher/annotations");
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });

  it("pass-through sur /auth/callback (host prof)", () => {
    const req = makeRequest("prof.muscu-eps.fr", "/auth/callback");
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });

  it("pass-through sur /_next/static/* (host élève)", () => {
    const req = makeRequest("muscu-eps.fr", "/_next/static/chunks/abc.js");
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });

  it("pass-through sur fichiers avec extension (favicon.ico)", () => {
    const req = makeRequest("prof.muscu-eps.fr", "/favicon.ico");
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });
});

describe("proxy — i18n locale rewrite (espace élève)", () => {
  it("rewrite / vers /fr/ sur muscu-eps.fr (pas de locale, pas de host prof)", () => {
    const req = makeRequest("muscu-eps.fr", "/");
    const result = proxy(req as never) as {
      type: string;
      rewriteUrl: string;
    };
    expect(result.type).toBe("rewrite");
    // Le proxy hérité préfixe / → /fr/ (trailing slash). Next.js normalise.
    expect(result.rewriteUrl).toMatch(/\/fr\/?$/);
  });

  it("pass-through sur /fr/exercices (déjà préfixé locale)", () => {
    const req = makeRequest("muscu-eps.fr", "/fr/exercices");
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });

  it("pass-through sur /en (locale seule)", () => {
    const req = makeRequest("muscu-eps.fr", "/en");
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });
});

describe("proxy — dev local prof.localhost", () => {
  it("rewrite / vers /prof sur prof.localhost:3000", () => {
    const req = makeRequest("prof.localhost:3000", "/");
    const result = proxy(req as never) as {
      type: string;
      rewriteUrl: string;
    };
    expect(result.type).toBe("rewrite");
    expect(result.rewriteUrl).toMatch(/\/prof$/);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Sprint P0.7 — host admin
// ─────────────────────────────────────────────────────────────────────

describe("proxy — host admin → rewrite vers /admin/*", () => {
  it("rewrite /login vers /admin/login sur admin.muscu-eps.fr", () => {
    const req = makeRequest("admin.muscu-eps.fr", "/login");
    const result = proxy(req as never) as {
      type: string;
      rewriteUrl: string;
    };
    expect(result.type).toBe("rewrite");
    expect(result.rewriteUrl).toMatch(/\/admin\/login$/);
  });

  it("rewrite / vers /admin sur admin.muscu-eps.fr", () => {
    const req = makeRequest("admin.muscu-eps.fr", "/");
    const result = proxy(req as never) as {
      type: string;
      rewriteUrl: string;
    };
    expect(result.type).toBe("rewrite");
    expect(result.rewriteUrl).toMatch(/\/admin$/);
  });

  it("rewrite sur design-admin.muscu-eps.fr (preview)", () => {
    const req = makeRequest("design-admin.muscu-eps.fr", "/login");
    const result = proxy(req as never) as {
      type: string;
      rewriteUrl: string;
    };
    expect(result.type).toBe("rewrite");
    expect(result.rewriteUrl).toMatch(/\/admin\/login$/);
  });

  it("pass-through si path déjà /admin/* sur host admin (pas de double rewrite)", () => {
    const req = makeRequest("admin.muscu-eps.fr", "/admin/login");
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });

  it("rewrite / vers /admin sur admin.localhost:3000 (dev local)", () => {
    const req = makeRequest("admin.localhost:3000", "/");
    const result = proxy(req as never) as {
      type: string;
      rewriteUrl: string;
    };
    expect(result.type).toBe("rewrite");
    expect(result.rewriteUrl).toMatch(/\/admin$/);
  });
});

describe("proxy — protection croisée : host élève + /admin/* = 404", () => {
  it("rewrite /admin/login vers /_not-found sur muscu-eps.fr", () => {
    const req = makeRequest("muscu-eps.fr", "/admin/login");
    const result = proxy(req as never) as {
      type: string;
      rewriteUrl: string;
    };
    expect(result.type).toBe("rewrite");
    expect(result.rewriteUrl).toMatch(/\/_not-found$/);
  });

  it("rewrite /admin/foo vers /_not-found sur design.muscu-eps.fr", () => {
    const req = makeRequest("design.muscu-eps.fr", "/admin/foo");
    const result = proxy(req as never) as {
      type: string;
      rewriteUrl: string;
    };
    expect(result.type).toBe("rewrite");
    expect(result.rewriteUrl).toMatch(/\/_not-found$/);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Sprint P0.7-bis — miroir d'édition admin
// ─────────────────────────────────────────────────────────────────────

describe("proxy — host admin : miroir d'édition (P0.7-bis)", () => {
  it("pass-through /exercices sur admin.muscu-eps.fr (pas de rewrite vers /admin)", () => {
    const req = makeRequest("admin.muscu-eps.fr", "/exercices");
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });

  it("pass-through /exercices/s1-01 sur admin.muscu-eps.fr", () => {
    const req = makeRequest("admin.muscu-eps.fr", "/exercices/s1-01");
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });

  it("pass-through /api/teacher/exercise-override sur admin.muscu-eps.fr", () => {
    const req = makeRequest(
      "admin.muscu-eps.fr",
      "/api/teacher/exercise-override",
    );
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });

  it("pass-through /api/me/role sur admin.muscu-eps.fr", () => {
    const req = makeRequest("admin.muscu-eps.fr", "/api/me/role");
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });

  it("pass-through /_next/static/foo.js sur admin.muscu-eps.fr", () => {
    const req = makeRequest("admin.muscu-eps.fr", "/_next/static/foo.js");
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });

  it("pass-through /methodes (préparation futur) sur admin.muscu-eps.fr", () => {
    const req = makeRequest("admin.muscu-eps.fr", "/methodes");
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });

  it("pass-through /exercices sur design-admin.muscu-eps.fr (preview)", () => {
    const req = makeRequest("design-admin.muscu-eps.fr", "/exercices");
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });

  it("toujours rewrite /ma-classe vers /admin/ma-classe sur admin.muscu-eps.fr (rejet implicite)", () => {
    const req = makeRequest("admin.muscu-eps.fr", "/ma-classe");
    const result = proxy(req as never) as {
      type: string;
      rewriteUrl: string;
    };
    expect(result.type).toBe("rewrite");
    expect(result.rewriteUrl).toMatch(/\/admin\/ma-classe$/);
  });

  it("toujours rewrite /enseignant vers /admin/enseignant sur admin.muscu-eps.fr (rejet implicite)", () => {
    const req = makeRequest("admin.muscu-eps.fr", "/enseignant");
    const result = proxy(req as never) as {
      type: string;
      rewriteUrl: string;
    };
    expect(result.type).toBe("rewrite");
    expect(result.rewriteUrl).toMatch(/\/admin\/enseignant$/);
  });

  it("non-régression : muscu-eps.fr/admin/login reste bloqué (croisé)", () => {
    const req = makeRequest("muscu-eps.fr", "/admin/login");
    const result = proxy(req as never) as {
      type: string;
      rewriteUrl: string;
    };
    expect(result.type).toBe("rewrite");
    expect(result.rewriteUrl).toMatch(/\/_not-found$/);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Sprint P0.7-ter — miroir admin pour routes localisées /fr/* /en/* /es/*
// ─────────────────────────────────────────────────────────────────────

describe("proxy — host admin : miroir d'édition localisé (P0.7-ter)", () => {
  it("pass-through /fr/exercices sur admin.muscu-eps.fr", () => {
    const req = makeRequest("admin.muscu-eps.fr", "/fr/exercices");
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });

  it("pass-through /fr/exercices/s1-01 sur admin.muscu-eps.fr", () => {
    const req = makeRequest("admin.muscu-eps.fr", "/fr/exercices/s1-01");
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });

  it("pass-through /en/exercices sur admin.muscu-eps.fr", () => {
    const req = makeRequest("admin.muscu-eps.fr", "/en/exercices");
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });

  it("pass-through /es/exercices sur admin.muscu-eps.fr", () => {
    const req = makeRequest("admin.muscu-eps.fr", "/es/exercices");
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });

  it("pass-through /fr/methodes sur admin.muscu-eps.fr", () => {
    const req = makeRequest("admin.muscu-eps.fr", "/fr/methodes");
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });

  it("pass-through /fr/bac sur admin.muscu-eps.fr", () => {
    const req = makeRequest("admin.muscu-eps.fr", "/fr/bac");
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });

  it("pass-through /fr/learn sur admin.muscu-eps.fr", () => {
    const req = makeRequest("admin.muscu-eps.fr", "/fr/learn");
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });

  it("rewrite /fr/ma-classe vers /admin/fr/ma-classe (rejet implicite, locale conservée)", () => {
    const req = makeRequest("admin.muscu-eps.fr", "/fr/ma-classe");
    const result = proxy(req as never) as {
      type: string;
      rewriteUrl: string;
    };
    expect(result.type).toBe("rewrite");
    expect(result.rewriteUrl).toMatch(/\/admin\/fr\/ma-classe$/);
  });

  it("rewrite /fr/enseignant vers /admin/fr/enseignant (rejet implicite, locale conservée)", () => {
    const req = makeRequest("admin.muscu-eps.fr", "/fr/enseignant");
    const result = proxy(req as never) as {
      type: string;
      rewriteUrl: string;
    };
    expect(result.type).toBe("rewrite");
    expect(result.rewriteUrl).toMatch(/\/admin\/fr\/enseignant$/);
  });

  it("pass-through /fr/exercices/s1-01 sur design-admin.muscu-eps.fr (preview)", () => {
    const req = makeRequest("design-admin.muscu-eps.fr", "/fr/exercices/s1-01");
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });

  it("pass-through /en/methodes/circuit sur admin.muscu-eps.fr", () => {
    const req = makeRequest("admin.muscu-eps.fr", "/en/methodes/circuit");
    const result = proxy(req as never) as { type: string };
    expect(result.type).toBe("next");
  });

  it("non-régression : muscu-eps.fr/admin/fr/login reste bloqué (croisé)", () => {
    const req = makeRequest("muscu-eps.fr", "/admin/fr/login");
    const result = proxy(req as never) as {
      type: string;
      rewriteUrl: string;
    };
    expect(result.type).toBe("rewrite");
    expect(result.rewriteUrl).toMatch(/\/_not-found$/);
  });
});
