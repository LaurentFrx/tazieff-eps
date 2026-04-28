// Sprint P0.7-nonies — Tests de la page /[locale]/enseignant après bascule
// vers le message "espace déménagé". L'ancien outil localStorage de gestion
// de séances n'est plus monté.

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/fr/enseignant",
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: unknown; children?: React.ReactNode }) => {
    const resolvedHref =
      typeof href === "string"
        ? href
        : (href as { pathname?: string })?.pathname ?? "";
    return (
      <a href={resolvedHref} data-testid="locale-link" {...rest}>
        {children}
      </a>
    );
  },
}));

vi.mock("@/lib/i18n/I18nProvider", () => ({
  useI18n: () => ({
    lang: "fr",
    t: (key: string) => {
      const map: Record<string, string> = {
        "enseignant.title": "Mode enseignant",
        "enseignant.moved.body":
          "L'espace enseignant a déménagé. Accédez-y depuis un sous-domaine dédié, plus adapté à la tablette et au desktop.",
        "enseignant.moved.ctaPrimary": "Aller sur l'espace enseignant",
        "enseignant.moved.ctaSecondary": "Retour à l'accueil",
      };
      return map[key] ?? key;
    },
  }),
}));

import { EnseignantMovedClient } from "@/app/[locale]/enseignant/EnseignantMovedClient";

describe("EnseignantMovedClient (P0.7-nonies)", () => {
  it("rend le titre 'Mode enseignant'", () => {
    render(<EnseignantMovedClient />);
    expect(
      screen.getByRole("heading", { name: "Mode enseignant" }),
    ).toBeDefined();
  });

  it("rend le message 'L'espace enseignant a déménagé'", () => {
    render(<EnseignantMovedClient />);
    expect(
      screen.getByText(/L'espace enseignant a déménagé/),
    ).toBeDefined();
  });

  it("expose un lien externe vers l'espace enseignant (host suit l'environnement)", () => {
    // Sprint A1 — Le href est désormais dérivé de resolveEnv() (sources
    // unique). En prod : prof.muscu-eps.fr/connexion. En preview :
    // design-prof.muscu-eps.fr/connexion. En dev (cas des tests Vitest) :
    // prof.localhost:<port>/connexion. Le test n'asserte plus le host
    // exact mais la structure : ".../connexion" vers le sous-domaine prof.
    render(<EnseignantMovedClient />);
    const cta = screen.getByTestId("enseignant-moved-cta");
    const href = cta.getAttribute("href") ?? "";
    expect(href).toMatch(/\/\/prof[.-]/); // prof.muscu, prof.localhost, design-prof.muscu
    expect(href).toContain("/connexion");
    expect(cta.getAttribute("rel")).toContain("noopener");
  });

  it("CTA secondaire 'Retour à l'accueil' est un LocaleLink vers /fr", () => {
    render(<EnseignantMovedClient />);
    const back = screen.getByTestId("enseignant-moved-back");
    // Sur pathname /fr/enseignant, LocaleLink préfixe href '/' en '/fr/'
    // (Next.js normalise les trailing slash au runtime).
    expect(back.getAttribute("href")).toMatch(/^\/fr\/?$/);
  });

  it("ne rend PAS l'ancien dashboard (pas de bouton 'Nouvelle séance')", () => {
    render(<EnseignantMovedClient />);
    expect(screen.queryByText(/Nouvelle séance/i)).toBeNull();
  });
});
