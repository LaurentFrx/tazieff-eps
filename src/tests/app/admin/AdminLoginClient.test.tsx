// Sprint P0.7 + P0.8 — Tests du composant AdminLoginClient.
//
// P0.8 : le client appelle maintenant signInWithOtp côté navigateur si
// la route /api/auth/admin-magic-link répond eligible: true. Si false,
// le composant affiche le même message neutre (anti-leak strict admin).

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/admin/login",
}));

const signInWithOtpMock = vi.fn();

vi.mock("@/lib/supabase/browser", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      signInWithOtp: signInWithOtpMock,
    },
  }),
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
  signInWithOtpMock.mockReset();
  signInWithOtpMock.mockResolvedValue({ data: {}, error: null });
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

  it("eligible: true → signInWithOtp appelé + message neutre affiché", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ eligible: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    ) as unknown as typeof fetch;

    renderClient();
    const input = screen.getByLabelText("Adresse email") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "admin@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Connexion" }));

    const confirmation = await screen.findByTestId(
      "admin-login-confirmation",
    );
    expect(confirmation.textContent).toMatch(
      /Si cet email correspond à un compte administrateur/i,
    );
    await waitFor(() => {
      expect(signInWithOtpMock).toHaveBeenCalledTimes(1);
    });
    const callArgs = signInWithOtpMock.mock.calls[0]?.[0] as {
      email: string;
      options: { emailRedirectTo: string; shouldCreateUser: boolean };
    };
    expect(callArgs.email).toBe("admin@example.com");
    expect(callArgs.options.shouldCreateUser).toBe(false);
    expect(callArgs.options.emailRedirectTo).toMatch(
      /\/auth\/callback\?next=\/admin$/,
    );
  });

  it("eligible: false → signInWithOtp NON appelé + même message neutre", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ eligible: false }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    ) as unknown as typeof fetch;

    renderClient();
    fireEvent.change(screen.getByLabelText("Adresse email"), {
      target: { value: "stranger@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Connexion" }));

    const confirmation = await screen.findByTestId(
      "admin-login-confirmation",
    );
    expect(confirmation.textContent).toMatch(
      /Si cet email correspond à un compte administrateur/i,
    );
    expect(signInWithOtpMock).not.toHaveBeenCalled();
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
    expect(signInWithOtpMock).not.toHaveBeenCalled();
  });

  it("réponse non-OK (400/500) → message d'erreur générique", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: "validation" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    ) as unknown as typeof fetch;

    renderClient();
    fireEvent.change(screen.getByLabelText("Adresse email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Connexion" }));
    const error = await screen.findByTestId("admin-login-error");
    expect(error.textContent).toMatch(/erreur/i);
    expect(signInWithOtpMock).not.toHaveBeenCalled();
  });
});
