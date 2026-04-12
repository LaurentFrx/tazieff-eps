import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

let mockPathname = "/";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => mockPathname,
}));

vi.mock("@/lib/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (key: string) => key, lang: "fr", setLang: () => {} }),
}));

import { BottomTabBar } from "./BottomTabBar";

describe("BottomTabBar", () => {
  beforeEach(() => { mockPathname = "/"; });

  it("renders 3 tab links", () => {
    render(<BottomTabBar />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
  });

  it("renders all 3 tab labels", () => {
    render(<BottomTabBar />);
    expect(screen.getByText("nav.maSeance.label")).toBeDefined();
    expect(screen.getByText("nav.explorer.label")).toBeDefined();
    expect(screen.getByText("nav.monParcours.label")).toBeDefined();
  });

  it("has accessible nav landmark", () => {
    render(<BottomTabBar />);
    expect(screen.getByRole("navigation", { name: "nav.mainNavigation" })).toBeDefined();
  });

  it("marks ma-seance tab as active on /", () => {
    mockPathname = "/";
    render(<BottomTabBar />);
    const homeLink = screen.getByText("nav.maSeance.label").closest("a")!;
    expect(homeLink.getAttribute("aria-current")).toBe("page");
  });

  it("marks explorer tab as active on /exercices", () => {
    mockPathname = "/exercices";
    render(<BottomTabBar />);
    const explorerLink = screen.getByText("nav.explorer.label").closest("a")!;
    expect(explorerLink.getAttribute("aria-current")).toBe("page");
  });

  it("marks explorer tab as active on sub-route /exercices/s1-01", () => {
    mockPathname = "/exercices/s1-01";
    render(<BottomTabBar />);
    const explorerLink = screen.getByText("nav.explorer.label").closest("a")!;
    expect(explorerLink.getAttribute("aria-current")).toBe("page");
  });

  it("links point to correct hrefs", () => {
    render(<BottomTabBar />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/explorer");
    expect(hrefs).toContain("/mon-parcours");
  });
});
