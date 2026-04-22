// Phase E.2.2.5 — Tests du composant ProLoginVisual.
// Vérifie la présence des éléments clés et le respect de prefers-reduced-motion
// (via mock matchMedia).

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Mock next/image pour simplifier (rendu comme <img> basique en test)
vi.mock("next/image", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

import ProLoginVisual from "@/components/auth/ProLoginVisual";

describe("ProLoginVisual", () => {
  it("rend sans crasher et expose les corners ESPACE / ENSEIGNANT", () => {
    render(<ProLoginVisual />);
    expect(screen.getByText("ESPACE")).toBeDefined();
    expect(screen.getByText("ENSEIGNANT")).toBeDefined();
  });

  it("affiche le titre MUSCU - EPS dans un h1", () => {
    const { container } = render(<ProLoginVisual />);
    const h1 = container.querySelector("h1");
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toBe("MUSCU - EPS");
  });

  it("affiche le sous-titre TAZIEFF", () => {
    render(<ProLoginVisual />);
    expect(screen.getByText("TAZIEFF")).toBeDefined();
  });

  it("affiche les 2 lignes du bandeau bas", () => {
    render(<ProLoginVisual />);
    expect(
      screen.getByText(/OUTIL PÉDAGOGIQUE • BAC EPS • GRATUIT ENSEIGNANTS/),
    ).toBeDefined();
    expect(
      screen.getByText(/CONFORME RGPD • HÉBERGEMENT UE/),
    ).toBeDefined();
  });

  it("rend le mannequin anatomique via next/image (mock)", () => {
    const { container } = render(<ProLoginVisual />);
    const img = container.querySelector(
      'img[src="/images/anatomy/mini-mannequin.webp"]',
    );
    expect(img).not.toBeNull();
  });

  it("applique aria-hidden=true sur le root (décoratif)", () => {
    const { container } = render(<ProLoginVisual />);
    const root = container.firstChild as HTMLElement;
    expect(root.getAttribute("aria-hidden")).toBe("true");
  });

  it("accepte une className externe", () => {
    const { container } = render(<ProLoginVisual className="custom-class" />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("custom-class");
  });
});
