// Sprint fix-pkce-prod (28 avril 2026) — Tests de la source unique
// `getSharedCookieOptions` qui aligne les options cookie entre browser.ts
// et server.ts.
//
// Bug constaté en prod après merge du 2026-04-28 : le code_verifier PKCE
// posé côté navigateur n'était pas retrouvé côté serveur lors du callback
// magic-link (erreur "PKCE code verifier not found in storage"). Cause :
// désalignement des options cookie entre browser et server (notamment
// absence de `secure: true` en HTTPS).
//
// Ces tests garantissent que :
//   1. `secure` est `true` sur HTTPS (prod, preview)
//   2. `secure` est `false` sur localhost (dev)
//   3. Pas de `domain` dans les options (préserve l'isolation E.2.3.8)
//   4. `sameSite: "lax"` (compatible avec navigation OAuth top-level)
//   5. `httpOnly: false` (le PKCE verifier doit être lisible côté JS)

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSharedCookieOptions, isSecureContext } from "@/lib/supabase/cookieOptions";

afterEach(() => {
  vi.unstubAllGlobals();
});

/* ── isSecureContext ─────────────────────────────────────────────────── */

describe("isSecureContext()", () => {
  it("client HTTPS → true", () => {
    vi.stubGlobal("window", { location: { protocol: "https:" } });
    expect(isSecureContext()).toBe(true);
  });

  it("client HTTP localhost → false", () => {
    vi.stubGlobal("window", { location: { protocol: "http:" } });
    expect(isSecureContext()).toBe(false);
  });

  it("serveur sans host → true par défaut (suppose prod/preview)", () => {
    vi.stubGlobal("window", undefined);
    expect(isSecureContext()).toBe(true);
  });

  it("serveur avec host=admin.muscu-eps.fr → true", () => {
    vi.stubGlobal("window", undefined);
    expect(isSecureContext("admin.muscu-eps.fr")).toBe(true);
  });

  it("serveur avec host=localhost:3000 → false", () => {
    vi.stubGlobal("window", undefined);
    expect(isSecureContext("localhost:3000")).toBe(false);
  });

  it("serveur avec host=admin.localhost:3000 → false (subdomain de localhost)", () => {
    vi.stubGlobal("window", undefined);
    expect(isSecureContext("admin.localhost:3000")).toBe(false);
  });

  it("serveur avec host=127.0.0.1:3000 → false", () => {
    vi.stubGlobal("window", undefined);
    expect(isSecureContext("127.0.0.1:3000")).toBe(false);
  });
});

/* ── getSharedCookieOptions — alignement browser ↔ server ─────────────── */

describe("getSharedCookieOptions() — flags critiques pour PKCE", () => {
  beforeEach(() => {
    vi.stubGlobal("window", undefined);
  });

  it("path est toujours '/' (cookies host-wide, pas restreints à un path)", () => {
    const opts = getSharedCookieOptions("admin.muscu-eps.fr");
    expect(opts.path).toBe("/");
  });

  it("sameSite est 'lax' (compatible OAuth top-level navigation)", () => {
    const opts = getSharedCookieOptions("admin.muscu-eps.fr");
    expect(opts.sameSite).toBe("lax");
  });

  it("httpOnly est false (PKCE verifier doit être lisible côté JS)", () => {
    const opts = getSharedCookieOptions("admin.muscu-eps.fr");
    expect(opts.httpOnly).toBe(false);
  });

  it("secure est true en prod HTTPS", () => {
    const opts = getSharedCookieOptions("admin.muscu-eps.fr");
    expect(opts.secure).toBe(true);
  });

  it("secure est true en preview HTTPS", () => {
    const opts = getSharedCookieOptions("design-admin.muscu-eps.fr");
    expect(opts.secure).toBe(true);
  });

  it("secure est false en dev HTTP localhost", () => {
    const opts = getSharedCookieOptions("admin.localhost:3000");
    expect(opts.secure).toBe(false);
  });
});

/* ── Garde isolation E.2.3.8 — pas de domain ──────────────────────────── */

describe("getSharedCookieOptions() — préservation de l'isolation cookies (E.2.3.8)", () => {
  it("ne contient PAS de propriété 'domain' (cookies host-only par défaut)", () => {
    vi.stubGlobal("window", undefined);
    const opts = getSharedCookieOptions("admin.muscu-eps.fr");
    expect(opts).not.toHaveProperty("domain");
  });

  it("alignement browser ↔ server : appel client (window=https) et serveur (host=https) retournent les MÊMES options critiques", () => {
    // Côté client HTTPS
    vi.stubGlobal("window", { location: { protocol: "https:" } });
    const clientOpts = getSharedCookieOptions();

    // Côté serveur sur le même host HTTPS
    vi.stubGlobal("window", undefined);
    const serverOpts = getSharedCookieOptions("admin.muscu-eps.fr");

    // Les flags critiques (secure, sameSite, path, httpOnly) DOIVENT être
    // identiques pour que le code_verifier posé côté client soit retrouvé
    // côté serveur. Sinon → erreur "PKCE code verifier not found in storage".
    expect(clientOpts.secure).toBe(serverOpts.secure);
    expect(clientOpts.sameSite).toBe(serverOpts.sameSite);
    expect(clientOpts.path).toBe(serverOpts.path);
    expect(clientOpts.httpOnly).toBe(serverOpts.httpOnly);
  });
});
