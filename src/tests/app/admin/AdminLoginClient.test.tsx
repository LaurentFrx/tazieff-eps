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

  // Sprint fix-magic-link-delivery (30 avril 2026) — bouton de retour au
  // formulaire après soumission. Avant ce fix, l'écran de confirmation
  // bloquait l'utilisateur et l'obligeait à recharger la page pour
  // modifier son email ou retenter (cf. retour Laurent du 30 avril).
  it("après confirmation, expose un bouton 'Modifier l'email' qui ré-affiche le formulaire", async () => {
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
      target: { value: "first@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Connexion" }));

    // Confirmation visible
    await screen.findByTestId("admin-login-confirmation");
    const editButton = screen.getByTestId("admin-login-edit-email");
    expect(editButton.textContent).toMatch(/modifier l/i);

    // Clic → on revient sur le formulaire
    fireEvent.click(editButton);
    await waitFor(() => {
      expect(screen.queryByTestId("admin-login-confirmation")).toBeNull();
    });
    expect(screen.getByLabelText("Adresse email")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Connexion" })).toBeTruthy();
  });
});

// P0.7-undecies — Régression-guard sur le HOST exact de emailRedirectTo.
// Le bug observé (clic magic-link → home élève sans préfixe locale) ne peut
// pas venir du code si window.location.origin est correctement préfixé. Si
// ces tests cassent un jour, le bug a une cause code. Sinon (tests verts +
// bug en runtime), la cause est config Supabase Redirect URLs.
describe("AdminLoginClient — emailRedirectTo host par environnement (P0.7-undecies)", () => {
  const originalWindowLocation = Object.getOwnPropertyDescriptor(
    window,
    "location",
  );

  function setLocationOrigin(origin: string) {
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { ...window.location, origin, host: origin.replace(/^https?:\/\//, "") },
    });
  }

  afterEach(() => {
    if (originalWindowLocation) {
      Object.defineProperty(window, "location", originalWindowLocation);
    }
  });

  it("preview design-admin.muscu-eps.fr → emailRedirectTo prefixé sur ce host", async () => {
    setLocationOrigin("https://design-admin.muscu-eps.fr");
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ eligible: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    ) as unknown as typeof fetch;

    renderClient();
    fireEvent.change(screen.getByLabelText("Adresse email"), {
      target: { value: "contact@muscu-eps.fr" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Connexion" }));

    await waitFor(() => {
      expect(signInWithOtpMock).toHaveBeenCalledTimes(1);
    });
    const callArgs = signInWithOtpMock.mock.calls[0]?.[0] as {
      options: { emailRedirectTo: string };
    };
    expect(callArgs.options.emailRedirectTo).toBe(
      "https://design-admin.muscu-eps.fr/auth/callback?next=/admin",
    );
  });

  it("prod admin.muscu-eps.fr → emailRedirectTo prefixé sur ce host", async () => {
    setLocationOrigin("https://admin.muscu-eps.fr");
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ eligible: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    ) as unknown as typeof fetch;

    renderClient();
    fireEvent.change(screen.getByLabelText("Adresse email"), {
      target: { value: "contact@muscu-eps.fr" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Connexion" }));

    await waitFor(() => {
      expect(signInWithOtpMock).toHaveBeenCalledTimes(1);
    });
    const callArgs = signInWithOtpMock.mock.calls[0]?.[0] as {
      options: { emailRedirectTo: string };
    };
    expect(callArgs.options.emailRedirectTo).toBe(
      "https://admin.muscu-eps.fr/auth/callback?next=/admin",
    );
  });

  it("dev local admin.localhost:3000 → emailRedirectTo prefixé sur ce host", async () => {
    setLocationOrigin("http://admin.localhost:3000");
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ eligible: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    ) as unknown as typeof fetch;

    renderClient();
    fireEvent.change(screen.getByLabelText("Adresse email"), {
      target: { value: "contact@muscu-eps.fr" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Connexion" }));

    await waitFor(() => {
      expect(signInWithOtpMock).toHaveBeenCalledTimes(1);
    });
    const callArgs = signInWithOtpMock.mock.calls[0]?.[0] as {
      options: { emailRedirectTo: string };
    };
    expect(callArgs.options.emailRedirectTo).toBe(
      "http://admin.localhost:3000/auth/callback?next=/admin",
    );
  });
});
