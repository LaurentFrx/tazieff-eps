// Sprint E1 — Tests du composant JoinClassForm.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

// Mock next/navigation : I18nProvider lit useRouter / usePathname.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/fr/ma-classe",
}));

import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { JoinClassForm } from "@/app/[locale]/ma-classe/JoinClassForm";

const originalFetch = global.fetch;

function renderForm(onJoined?: () => void | Promise<void>) {
  return render(
    <I18nProvider initialLang="fr">
      <JoinClassForm onJoined={onJoined} />
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

describe("JoinClassForm", () => {
  it("rend les 3 champs et le bouton", () => {
    renderForm();
    expect(screen.getByLabelText("Prénom")).toBeTruthy();
    expect(screen.getByLabelText("Nom")).toBeTruthy();
    expect(screen.getByLabelText("Code de classe")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Rejoindre ma classe" }),
    ).toBeTruthy();
  });

  it("affiche une erreur si le prénom est vide à la soumission", async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText("Nom"), {
      target: { value: "Dupont" },
    });
    fireEvent.change(screen.getByLabelText("Code de classe"), {
      target: { value: "ABCD12" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rejoindre ma classe" }));
    const error = await screen.findByTestId("join-form-error");
    expect(error.textContent).toContain("Indique ton prénom");
  });

  it("affiche une erreur si le code est trop court", async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText("Prénom"), {
      target: { value: "Léa" },
    });
    fireEvent.change(screen.getByLabelText("Nom"), {
      target: { value: "Dupont" },
    });
    fireEvent.change(screen.getByLabelText("Code de classe"), {
      target: { value: "AB" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rejoindre ma classe" }));
    const error = await screen.findByTestId("join-form-error");
    expect(error.textContent).toMatch(/code de classe/i);
  });

  it("auto-uppercase le code à la saisie", () => {
    renderForm();
    const codeInput = screen.getByLabelText("Code de classe") as HTMLInputElement;
    fireEvent.change(codeInput, { target: { value: "abcd12" } });
    expect(codeInput.value).toBe("ABCD12");
  });

  it("submit succès → onJoined() appelé", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            class: { id: "c-1", name: "2nde B", school_year: "Seconde" },
            teacher: { name: null },
            organization: { name: "Tazieff" },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    ) as unknown as typeof fetch;
    const onJoined = vi.fn();
    renderForm(onJoined);
    fireEvent.change(screen.getByLabelText("Prénom"), {
      target: { value: "Léa" },
    });
    fireEvent.change(screen.getByLabelText("Nom"), {
      target: { value: "Dupont" },
    });
    fireEvent.change(screen.getByLabelText("Code de classe"), {
      target: { value: "ABCD12" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rejoindre ma classe" }));
    await waitFor(() => expect(onJoined).toHaveBeenCalledTimes(1));
  });

  it("submit erreur 404 code_not_found → message en français affiché", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            error: "code_not_found",
            message: "Code de classe inconnu. Vérifie auprès de ton enseignant.",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    ) as unknown as typeof fetch;
    renderForm();
    fireEvent.change(screen.getByLabelText("Prénom"), {
      target: { value: "Léa" },
    });
    fireEvent.change(screen.getByLabelText("Nom"), {
      target: { value: "Dupont" },
    });
    fireEvent.change(screen.getByLabelText("Code de classe"), {
      target: { value: "ABCD12" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rejoindre ma classe" }));
    const error = await screen.findByTestId("join-form-error");
    expect(error.textContent).toMatch(/code de classe inconnu/i);
  });

  it("submit erreur 409 already_enrolled → message dédié", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            error: "already_enrolled",
            message: "Tu es déjà dans cette classe.",
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    ) as unknown as typeof fetch;
    renderForm();
    fireEvent.change(screen.getByLabelText("Prénom"), {
      target: { value: "Léa" },
    });
    fireEvent.change(screen.getByLabelText("Nom"), {
      target: { value: "Dupont" },
    });
    fireEvent.change(screen.getByLabelText("Code de classe"), {
      target: { value: "ABCD12" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rejoindre ma classe" }));
    const error = await screen.findByTestId("join-form-error");
    expect(error.textContent).toMatch(/déjà dans cette classe/i);
  });
});
