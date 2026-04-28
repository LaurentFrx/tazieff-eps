// Sprint A5 — Tests de la page /[locale]/rejoindre.
//
// Couvre :
//   1. Rendu initial avec ?code= (le code est pré-rempli, message "subtitleWithCode")
//   2. Rendu initial sans code (message "subtitleNoCode")
//   3. POST /api/me/classes/join réussi → router.push vers /ma-classe
//   4. POST 404 code_not_found → message d'erreur i18n affiché
//   5. POST 409 already_enrolled → message d'erreur i18n affiché

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const pushMock = vi.fn();
const usePathnameMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => usePathnameMock(),
}));

vi.mock("@/lib/i18n/I18nProvider", () => ({
  useI18n: () => ({
    lang: "fr",
    t: (key: string) => {
      const map: Record<string, string> = {
        "rejoindre.title": "Rejoindre une classe",
        "rejoindre.subtitleWithCode": "Code prérempli, complète tes infos",
        "rejoindre.subtitleNoCode": "Saisis le code de ta classe",
        "rejoindre.help": "Tu pourras retrouver ta classe",
        "maClasse.joinForm.firstName": "Prénom",
        "maClasse.joinForm.lastName": "Nom",
        "maClasse.joinForm.code": "Code",
        "maClasse.joinForm.submit": "Rejoindre",
        "maClasse.joinForm.submitting": "Envoi...",
        "maClasse.joinForm.errors.firstNameRequired":
          "Prénom requis",
        "maClasse.joinForm.errors.lastNameRequired": "Nom requis",
        "maClasse.joinForm.errors.codeRequired": "Code requis",
        "maClasse.joinForm.errors.codeNotFound":
          "Code de classe inconnu",
        "maClasse.joinForm.errors.alreadyEnrolled":
          "Tu es déjà dans cette classe",
        "maClasse.joinForm.errors.joinFailed": "Erreur",
        "maClasse.joinForm.errors.networkError": "Erreur réseau",
      };
      return map[key] ?? key;
    },
  }),
}));

import { RejoindreClient } from "@/app/[locale]/rejoindre/RejoindreClient";

beforeEach(() => {
  pushMock.mockReset();
  usePathnameMock.mockReturnValue("/fr/rejoindre");
  (globalThis as unknown as { fetch: ReturnType<typeof vi.fn> }).fetch =
    vi.fn();
});

describe("RejoindreClient — rendu initial", () => {
  it("avec un code en querystring : code pré-rempli + sous-titre adapté", () => {
    render(<RejoindreClient initialCode="ABCD1234" />);
    expect(
      screen.getByRole("heading", { name: "Rejoindre une classe" }),
    ).toBeDefined();
    expect(
      screen.getByText("Code prérempli, complète tes infos"),
    ).toBeDefined();
    const codeInput = screen.getByLabelText("Code") as HTMLInputElement;
    expect(codeInput.value).toBe("ABCD1234");
  });

  it("sans code en querystring : input vide + sous-titre 'noCode'", () => {
    render(<RejoindreClient initialCode="" />);
    expect(screen.getByText("Saisis le code de ta classe")).toBeDefined();
    const codeInput = screen.getByLabelText("Code") as HTMLInputElement;
    expect(codeInput.value).toBe("");
  });
});

describe("RejoindreClient — soumission", () => {
  it("POST 200 → router.push vers /ma-classe (préfixe locale)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        class: { id: "c1", name: "2nde A", school_year: "2026" },
        teacher: { name: null },
        organization: { name: "Lycée Tazieff" },
      }),
    });
    render(<RejoindreClient initialCode="ABCD1234" />);
    fireEvent.change(screen.getByLabelText("Prénom"), {
      target: { value: "Léa" },
    });
    fireEvent.change(screen.getByLabelText("Nom"), {
      target: { value: "Martin" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Rejoindre/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledTimes(1);
    });
    // Sur /fr/rejoindre, clientLocalizedHref préfixe "/ma-classe" → "/fr/ma-classe".
    expect(pushMock).toHaveBeenCalledWith("/fr/ma-classe");
  });

  it("POST 404 code_not_found → message d'erreur i18n affiché, pas de redirect", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: "code_not_found", message: "code inconnu" }),
    });
    render(<RejoindreClient initialCode="WRONG" />);
    fireEvent.change(screen.getByLabelText("Prénom"), {
      target: { value: "Léa" },
    });
    fireEvent.change(screen.getByLabelText("Nom"), {
      target: { value: "Martin" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Rejoindre/i }));

    await waitFor(() => {
      expect(screen.getByTestId("join-form-error").textContent).toBe(
        "Code de classe inconnu",
      );
    });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("POST 409 already_enrolled → message d'erreur i18n", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        error: "already_enrolled",
        message: "déjà inscrit",
      }),
    });
    render(<RejoindreClient initialCode="ABCD1234" />);
    fireEvent.change(screen.getByLabelText("Prénom"), {
      target: { value: "Léa" },
    });
    fireEvent.change(screen.getByLabelText("Nom"), {
      target: { value: "Martin" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Rejoindre/i }));

    await waitFor(() => {
      expect(screen.getByTestId("join-form-error").textContent).toBe(
        "Tu es déjà dans cette classe",
      );
    });
    expect(pushMock).not.toHaveBeenCalled();
  });
});
