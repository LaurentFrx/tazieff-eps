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
