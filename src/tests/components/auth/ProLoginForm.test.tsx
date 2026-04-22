// Phase E.2.2.5 — Tests du composant ProLoginForm.
// Mocke useTeacherSession pour isoler le comportement UI : validation locale,
// états idle/validating/success/error, feedback d'erreur académique.

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/hooks/useTeacherSession", () => ({
  useTeacherSession: vi.fn(),
}));

import { useTeacherSession } from "@/hooks/useTeacherSession";
import ProLoginForm from "@/components/auth/ProLoginForm";

const mockUseTeacherSession = useTeacherSession as unknown as ReturnType<
  typeof vi.fn
>;

beforeEach(() => {
  mockUseTeacherSession.mockReset();
});

describe("ProLoginForm — rendu initial", () => {
  it("affiche le titre et le champ email", () => {
    mockUseTeacherSession.mockReturnValue({
      user: null,
      isTeacher: false,
      isLoading: false,
      signInWithEmail: vi.fn(),
      signOut: vi.fn(),
    });
    render(<ProLoginForm />);
    expect(
      screen.getByRole("heading", { name: /Espace enseignant/i }),
    ).toBeDefined();
    expect(screen.getByLabelText(/Email académique/i)).toBeDefined();
    expect(
      screen.getByRole("button", { name: /Recevoir mon lien/i }),
    ).toBeDefined();
  });

  it("affiche le lien secondaire vers l'espace élève", () => {
    mockUseTeacherSession.mockReturnValue({
      user: null,
      isTeacher: false,
      isLoading: false,
      signInWithEmail: vi.fn(),
      signOut: vi.fn(),
    });
    render(<ProLoginForm />);
    expect(
      screen.getByText(/Découvrir l'espace élève/i),
    ).toBeDefined();
  });

  it("désactive le bouton quand email est vide", () => {
    mockUseTeacherSession.mockReturnValue({
      user: null,
      isTeacher: false,
      isLoading: false,
      signInWithEmail: vi.fn(),
      signOut: vi.fn(),
    });
    render(<ProLoginForm />);
    const button = screen.getByRole("button", {
      name: /Recevoir mon lien/i,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});

describe("ProLoginForm — validation locale", () => {
  it("affiche un message d'erreur quand email non-académique avec @", () => {
    mockUseTeacherSession.mockReturnValue({
      user: null,
      isTeacher: false,
      isLoading: false,
      signInWithEmail: vi.fn(),
      signOut: vi.fn(),
    });
    render(<ProLoginForm />);
    const input = screen.getByLabelText(/Email académique/i);
    fireEvent.change(input, { target: { value: "prof@gmail.com" } });
    expect(screen.getByText(/Adresse académique requise/i)).toBeDefined();
  });

  it("n'appelle PAS signInWithEmail sur email invalide", () => {
    const signIn = vi.fn();
    mockUseTeacherSession.mockReturnValue({
      user: null,
      isTeacher: false,
      isLoading: false,
      signInWithEmail: signIn,
      signOut: vi.fn(),
    });
    render(<ProLoginForm />);
    const input = screen.getByLabelText(/Email académique/i);
    fireEvent.change(input, { target: { value: "prof@gmail.com" } });
    const form = input.closest("form")!;
    fireEvent.submit(form);
    expect(signIn).not.toHaveBeenCalled();
  });

  it("active le bouton avec email académique valide", () => {
    mockUseTeacherSession.mockReturnValue({
      user: null,
      isTeacher: false,
      isLoading: false,
      signInWithEmail: vi.fn(),
      signOut: vi.fn(),
    });
    render(<ProLoginForm />);
    const input = screen.getByLabelText(/Email académique/i);
    fireEvent.change(input, { target: { value: "prof@ac-bordeaux.fr" } });
    const button = screen.getByRole("button", {
      name: /Recevoir mon lien/i,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });
});

describe("ProLoginForm — soumission", () => {
  it("appelle signInWithEmail et affiche le message de succès", async () => {
    const signIn = vi.fn().mockResolvedValue({ ok: true });
    mockUseTeacherSession.mockReturnValue({
      user: null,
      isTeacher: false,
      isLoading: false,
      signInWithEmail: signIn,
      signOut: vi.fn(),
    });
    render(<ProLoginForm />);
    const input = screen.getByLabelText(/Email académique/i);
    fireEvent.change(input, { target: { value: "prof@ac-bordeaux.fr" } });
    fireEvent.click(screen.getByRole("button", { name: /Recevoir mon lien/i }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("prof@ac-bordeaux.fr");
    });
    await waitFor(() => {
      expect(screen.getByRole("status")).toBeDefined();
      expect(
        screen.getByText(/Lien envoyé à prof@ac-bordeaux\.fr/),
      ).toBeDefined();
    });
  });

  it("affiche l'erreur retournée par signInWithEmail (403 non-académique back)", async () => {
    const signIn = vi
      .fn()
      .mockResolvedValue({ ok: false, error: "Email non académique côté serveur." });
    mockUseTeacherSession.mockReturnValue({
      user: null,
      isTeacher: false,
      isLoading: false,
      signInWithEmail: signIn,
      signOut: vi.fn(),
    });
    render(<ProLoginForm />);
    const input = screen.getByLabelText(/Email académique/i);
    // On force un email qui passe la validation locale mais que le mock rejette
    fireEvent.change(input, { target: { value: "prof@ac-paris.fr" } });
    fireEvent.click(screen.getByRole("button", { name: /Recevoir mon lien/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Email non académique côté serveur/),
      ).toBeDefined();
    });
  });

  it("trim l'email avant l'envoi", async () => {
    const signIn = vi.fn().mockResolvedValue({ ok: true });
    mockUseTeacherSession.mockReturnValue({
      user: null,
      isTeacher: false,
      isLoading: false,
      signInWithEmail: signIn,
      signOut: vi.fn(),
    });
    render(<ProLoginForm />);
    const input = screen.getByLabelText(/Email académique/i);
    fireEvent.change(input, { target: { value: "  prof@ac-lyon.fr  " } });
    fireEvent.click(screen.getByRole("button", { name: /Recevoir mon lien/i }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("prof@ac-lyon.fr");
    });
  });
});
