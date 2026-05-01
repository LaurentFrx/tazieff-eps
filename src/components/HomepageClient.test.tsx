import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";

beforeAll(() => {
  // jsdom doesn't provide IntersectionObserver — trigger callback immediately
  globalThis.IntersectionObserver = class {
    cb: IntersectionObserverCallback;
    constructor(cb: IntersectionObserverCallback) { this.cb = cb; }
    observe() { this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
}));

vi.mock("next/image", () => ({
  default: ({ fill, priority, placeholder, blurDataURL, loader, quality, unoptimized, ...props }: Record<string, unknown>) => <img {...props} />,
}));

vi.mock("@/lib/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (key: string) => key, lang: "fr", setLang: () => {} }),
}));

vi.mock("@/hooks/useFavorites", () => ({
  useFavorites: () => ({ favorites: [], isFavorite: () => false, toggle: () => {}, set: () => {} }),
}));

vi.mock("@/hooks/useCountUp", () => ({
  useCountUp: (target: number) => target,
}));

vi.mock("@/lib/search/search-index", () => ({
  SEARCH_INDEX: [
    { slug: "s1-01", title: "Planche", type: "exercice", href: "/exercices/s1-01", searchText: "planche" },
  ],
}));

vi.mock("@/components/OnboardingBanner", () => ({
  OnboardingBanner: () => null,
}));

vi.mock("@/components/HomeFlyer", () => ({
  HomeFlyer: () => <div data-testid="home-flyer">Flyer</div>,
}));

vi.mock("@/components/HomeSearchBar", () => ({
  HomeSearchBar: () => <div data-testid="home-search">Search</div>,
}));

// Sprint fix-footer-legal-urls (1 mai 2026) — Mock resolveEnv pour des URLs
// prévisibles dans les tests des liens légaux (cf. describe "footer légal").
vi.mock("@/lib/env", () => ({
  resolveEnv: () => ({
    env: "production",
    hosts: {
      eleve: "muscu-eps.fr",
      prof: "prof.muscu-eps.fr",
      admin: "admin.muscu-eps.fr",
    },
    baseUrl: {
      eleve: "https://muscu-eps.fr",
      prof: "https://prof.muscu-eps.fr",
      admin: "https://admin.muscu-eps.fr",
    },
  }),
}));

import { HomepageClient } from "./HomepageClient";

describe("HomepageClient — hub d'actions", () => {
  const props = { exerciseCount: 80, methodeCount: 19, learnCount: 10 };

  it("renders the HomeFlyer", () => {
    render(<HomepageClient {...props} />);
    expect(screen.getByTestId("home-flyer")).toBeDefined();
  });

  it("renders the search bar", () => {
    render(<HomepageClient {...props} />);
    expect(screen.getByTestId("home-search")).toBeDefined();
  });

  it("renders 4 quick-access cards with correct counts", () => {
    render(<HomepageClient {...props} />);
    expect(screen.getByText("80")).toBeDefined();
    expect(screen.getByText("19")).toBeDefined();
    expect(screen.getByText("10")).toBeDefined();
  });

  it("renders exercices link to /exercices", () => {
    render(<HomepageClient {...props} />);
    const exoLink = screen.getByText("pages.home.exercicesLabel").closest("a")!;
    expect(exoLink.getAttribute("href")).toBe("/exercices");
  });

  it("renders methodes link to /methodes", () => {
    render(<HomepageClient {...props} />);
    const link = screen.getByText("pages.home.methodesLabel").closest("a")!;
    expect(link.getAttribute("href")).toBe("/methodes");
  });

  it("renders apprendre link to /apprendre", () => {
    render(<HomepageClient {...props} />);
    const link = screen.getByText("pages.home.apprendreLabel").closest("a")!;
    expect(link.getAttribute("href")).toBe("/apprendre");
  });

  it("renders BAC link to /parcours-bac", () => {
    render(<HomepageClient {...props} />);
    const link = screen.getByText("pages.home.bacLabel").closest("a")!;
    expect(link.getAttribute("href")).toBe("/parcours-bac");
  });

  it("renders themes section with 3 objectives", () => {
    render(<HomepageClient {...props} />);
    expect(screen.getByText("pages.home.themeEndurance")).toBeDefined();
    expect(screen.getByText("pages.home.themeVolume")).toBeDefined();
    expect(screen.getByText("pages.home.themePuissance")).toBeDefined();
  });

  it("renders tools section with 3 tools", () => {
    render(<HomepageClient {...props} />);
    expect(screen.getByText("pages.home.outilCalculateur")).toBeDefined();
    expect(screen.getByText("pages.home.outilTimer")).toBeDefined();
    expect(screen.getByText("pages.home.outilCarnet")).toBeDefined();
  });

  it("shows 'Pour bien commencer' when no favorites", () => {
    render(<HomepageClient {...props} />);
    expect(screen.getByText("pages.home.startTitle")).toBeDefined();
  });
});

// Sprint fix-footer-legal-urls (1 mai 2026) — Tests cross-domain.
//
// Le footer légal de la home est rendu sur muscu-eps.fr/ ET sur le miroir
// admin.muscu-eps.fr/ (pass-through P0.7-bis du proxy). Sur le miroir,
// les paths /legal/* ne sont PAS dans ADMIN_MIRROR_PREFIXES → un Link
// relatif retourne 404. Solution : URL absolue vers le baseUrl élève.
describe("HomepageClient — footer légal cross-domain", () => {
  const props = { exerciseCount: 80, methodeCount: 19, learnCount: 10 };

  it("le lien Mentions légales pointe en absolu vers muscu-eps.fr/legal/mentions-legales", () => {
    render(<HomepageClient {...props} />);
    const link = screen.getByTestId("footer-legal-mentions");
    expect(link.getAttribute("href")).toBe(
      "https://muscu-eps.fr/legal/mentions-legales",
    );
  });

  it("le lien Confidentialité pointe en absolu vers muscu-eps.fr/legal/confidentialite", () => {
    render(<HomepageClient {...props} />);
    const link = screen.getByTestId("footer-legal-confidentialite");
    expect(link.getAttribute("href")).toBe(
      "https://muscu-eps.fr/legal/confidentialite",
    );
  });

  it("le lien CGU pointe en absolu vers muscu-eps.fr/legal/cgu", () => {
    render(<HomepageClient {...props} />);
    const link = screen.getByTestId("footer-legal-cgu");
    expect(link.getAttribute("href")).toBe(
      "https://muscu-eps.fr/legal/cgu",
    );
  });
});
