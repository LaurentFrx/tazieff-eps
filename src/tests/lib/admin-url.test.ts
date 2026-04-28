// Sprint P0.7-decies — Tests de getAdminLoginUrl().
// Sprint A1 — getAdminLoginUrl délègue à resolveEnv() (source unique des
// hosts par environnement). Le SSR retombe désormais sur la détection
// VERCEL_ENV / NODE_ENV au lieu d'un hardcode prod.
//
// L'URL est calculée au runtime via window.location.host (côté client) ou
// via process.env (côté serveur). Tests : prod, preview design, dev local
// (port standard et port custom), SSR.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getAdminLoginUrl } from "@/lib/admin-url";

const originalLocation = globalThis.window?.location;
const originalNodeEnv = process.env.NODE_ENV;
const originalVercelEnv = process.env.VERCEL_ENV;

function mockHost(host: string | undefined) {
  if (host === undefined) {
    // Simulate SSR
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: undefined,
    });
    return;
  }
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      ...(globalThis.window ?? {}),
      location: { host } as Location,
    },
  });
}

function setServerEnv(vercelEnv: string | undefined) {
  if (vercelEnv === undefined) {
    delete process.env.VERCEL_ENV;
  } else {
    process.env.VERCEL_ENV = vercelEnv;
  }
}

beforeEach(() => {
  // Restore browser-like default before each test.
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { location: { host: "muscu-eps.fr" } },
  });
  setServerEnv(undefined);
});

afterEach(() => {
  if (originalLocation) {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { location: originalLocation },
    });
  }
  if (originalNodeEnv !== undefined) {
    (process.env as Record<string, string>).NODE_ENV = originalNodeEnv;
  }
  if (originalVercelEnv !== undefined) {
    process.env.VERCEL_ENV = originalVercelEnv;
  } else {
    delete process.env.VERCEL_ENV;
  }
});

describe("getAdminLoginUrl()", () => {
  it("prod muscu-eps.fr → https://admin.muscu-eps.fr/login", () => {
    mockHost("muscu-eps.fr");
    expect(getAdminLoginUrl()).toBe("https://admin.muscu-eps.fr/login");
  });

  it("preview design.muscu-eps.fr → https://design-admin.muscu-eps.fr/login", () => {
    mockHost("design.muscu-eps.fr");
    expect(getAdminLoginUrl()).toBe(
      "https://design-admin.muscu-eps.fr/login",
    );
  });

  it("dev local localhost:3000 → http://admin.localhost:3000/login", () => {
    mockHost("localhost:3000");
    expect(getAdminLoginUrl()).toBe("http://admin.localhost:3000/login");
  });

  it("dev local localhost:3001 (port custom) → http://admin.localhost:3001/login", () => {
    mockHost("localhost:3001");
    expect(getAdminLoginUrl()).toBe("http://admin.localhost:3001/login");
  });

  it("dev local 127.0.0.1:3000 → http://admin.localhost:3000/login", () => {
    mockHost("127.0.0.1:3000");
    expect(getAdminLoginUrl()).toBe("http://admin.localhost:3000/login");
  });

  it("SSR avec VERCEL_ENV=production → URL admin de prod", () => {
    mockHost(undefined);
    setServerEnv("production");
    expect(getAdminLoginUrl()).toBe("https://admin.muscu-eps.fr/login");
  });

  it("SSR avec VERCEL_ENV=preview → URL admin de preview", () => {
    mockHost(undefined);
    setServerEnv("preview");
    expect(getAdminLoginUrl()).toBe(
      "https://design-admin.muscu-eps.fr/login",
    );
  });

  it("host inconnu côté client → fallback prod (deny by default safe)", () => {
    mockHost("preview-pr-42.example.com");
    expect(getAdminLoginUrl()).toBe("https://admin.muscu-eps.fr/login");
  });
});

describe("settings.adminLink i18n keys (P0.7-decies)", () => {
  it("clé settings.adminLink définie en FR / EN / ES", async () => {
    const { messages } = await import("@/lib/i18n/messages");
    expect(messages.fr.settings.adminLink).toBe("Espace administrateur");
    expect(messages.en.settings.adminLink).toBe("Admin area");
    expect(messages.es.settings.adminLink).toBe("Espacio administrador");
  });
});
