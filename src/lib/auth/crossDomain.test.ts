// Sprint C1 — Tests du helper auth cross-domain (fonctions pures).
//
// On ne teste pas les fonctions qui touchent Supabase ici (insertCrossDomainToken,
// findActiveToken, markTokenConsumed, computeAccessibleRoles) — celles-ci sont
// couvertes en intégration via les routes API, et leur dépendance sur
// createSupabaseAdminClient impose l'environnement service_role qui n'est pas
// disponible en jsdom.

import { describe, it, expect } from "vitest";
import {
  isAllowedHost,
  hostToRole,
  extractClientIp,
  extractUserAgent,
  sanitizeTargetPath,
  protocolForHost,
  buildConsumeUrl,
} from "./crossDomain";

describe("isAllowedHost", () => {
  it("accepte les hosts prod", () => {
    expect(isAllowedHost("muscu-eps.fr")).toBe(true);
    expect(isAllowedHost("prof.muscu-eps.fr")).toBe(true);
    expect(isAllowedHost("admin.muscu-eps.fr")).toBe(true);
  });

  it("accepte les hosts preview", () => {
    expect(isAllowedHost("design.muscu-eps.fr")).toBe(true);
    expect(isAllowedHost("design-prof.muscu-eps.fr")).toBe(true);
    expect(isAllowedHost("design-admin.muscu-eps.fr")).toBe(true);
  });

  it("accepte les hosts dev local", () => {
    expect(isAllowedHost("localhost:3000")).toBe(true);
    expect(isAllowedHost("localhost")).toBe(true);
    expect(isAllowedHost("prof.localhost:3000")).toBe(true);
    expect(isAllowedHost("admin.localhost:3000")).toBe(true);
  });

  it("rejette les hosts inconnus / phishing", () => {
    expect(isAllowedHost("evil.com")).toBe(false);
    expect(isAllowedHost("muscu-eps.fr.evil.com")).toBe(false);
    expect(isAllowedHost("admin.muscu-eps.evil.com")).toBe(false);
    expect(isAllowedHost("")).toBe(false);
    expect(isAllowedHost("muscu-eps.com")).toBe(false);
  });
});

describe("hostToRole", () => {
  it("admin host → admin", () => {
    expect(hostToRole("admin.muscu-eps.fr")).toBe("admin");
    expect(hostToRole("design-admin.muscu-eps.fr")).toBe("admin");
    expect(hostToRole("admin.localhost:3000")).toBe("admin");
  });

  it("prof host → prof", () => {
    expect(hostToRole("prof.muscu-eps.fr")).toBe("prof");
    expect(hostToRole("design-prof.muscu-eps.fr")).toBe("prof");
    expect(hostToRole("prof.localhost:3000")).toBe("prof");
  });

  it("élève host → eleve", () => {
    expect(hostToRole("muscu-eps.fr")).toBe("eleve");
    expect(hostToRole("design.muscu-eps.fr")).toBe("eleve");
    expect(hostToRole("localhost:3000")).toBe("eleve");
  });

  it("host inconnu → eleve (par défaut conservateur)", () => {
    expect(hostToRole("unknown.example.com")).toBe("eleve");
  });
});

describe("extractClientIp", () => {
  it("retourne la première IP de X-Forwarded-For", () => {
    const headers = new Headers({
      "x-forwarded-for": "192.0.2.1, 10.0.0.1, 172.16.0.1",
    });
    expect(extractClientIp(headers)).toBe("192.0.2.1");
  });

  it("trim les espaces autour de l'IP", () => {
    const headers = new Headers({
      "x-forwarded-for": "  192.0.2.1  , 10.0.0.1",
    });
    expect(extractClientIp(headers)).toBe("192.0.2.1");
  });

  it("fallback sur x-real-ip si X-Forwarded-For absent", () => {
    const headers = new Headers({ "x-real-ip": "203.0.113.5" });
    expect(extractClientIp(headers)).toBe("203.0.113.5");
  });

  it("retourne 'unknown' si aucun header", () => {
    expect(extractClientIp(new Headers())).toBe("unknown");
  });
});

describe("extractUserAgent", () => {
  it("retourne le User-Agent complet", () => {
    const ua = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36";
    const headers = new Headers({ "user-agent": ua });
    expect(extractUserAgent(headers)).toBe(ua);
  });

  it("borne à 500 chars", () => {
    const longUa = "x".repeat(1000);
    const headers = new Headers({ "user-agent": longUa });
    expect(extractUserAgent(headers).length).toBe(500);
  });

  it("retourne 'unknown' si absent", () => {
    expect(extractUserAgent(new Headers())).toBe("unknown");
  });
});

describe("sanitizeTargetPath", () => {
  it("accepte un path absolu valide", () => {
    expect(sanitizeTargetPath("/exercices/s1-01")).toBe("/exercices/s1-01");
    expect(sanitizeTargetPath("/")).toBe("/");
  });

  it("rejette un path sans slash initial", () => {
    expect(sanitizeTargetPath("exercices")).toBe("/");
    expect(sanitizeTargetPath("https://evil.com/")).toBe("/");
  });

  it("rejette un path commençant par // (open-redirect)", () => {
    expect(sanitizeTargetPath("//evil.com/path")).toBe("/");
  });

  it("rejette un path trop long", () => {
    expect(sanitizeTargetPath("/" + "a".repeat(2000))).toBe("/");
  });

  it("rejette null / undefined / empty", () => {
    expect(sanitizeTargetPath(null)).toBe("/");
    expect(sanitizeTargetPath(undefined)).toBe("/");
    expect(sanitizeTargetPath("")).toBe("/");
  });
});

describe("protocolForHost", () => {
  it("localhost → http", () => {
    expect(protocolForHost("localhost:3000")).toBe("http");
    expect(protocolForHost("localhost")).toBe("http");
    expect(protocolForHost("prof.localhost:3000")).toBe("http");
    expect(protocolForHost("admin.localhost:3000")).toBe("http");
  });

  it("prod / preview → https", () => {
    expect(protocolForHost("muscu-eps.fr")).toBe("https");
    expect(protocolForHost("admin.muscu-eps.fr")).toBe("https");
    expect(protocolForHost("design.muscu-eps.fr")).toBe("https");
  });
});

describe("buildConsumeUrl", () => {
  it("construit l'URL de consume sur le sous-domaine cible", () => {
    const url = buildConsumeUrl(
      "prof.muscu-eps.fr",
      "abc123",
      "/exercices/s1-01",
    );
    expect(url).toBe(
      "https://prof.muscu-eps.fr/api/auth/cross-domain/consume?token=abc123&path=%2Fexercices%2Fs1-01",
    );
  });

  it("utilise http en dev local", () => {
    const url = buildConsumeUrl("admin.localhost:3000", "tok", "/");
    expect(url).toBe(
      "http://admin.localhost:3000/api/auth/cross-domain/consume?token=tok&path=%2F",
    );
  });
});
