// Sprint P0.7 — Tests du composant AdminLoginClient.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/admin/login",
}));

import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { AdminLoginClient } from "@/app/admin/login/AdminLoginClient";

const originalFetch = global.fetch;

function renderClient() {
  return render(
    <I18nProvider initialLang="fr">
      <AdminLoginClient />
    </I18nProvider>,
  );
}

beforeEach(() => {
  // fresh fetch per test
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("AdminLoginClient", () => {
  it("rend le formulaire avec champ email et bouton submit", () => {
    renderClient();
    expect(screen.getByLabelText("Adresse email")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Connexion" })).toBeTruthy();
  });

  it("focus management : champ email focusé au mount", async () => {
    renderClient();
    await waitFor(() => {
      const input = screen.getByLabelText("Adresse email") as HTMLInputElement;
      expect(document.activeElement).toBe(input);
    });
  });

  it("affiche une erreur si email vide à la soumission", async () => {
    renderClient();
    fireEvent.click(screen.getByRole("button", { name: "Connexion" }));
    const error = await screen.findByTestId("admin-login-error");
    expect(error.textContent).toContain("Indique ton adresse email");
  });

  it("submit succès → message de confirmation neutre affiché", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    ) as unknown as typeof fetch;

    renderClient();
    const input = screen.getByLabelText("Adresse email") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Connexion" }));
    const confirmation = await screen.findByTestId(
      "admin-login-confirmation",
    );
    expect(confirmation.textContent).toMatch(
      /Si cet email correspond à un compte administrateur/i,
    );
  });

  it("submit erreur réseau → message d'erreur générique", async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error("offline"))) as unknown as
      typeof fetch;

    renderClient();
    fireEvent.change(screen.getByLabelText("Adresse email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Connexion" }));
    const error = await screen.findByTestId("admin-login-error");
    expect(error.textContent).toMatch(/erreur/i);
  });
});
