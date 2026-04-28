// Sprint P0.7-nonies — Tests de SearchModal après bascule <button> → <LocaleLink>.
// Vérifie que les résultats sont rendus comme des liens (a href) et non plus
// comme des boutons : Ctrl+clic, partage du lien, et a11y (lien != bouton).

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/fr/exercices",
}));

vi.mock("next/link", () => ({
  default: ({ href, children, onClick, ...rest }: {
    href: unknown;
    children?: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
  }) => {
    const resolvedHref =
      typeof href === "string"
        ? href
        : (href as { pathname?: string })?.pathname ?? "";
    return (
      <a href={resolvedHref} onClick={onClick} data-testid="search-result" {...rest}>
        {children}
      </a>
    );
  },
}));

vi.mock("@/lib/i18n/I18nProvider", () => ({
  useI18n: () => ({
    lang: "fr",
    t: (key: string) => key,
  }),
}));

vi.mock("@/lib/search/search", () => ({
  search: (q: string) => {
    if (!q || q.length < 2) return [];
    return [
      {
        type: "exercice",
        items: [{ slug: "s1-01", title: "Squat", href: "/exercices/s1-01" }],
      },
      {
        type: "methode",
        items: [
          { slug: "drop-set", title: "Drop set", href: "/methodes/drop-set" },
        ],
      },
    ];
  },
}));

vi.mock("@/components/ExoThumb", () => ({
  ExoThumb: () => <span data-testid="thumb" />,
}));

import { SearchModal } from "@/components/SearchModal";

describe("SearchModal — résultats sont des liens (P0.7-nonies)", () => {
  it("rend les résultats comme <a href>, pas <button>", async () => {
    const onClose = vi.fn();
    render(<SearchModal onClose={onClose} />);
    const input = screen.getByPlaceholderText("search.placeholder") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "squ" } });
    const results = await waitFor(
      () => {
        const found = screen.queryAllByTestId("search-result");
        expect(found.length).toBeGreaterThanOrEqual(2);
        return found;
      },
      { timeout: 1000 },
    );
    for (const r of results) {
      expect(r.tagName.toLowerCase()).toBe("a");
    }
  });

  it("href exercice produit /fr/exercices/<slug> via LocaleLink", async () => {
    const onClose = vi.fn();
    render(<SearchModal onClose={onClose} />);
    const input = screen.getByPlaceholderText("search.placeholder") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "squ" } });
    await waitFor(
      () => {
        const found = screen.queryAllByTestId("search-result");
        const exerciceLink = found.find((r) =>
          r.getAttribute("href")?.includes("s1-01"),
        );
        expect(exerciceLink?.getAttribute("href")).toBe("/fr/exercices/s1-01");
      },
      { timeout: 1000 },
    );
  });

  it("href methode produit /fr/methodes/<slug> via LocaleLink", async () => {
    const onClose = vi.fn();
    render(<SearchModal onClose={onClose} />);
    const input = screen.getByPlaceholderText("search.placeholder") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "drop" } });
    await waitFor(
      () => {
        const found = screen.queryAllByTestId("search-result");
        const methodeLink = found.find((r) =>
          r.getAttribute("href")?.includes("drop-set"),
        );
        expect(methodeLink?.getAttribute("href")).toBe(
          "/fr/methodes/drop-set",
        );
      },
      { timeout: 1000 },
    );
  });

  it("clic sur un résultat appelle onClose pour fermer la modale", async () => {
    const onClose = vi.fn();
    render(<SearchModal onClose={onClose} />);
    const input = screen.getByPlaceholderText("search.placeholder") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "squ" } });
    const results = await waitFor(
      () => {
        const found = screen.queryAllByTestId("search-result");
        expect(found.length).toBeGreaterThan(0);
        return found;
      },
      { timeout: 1000 },
    );
    fireEvent.click(results[0]);
    expect(onClose).toHaveBeenCalled();
  });
});
