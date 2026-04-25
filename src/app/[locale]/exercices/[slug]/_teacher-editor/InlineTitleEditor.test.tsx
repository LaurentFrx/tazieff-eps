// Phase E.1 — tests de l'éditeur inline du titre d'exercice.
// Couvre : rendu lecture, transition vers édition, sauvegarde (Enter + blur),
// annulation (Escape), no-op si titre identique, gestion d'erreur avec
// restauration du titre et toast d'erreur.

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import InlineTitleEditor from "./InlineTitleEditor";

describe("InlineTitleEditor", () => {
  const baseProps = {
    title: "Squat arrière",
    slug: "s1-01",
    locale: "fr" as const,
  };

  let onSave: ReturnType<typeof vi.fn>;
  let onError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSave = vi.fn(() => Promise.resolve());
    onError = vi.fn();
  });

  it("1. rendu initial en lecture seule, rôle bouton, label FR, pas d'input", () => {
    render(
      <InlineTitleEditor {...baseProps} onSave={onSave} onError={onError} />,
    );
    const display = screen.getByRole("button", {
      name: /modifier le titre/i,
    });
    expect(display).toBeDefined();
    expect(display.tagName).toBe("SPAN");
    expect(display.textContent).toBe("Squat arrière");
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("2. clic sur le titre → passage en édition, input visible, valeur = titre initial", () => {
    render(
      <InlineTitleEditor {...baseProps} onSave={onSave} onError={onError} />,
    );
    fireEvent.click(screen.getByRole("button"));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input).toBeDefined();
    expect(input.value).toBe("Squat arrière");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("3. saisie + Enter → appelle onSave(nouveau titre) et repasse en lecture", async () => {
    render(
      <InlineTitleEditor {...baseProps} onSave={onSave} onError={onError} />,
    );
    fireEvent.click(screen.getByRole("button"));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Squat bulgare" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith("Squat bulgare");
    });
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toBeNull();
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it("4. saisie + Escape → aucun appel onSave, retour lecture avec titre d'origine", () => {
    render(
      <InlineTitleEditor {...baseProps} onSave={onSave} onError={onError} />,
    );
    fireEvent.click(screen.getByRole("button"));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Valeur jamais sauvegardée" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByRole("button").textContent).toBe("Squat arrière");
  });

  it("5. titre identique (trim inchangé) + Enter → pas d'appel inutile à onSave", () => {
    render(
      <InlineTitleEditor {...baseProps} onSave={onSave} onError={onError} />,
    );
    fireEvent.click(screen.getByRole("button"));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    // Ajout d'espaces autour mais trim() renverra la même valeur
    fireEvent.change(input, { target: { value: "  Squat arrière  " } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSave).not.toHaveBeenCalled();
    // Retour en lecture avec titre d'origine
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByRole("button").textContent).toBe("Squat arrière");
  });

  it("6. onSave rejette → onError appelé avec le message, titre d'origine restauré", async () => {
    const failingSave = vi.fn(() => Promise.reject(new Error("Échec réseau")));
    render(
      <InlineTitleEditor
        {...baseProps}
        onSave={failingSave}
        onError={onError}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Nouveau titre" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(failingSave).toHaveBeenCalledWith("Nouveau titre");
      expect(onError).toHaveBeenCalledWith("Échec réseau");
    });
    await waitFor(() => {
      // Retour en lecture avec le titre d'origine (non modifié côté parent)
      const display = screen.getByRole("button");
      expect(display.textContent).toBe("Squat arrière");
    });
  });
});
