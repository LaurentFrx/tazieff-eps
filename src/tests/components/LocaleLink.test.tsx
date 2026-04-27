// Sprint P0.7-quater — Tests du wrapper LocaleLink.
//
// La logique critique :
//   - lang === "fr" + pathname SANS prefix locale (host élève)
//       → href retourné tel quel (le middleware réécrit en interne)
//   - lang === "fr" + pathname AVEC prefix locale (miroir admin)
//       → href préfixé avec /fr/ (sinon /exercices/s1-01 → 404)
//   - lang === "en" / "es" : préfixe systématique (legacy)
//   - href déjà préfixé : pas de double-prefix
//   - URL externes / anchors : intacts

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: unknown; children?: React.ReactNode }) => {
    const resolvedHref =
      typeof href === "string"
        ? href
        : (href as { pathname?: string })?.pathname ?? "";
    return (
      <a href={resolvedHref} data-testid="link" {...rest}>
        {children}
      </a>
    );
  },
}));

const mockUseI18n = vi.fn();

vi.mock("@/lib/i18n/I18nProvider", () => ({
  useI18n: () => mockUseI18n(),
}));

import { LocaleLink } from "@/components/LocaleLink";

function setup({
  lang,
  pathname,
}: {
  lang: "fr" | "en" | "es";
  pathname: string | null;
}) {
  mockUseI18n.mockReturnValue({ lang });
  mockUsePathname.mockReturnValue(pathname);
}

describe("LocaleLink — lang fr + pathname élève (sans prefix)", () => {
  it("href /exercices/s1-01 reste /exercices/s1-01 sur /exercices", () => {
    setup({ lang: "fr", pathname: "/exercices" });
    const { getByTestId } = render(
      <LocaleLink href="/exercices/s1-01">x</LocaleLink>,
    );
    expect(getByTestId("link").getAttribute("href")).toBe("/exercices/s1-01");
  });

  it("href / reste / sur /", () => {
    setup({ lang: "fr", pathname: "/" });
    const { getByTestId } = render(<LocaleLink href="/">x</LocaleLink>);
    expect(getByTestId("link").getAttribute("href")).toBe("/");
  });

  it("href /methodes/circuit reste /methodes/circuit sur /methodes", () => {
    setup({ lang: "fr", pathname: "/methodes" });
    const { getByTestId } = render(
      <LocaleLink href="/methodes/circuit">x</LocaleLink>,
    );
    expect(getByTestId("link").getAttribute("href")).toBe("/methodes/circuit");
  });
});

describe("LocaleLink — lang fr + pathname miroir admin (/fr/...)", () => {
  it("href /exercices/s1-01 devient /fr/exercices/s1-01 sur /fr/exercices", () => {
    setup({ lang: "fr", pathname: "/fr/exercices" });
    const { getByTestId } = render(
      <LocaleLink href="/exercices/s1-01">x</LocaleLink>,
    );
    expect(getByTestId("link").getAttribute("href")).toBe(
      "/fr/exercices/s1-01",
    );
  });

  it("href /methodes/circuit devient /fr/methodes/circuit sur /fr/methodes", () => {
    setup({ lang: "fr", pathname: "/fr/methodes" });
    const { getByTestId } = render(
      <LocaleLink href="/methodes/circuit">x</LocaleLink>,
    );
    expect(getByTestId("link").getAttribute("href")).toBe(
      "/fr/methodes/circuit",
    );
  });

  it("href déjà préfixé /fr/exercices/s1-01 ne double pas le prefix", () => {
    setup({ lang: "fr", pathname: "/fr/exercices" });
    const { getByTestId } = render(
      <LocaleLink href="/fr/exercices/s1-01">x</LocaleLink>,
    );
    expect(getByTestId("link").getAttribute("href")).toBe(
      "/fr/exercices/s1-01",
    );
  });

  it("pathname /fr seul (locale racine) déclenche aussi le préfixe", () => {
    setup({ lang: "fr", pathname: "/fr" });
    const { getByTestId } = render(
      <LocaleLink href="/exercices">x</LocaleLink>,
    );
    expect(getByTestId("link").getAttribute("href")).toBe("/fr/exercices");
  });
});

describe("LocaleLink — lang en/es (legacy : prefix toujours)", () => {
  it("lang en + href /exercices/s1-01 → /en/exercices/s1-01", () => {
    setup({ lang: "en", pathname: "/en/exercices" });
    const { getByTestId } = render(
      <LocaleLink href="/exercices/s1-01">x</LocaleLink>,
    );
    expect(getByTestId("link").getAttribute("href")).toBe(
      "/en/exercices/s1-01",
    );
  });

  it("lang es + href /methodes/circuit → /es/methodes/circuit", () => {
    setup({ lang: "es", pathname: "/es/methodes" });
    const { getByTestId } = render(
      <LocaleLink href="/methodes/circuit">x</LocaleLink>,
    );
    expect(getByTestId("link").getAttribute("href")).toBe(
      "/es/methodes/circuit",
    );
  });

  it("lang en + href déjà /en/x ne double pas", () => {
    setup({ lang: "en", pathname: "/en/exercices" });
    const { getByTestId } = render(
      <LocaleLink href="/en/exercices/s1-01">x</LocaleLink>,
    );
    expect(getByTestId("link").getAttribute("href")).toBe(
      "/en/exercices/s1-01",
    );
  });
});

describe("LocaleLink — cas spéciaux", () => {
  it("URL externe http(s):// non préfixée même en miroir admin", () => {
    setup({ lang: "fr", pathname: "/fr/exercices" });
    const { getByTestId } = render(
      <LocaleLink href="https://example.com/page">x</LocaleLink>,
    );
    expect(getByTestId("link").getAttribute("href")).toBe(
      "https://example.com/page",
    );
  });

  it("Anchor # non préfixé", () => {
    setup({ lang: "fr", pathname: "/fr/exercices" });
    const { getByTestId } = render(
      <LocaleLink href="#section">x</LocaleLink>,
    );
    expect(getByTestId("link").getAttribute("href")).toBe("#section");
  });
});
