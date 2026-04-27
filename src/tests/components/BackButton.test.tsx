// Sprint P0.7-octies — Tests de BackButton et DetailHeader.
//
// Garantit que ces deux composants Header utilisent LocaleLink pour
// préfixer le href avec la locale courante quand le pathname le requiert
// (cas miroir admin /fr/methodes/aps → backHref /methodes doit produire
// /fr/methodes, pas /methodes qui serait 404 sur ce host).

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

import { BackButton } from "@/components/BackButton";
import { DetailHeader } from "@/components/DetailHeader";

function setup({ lang, pathname }: { lang: "fr" | "en" | "es"; pathname: string | null }) {
  mockUseI18n.mockReturnValue({ lang });
  mockUsePathname.mockReturnValue(pathname);
}

describe("BackButton (P0.7-octies)", () => {
  it("href '/methodes' sur /fr/methodes/aps → /fr/methodes (miroir admin)", () => {
    setup({ lang: "fr", pathname: "/fr/methodes/aps" });
    const { getByTestId } = render(
      <BackButton href="/methodes" label="Retour" />,
    );
    expect(getByTestId("link").getAttribute("href")).toBe("/fr/methodes");
  });

  it("href '/parcours-bac' sur /fr/parcours-bac/seconde → /fr/parcours-bac", () => {
    setup({ lang: "fr", pathname: "/fr/parcours-bac/seconde" });
    const { getByTestId } = render(
      <BackButton href="/parcours-bac" label="Retour" />,
    );
    expect(getByTestId("link").getAttribute("href")).toBe("/fr/parcours-bac");
  });

  it("href '/methodes' sur /methodes/aps (élève sans préfixe) → /methodes", () => {
    setup({ lang: "fr", pathname: "/methodes/aps" });
    const { getByTestId } = render(
      <BackButton href="/methodes" label="Retour" />,
    );
    // Pas de préfixe locale dans le pathname → comportement legacy préservé
    expect(getByTestId("link").getAttribute("href")).toBe("/methodes");
  });
});

describe("DetailHeader (P0.7-octies)", () => {
  it("backHref '/methodes' sur /fr/methodes/aps → /fr/methodes", () => {
    setup({ lang: "fr", pathname: "/fr/methodes/aps" });
    const { getByTestId } = render(
      <DetailHeader
        title="Drop set"
        gradient="from-orange-500 to-rose-500"
        backHref="/methodes"
        backLabel="Retour"
      />,
    );
    expect(getByTestId("link").getAttribute("href")).toBe("/fr/methodes");
  });

  it("backHref '/apprendre' sur /fr/apprendre/muscles → /fr/apprendre", () => {
    setup({ lang: "fr", pathname: "/fr/apprendre/muscles" });
    const { getByTestId } = render(
      <DetailHeader
        title="Muscles"
        gradient="from-emerald-500 to-teal-500"
        backHref="/apprendre"
        backLabel="Retour"
      />,
    );
    expect(getByTestId("link").getAttribute("href")).toBe("/fr/apprendre");
  });

  it("lang en + pathname /en/methodes/circuit → /en/methodes", () => {
    setup({ lang: "en", pathname: "/en/methodes/circuit" });
    const { getByTestId } = render(
      <DetailHeader
        title="Circuit"
        gradient="from-orange-500 to-rose-500"
        backHref="/methodes"
        backLabel="Back"
      />,
    );
    expect(getByTestId("link").getAttribute("href")).toBe("/en/methodes");
  });
});
