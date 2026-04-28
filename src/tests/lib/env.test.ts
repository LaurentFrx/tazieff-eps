// Sprint A1 — Tests de resolveEnv() (matrice complète prod/preview/dev × hosts).
//
// Couvre :
//   - Détection serveur via VERCEL_ENV / NODE_ENV
//   - Détection client via window.location.host (élève / prof / admin /
//     design / design-prof / design-admin / localhost / *.localhost)
//   - Préservation du port en dev local
//   - Helpers existants migrés (getAdminLoginUrl) qui dépendent de resolveEnv

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveEnv } from "@/lib/env";
import { getAdminLoginUrl } from "@/lib/admin-url";

/* ── Helpers test ────────────────────────────────────────────────────── */

const originalEnv = { ...process.env };

function setServerEnv(vercelEnv: string | undefined, nodeEnv: string) {
  if (vercelEnv === undefined) {
    delete process.env.VERCEL_ENV;
  } else {
    process.env.VERCEL_ENV = vercelEnv;
  }
  // NODE_ENV est en lecture seule sur certains TS configs ; on bypass via cast.
  (process.env as Record<string, string>).NODE_ENV = nodeEnv;
}

function setClientHost(host: string | null) {
  if (host === null) {
    // Simule un contexte serveur (pas de window).
    vi.stubGlobal("window", undefined);
    return;
  }
  vi.stubGlobal("window", {
    location: { host, origin: `https://${host}` },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  process.env = { ...originalEnv };
});

/* ── Détection serveur (window === undefined) ────────────────────────── */

describe("resolveEnv() — server-side detection", () => {
  beforeEach(() => {
    setClientHost(null);
  });

  it("VERCEL_ENV=production → env: production, hosts élève prod", () => {
    setServerEnv("production", "production");
    const env = resolveEnv();
    expect(env.env).toBe("production");
    expect(env.hosts.eleve).toBe("muscu-eps.fr");
    expect(env.hosts.prof).toBe("prof.muscu-eps.fr");
    expect(env.hosts.admin).toBe("admin.muscu-eps.fr");
    expect(env.baseUrl.eleve).toBe("https://muscu-eps.fr");
    expect(env.baseUrl.prof).toBe("https://prof.muscu-eps.fr");
    expect(env.baseUrl.admin).toBe("https://admin.muscu-eps.fr");
  });

  it("VERCEL_ENV=preview → env: preview, hosts design.*", () => {
    setServerEnv("preview", "production");
    const env = resolveEnv();
    expect(env.env).toBe("preview");
    expect(env.hosts.eleve).toBe("design.muscu-eps.fr");
    expect(env.hosts.prof).toBe("design-prof.muscu-eps.fr");
    expect(env.hosts.admin).toBe("design-admin.muscu-eps.fr");
    expect(env.baseUrl.eleve).toBe("https://design.muscu-eps.fr");
    expect(env.baseUrl.prof).toBe("https://design-prof.muscu-eps.fr");
    expect(env.baseUrl.admin).toBe("https://design-admin.muscu-eps.fr");
  });

  it("VERCEL_ENV indéfini, NODE_ENV=development → env: development", () => {
    setServerEnv(undefined, "development");
    const env = resolveEnv();
    expect(env.env).toBe("development");
    expect(env.hosts.eleve).toBe("localhost:3000");
    expect(env.hosts.prof).toBe("prof.localhost:3000");
    expect(env.hosts.admin).toBe("admin.localhost:3000");
    expect(env.baseUrl.eleve).toBe("http://localhost:3000");
    expect(env.baseUrl.prof).toBe("http://prof.localhost:3000");
    expect(env.baseUrl.admin).toBe("http://admin.localhost:3000");
  });
});

/* ── Détection client (window.location.host) ─────────────────────────── */

describe("resolveEnv() — client-side detection", () => {
  it("host=muscu-eps.fr → env: production", () => {
    setClientHost("muscu-eps.fr");
    const env = resolveEnv();
    expect(env.env).toBe("production");
    expect(env.baseUrl.eleve).toBe("https://muscu-eps.fr");
  });

  it("host=prof.muscu-eps.fr → env: production (depuis le sous-domaine prof)", () => {
    setClientHost("prof.muscu-eps.fr");
    const env = resolveEnv();
    expect(env.env).toBe("production");
    expect(env.baseUrl.prof).toBe("https://prof.muscu-eps.fr");
  });

  it("host=admin.muscu-eps.fr → env: production (depuis le sous-domaine admin)", () => {
    setClientHost("admin.muscu-eps.fr");
    const env = resolveEnv();
    expect(env.env).toBe("production");
    expect(env.baseUrl.admin).toBe("https://admin.muscu-eps.fr");
  });

  it("host=design.muscu-eps.fr → env: preview", () => {
    setClientHost("design.muscu-eps.fr");
    const env = resolveEnv();
    expect(env.env).toBe("preview");
    expect(env.baseUrl.eleve).toBe("https://design.muscu-eps.fr");
    expect(env.baseUrl.prof).toBe("https://design-prof.muscu-eps.fr");
  });

  it("host=design-prof.muscu-eps.fr → env: preview", () => {
    setClientHost("design-prof.muscu-eps.fr");
    const env = resolveEnv();
    expect(env.env).toBe("preview");
    expect(env.baseUrl.admin).toBe("https://design-admin.muscu-eps.fr");
  });

  it("host=design-admin.muscu-eps.fr → env: preview", () => {
    setClientHost("design-admin.muscu-eps.fr");
    const env = resolveEnv();
    expect(env.env).toBe("preview");
    expect(env.baseUrl.eleve).toBe("https://design.muscu-eps.fr");
  });

  it("host=localhost:3000 → env: development, port 3000", () => {
    setClientHost("localhost:3000");
    const env = resolveEnv();
    expect(env.env).toBe("development");
    expect(env.hosts.eleve).toBe("localhost:3000");
    expect(env.baseUrl.eleve).toBe("http://localhost:3000");
  });

  it("host=localhost:4000 → env: development, port 4000 propagé aux sous-domaines", () => {
    setClientHost("localhost:4000");
    const env = resolveEnv();
    expect(env.env).toBe("development");
    expect(env.hosts.eleve).toBe("localhost:4000");
    expect(env.hosts.prof).toBe("prof.localhost:4000");
    expect(env.hosts.admin).toBe("admin.localhost:4000");
  });

  it("host=admin.localhost:3000 → env: development depuis dev local admin", () => {
    setClientHost("admin.localhost:3000");
    const env = resolveEnv();
    expect(env.env).toBe("development");
    expect(env.baseUrl.admin).toBe("http://admin.localhost:3000");
  });

  it("host=prof.localhost:3001 → env: development, port 3001 propagé", () => {
    setClientHost("prof.localhost:3001");
    const env = resolveEnv();
    expect(env.env).toBe("development");
    expect(env.hosts.eleve).toBe("localhost:3001");
    expect(env.hosts.prof).toBe("prof.localhost:3001");
  });

  it("host=127.0.0.1:3000 → env: development", () => {
    setClientHost("127.0.0.1:3000");
    const env = resolveEnv();
    expect(env.env).toBe("development");
  });
});

/* ── getAdminLoginUrl() utilise bien resolveEnv() ────────────────────── */

describe("getAdminLoginUrl() (migration A.2)", () => {
  it("retourne l'URL admin de prod en prod", () => {
    setClientHost("muscu-eps.fr");
    expect(getAdminLoginUrl()).toBe("https://admin.muscu-eps.fr/login");
  });

  it("retourne l'URL admin de preview en preview", () => {
    setClientHost("design.muscu-eps.fr");
    expect(getAdminLoginUrl()).toBe("https://design-admin.muscu-eps.fr/login");
  });

  it("retourne l'URL admin de dev en local (port 3000)", () => {
    setClientHost("localhost:3000");
    expect(getAdminLoginUrl()).toBe("http://admin.localhost:3000/login");
  });

  it("retourne l'URL admin de dev en local (port custom)", () => {
    setClientHost("localhost:4000");
    expect(getAdminLoginUrl()).toBe("http://admin.localhost:4000/login");
  });

  it("retourne l'URL admin de prod en SSR (window undefined, VERCEL_ENV=production)", () => {
    setClientHost(null);
    setServerEnv("production", "production");
    expect(getAdminLoginUrl()).toBe("https://admin.muscu-eps.fr/login");
  });

  it("retourne l'URL admin de preview en SSR (window undefined, VERCEL_ENV=preview)", () => {
    setClientHost(null);
    setServerEnv("preview", "production");
    expect(getAdminLoginUrl()).toBe("https://design-admin.muscu-eps.fr/login");
  });
});
