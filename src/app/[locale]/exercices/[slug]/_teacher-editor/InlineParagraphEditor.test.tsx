// Phase E.2 — tests de l'éditeur inline de paragraphe.
// Couvre : rendu lecture, transition vers édition, sauvegarde via blur et bouton,
// annulation (Échap), no-op si valeur identique, multi-ligne préservée,
// gestion d'erreur avec restauration et toast.

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

import InlineParagraphEditor from "./InlineParagraphEditor";

type SaveFn = (newValue: string) => Promise<void>;
type ErrorFn = (message: string) => void;

describe("InlineParagraphEditor", () => {
  const baseValue = "Le squat travaille principalement les quadriceps.";
  const baseProps = {
    initialValue: baseValue,
    ariaLabel: "Modifier le résumé",
    placeholder: "Saisir le contenu…",
  };

  let onSave: Mock<SaveFn>;
  let onError: Mock<ErrorFn>;

  beforeEach(() => {
    onSave = vi.fn<SaveFn>(() => Promise.resolve());
    onError = vi.fn<ErrorFn>();
  });

  it("1. rendu initial en lecture seule, rôle bouton, aria-label, contenu visible", () => {
    render(
      <InlineParagraphEditor {...baseProps} onSave={onSave} onError={onError} />,
    );
    const display = screen.getByRole("button", { name: /modifier le résumé/i });
    expect(display).toBeDefined();
    expect(display.tagName).toBe("P");
    expect(display.textContent).toBe(baseValue);
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("2. clic sur le paragraphe → passage en édition, textarea visible, valeur = initialValue", () => {
    render(
      <InlineParagraphEditor {...baseProps} onSave={onSave} onError={onError} />,
    );
    fireEvent.click(screen.getByRole("button"));
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea).toBeDefined();
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea.value).toBe(baseValue);
  });

  it("3. modif + blur → appelle onSave(nouvelle valeur trimée) et repasse en lecture", async () => {
    render(
      <InlineParagraphEditor {...baseProps} onSave={onSave} onError={onError} />,
    );
    fireEvent.click(screen.getByRole("button"));
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(textarea, {
      target: { value: "Nouveau résumé du squat." },
    });
    fireEvent.blur(textarea);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith("Nouveau résumé du squat.");
    });
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toBeNull();
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it("4. Échap → aucun appel onSave, retour lecture avec valeur d'origine", () => {
    render(
      <InlineParagraphEditor {...baseProps} onSave={onSave} onError={onError} />,
    );
    fireEvent.click(screen.getByRole("button"));
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(textarea, {
      target: { value: "Valeur jamais sauvegardée" },
    });
    fireEvent.keyDown(textarea, { key: "Escape" });

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByRole("button").textContent).toBe(baseValue);
  });

  it("5. valeur identique (trim inchangé) + blur → pas d'appel inutile à onSave", () => {
    render(
      <InlineParagraphEditor {...baseProps} onSave={onSave} onError={onError} />,
    );
    fireEvent.click(screen.getByRole("button"));
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: `  ${baseValue}  ` } });
    fireEvent.blur(textarea);

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByRole("button").textContent).toBe(baseValue);
  });

  it("6. multi-ligne : sauts de ligne préservés à la sauvegarde", async () => {
    render(
      <InlineParagraphEditor {...baseProps} onSave={onSave} onError={onError} />,
    );
    fireEvent.click(screen.getByRole("button"));
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    const multiLine = "Ligne 1\nLigne 2\nLigne 3";
    fireEvent.change(textarea, { target: { value: multiLine } });
    fireEvent.blur(textarea);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(multiLine);
    });
  });

  it("7. clic sur le bouton Enregistrer → appelle onSave et sort du mode édition", async () => {
    render(
      <InlineParagraphEditor
        {...baseProps}
        onSave={onSave}
        onError={onError}
        saveLabel="Enregistrer"
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Mis à jour via bouton" } });

    const saveBtn = screen.getByTestId("inline-paragraph-save");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith("Mis à jour via bouton");
    });
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toBeNull();
    });
  });

  it("8. onSave rejette → onError appelé avec le message, valeur restaurée à l'affichage", async () => {
    const failingSave: Mock<SaveFn> = vi.fn<SaveFn>(() =>
      Promise.reject(new Error("Réseau KO")),
    );
    render(
      <InlineParagraphEditor
        {...baseProps}
        onSave={failingSave}
        onError={onError}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Tentative qui échoue" } });
    fireEvent.blur(textarea);

    await waitFor(() => {
      expect(failingSave).toHaveBeenCalledWith("Tentative qui échoue");
      expect(onError).toHaveBeenCalledWith("Réseau KO");
    });
    await waitFor(() => {
      const display = screen.getByRole("button");
      expect(display.textContent).toBe(baseValue);
    });
  });

  it("9. valeur initiale vide → placeholder affiché en mode lecture", () => {
    render(
      <InlineParagraphEditor
        initialValue=""
        ariaLabel="Modifier le résumé"
        placeholder="Saisir le contenu…"
        onSave={onSave}
        onError={onError}
      />,
    );
    const display = screen.getByRole("button");
    expect(display.textContent).toBe("Saisir le contenu…");
  });
});
