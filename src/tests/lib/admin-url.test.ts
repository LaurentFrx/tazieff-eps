// Sprint P0.7-decies — Tests de getAdminLoginUrl().
//
// L'URL est calculée au runtime via window.location.host. Tests :
// prod, preview design, dev local (port standard et port custom),
// SSR fallback.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAdminLoginUrl } from "@/lib/admin-url";

const originalLocation = globalThis.window?.location;

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

beforeEach(() => {
  // Restore browser-like default before each test.
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { location: { host: "muscu-eps.fr" } },
  });
});

afterEach(() => {
  if (originalLocation) {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { location: originalLocation },
    });
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

  it("SSR (window undefined) → fallback prod", () => {
    mockHost(undefined);
    expect(getAdminLoginUrl()).toBe("https://admin.muscu-eps.fr/login");
  });

  it("host inconnu → fallback prod (deny by default safe)", () => {
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
