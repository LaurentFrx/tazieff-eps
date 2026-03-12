import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/link");

import { Breadcrumbs } from "./Breadcrumbs";

describe("Breadcrumbs", () => {
  const items = [
    { label: "Accueil", href: "/" },
    { label: "Méthodes", href: "/methodes" },
    { label: "Drop Set" },
  ];

  it("renders all 3 segments", () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByText("Accueil")).toBeDefined();
    expect(screen.getByText("Méthodes")).toBeDefined();
    expect(screen.getByText("Drop Set")).toBeDefined();
  });

  it("renders first two segments as links with correct hrefs", () => {
    render(<Breadcrumbs items={items} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute("href")).toBe("/");
    expect(links[1].getAttribute("href")).toBe("/methodes");
  });

  it("renders the last segment as plain text, not a link", () => {
    render(<Breadcrumbs items={items} />);
    const links = screen.getAllByRole("link");
    const linkTexts = links.map((l) => l.textContent);
    expect(linkTexts).not.toContain("Drop Set");
    expect(screen.getByText("Drop Set")).toBeDefined();
  });

  it("renders separator between segments", () => {
    const { container } = render(<Breadcrumbs items={items} />);
    const separators = container.querySelectorAll("[aria-hidden='true']");
    expect(separators).toHaveLength(2);
    expect(separators[0].textContent).toBe("›");
  });

  it("has accessible nav landmark", () => {
    render(<Breadcrumbs items={items} />);
    const nav = screen.getByRole("navigation", { name: "breadcrumb" });
    expect(nav).toBeDefined();
  });
});
