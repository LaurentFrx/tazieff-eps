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

  it("renders 5 tab links", () => {
    render(<BottomTabBar />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(5);
  });

  it("renders all 5 tab labels", () => {
    render(<BottomTabBar />);
    expect(screen.getByText("nav.home.label")).toBeDefined();
    expect(screen.getByText("nav.exos.label")).toBeDefined();
    expect(screen.getByText("nav.methodes.label")).toBeDefined();
    expect(screen.getByText("nav.apprendre.label")).toBeDefined();
    expect(screen.getByText("nav.bac.label")).toBeDefined();
  });

  it("has accessible nav landmark", () => {
    render(<BottomTabBar />);
    expect(screen.getByRole("navigation", { name: "nav.mainNavigation" })).toBeDefined();
  });

  it("marks home tab as active on /", () => {
    mockPathname = "/";
    render(<BottomTabBar />);
    const homeLink = screen.getByText("nav.home.label").closest("a")!;
    expect(homeLink.getAttribute("aria-current")).toBe("page");
  });

  it("marks exercices tab as active on /exercices", () => {
    mockPathname = "/exercices";
    render(<BottomTabBar />);
    const exoLink = screen.getByText("nav.exos.label").closest("a")!;
    expect(exoLink.getAttribute("aria-current")).toBe("page");
    // Home should NOT be active
    const homeLink = screen.getByText("nav.home.label").closest("a")!;
    expect(homeLink.getAttribute("aria-current")).toBeNull();
  });

  it("marks exercices tab as active on sub-route /exercices/s1-01", () => {
    mockPathname = "/exercices/s1-01";
    render(<BottomTabBar />);
    const exoLink = screen.getByText("nav.exos.label").closest("a")!;
    expect(exoLink.getAttribute("aria-current")).toBe("page");
  });

  it("links point to correct hrefs", () => {
    render(<BottomTabBar />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/exercices");
    expect(hrefs).toContain("/methodes");
    expect(hrefs).toContain("/apprendre");
    expect(hrefs).toContain("/parcours-bac");
  });
});
