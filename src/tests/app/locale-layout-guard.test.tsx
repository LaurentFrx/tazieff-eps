// Sprint A5.1 — Tests du guard locale invalide dans [locale]/layout.tsx.
//
// Bug constaté par audit visuel A5 : /auth et /callback (post suppression
// A5 des routes OAuth GitHub legacy) répondaient HTTP 200 avec une app élève
// dégradée. Cause : params.locale = "auth" était fallback-é silencieusement
// vers "fr" au lieu de retourner 404.
//
// Fix : notFound() si params.locale ∉ SUPPORTED_LOCALES.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

// vi.hoisted permet d'exposer notFoundMock au top-level pour le mock
// (sinon le hoisting de vi.mock provoque ReferenceError sur la const).
const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    // notFound() throw une erreur spéciale NEXT_NOT_FOUND. On simule
    // par un throw classique avec marker pour assertion.
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("next/headers", () => ({
  headers: () =>
    Promise.resolve({
      get: () => "muscu-eps.fr",
    }),
}));

// Mock des composants enfants pour ne pas charger toute l'app.
vi.mock("@/components/providers/AppProviders", () => ({
  AppProviders: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-providers">{children}</div>
  ),
}));
vi.mock("@/components/BottomTabBar", () => ({ BottomTabBar: () => null }));
vi.mock("@/components/TopBar", () => ({ TopBar: () => null }));
vi.mock("@/components/InstallPwaBanner", () => ({
  InstallPwaBanner: () => null,
}));
vi.mock("@/components/OnlineStatus", () => ({ OnlineStatus: () => null }));
vi.mock("@/components/ScrollToTop", () => ({ ScrollToTop: () => null }));
vi.mock("@/components/PageTransition", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

import LocaleLayout from "@/app/[locale]/layout";

beforeEach(() => {
  notFoundMock.mockClear();
});

async function renderLayout(locale: string) {
  // Le layout est async (utilise await params + await headers).
  const element = await LocaleLayout({
    children: <span data-testid="child">child</span>,
    params: Promise.resolve({ locale }),
  });
  return render(element as React.ReactElement);
}

describe("LocaleLayout — guard locale valide", () => {
  it("locale='fr' → rendu normal, pas de notFound", async () => {
    const { getByTestId } = await renderLayout("fr");
    expect(notFoundMock).not.toHaveBeenCalled();
    expect(getByTestId("app-providers")).toBeDefined();
    expect(getByTestId("child").textContent).toBe("child");
  });

  it("locale='en' → rendu normal, pas de notFound", async () => {
    const { getByTestId } = await renderLayout("en");
    expect(notFoundMock).not.toHaveBeenCalled();
    expect(getByTestId("app-providers")).toBeDefined();
  });

  it("locale='es' → rendu normal, pas de notFound", async () => {
    const { getByTestId } = await renderLayout("es");
    expect(notFoundMock).not.toHaveBeenCalled();
    expect(getByTestId("app-providers")).toBeDefined();
  });
});

describe("LocaleLayout — guard locale invalide (bug A5-1)", () => {
  it("locale='auth' (post-suppression OAuth) → notFound()", async () => {
    await expect(renderLayout("auth")).rejects.toThrow(/NEXT_NOT_FOUND/);
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("locale='callback' (post-suppression OAuth) → notFound()", async () => {
    await expect(renderLayout("callback")).rejects.toThrow(/NEXT_NOT_FOUND/);
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("locale='lol' (random faux locale) → notFound()", async () => {
    await expect(renderLayout("lol")).rejects.toThrow(/NEXT_NOT_FOUND/);
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("locale='test' → notFound()", async () => {
    await expect(renderLayout("test")).rejects.toThrow(/NEXT_NOT_FOUND/);
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("locale chaîne vide → notFound()", async () => {
    await expect(renderLayout("")).rejects.toThrow(/NEXT_NOT_FOUND/);
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
