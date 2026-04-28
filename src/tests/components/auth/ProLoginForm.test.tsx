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

describe("ProLoginForm — soumission (P0.8 flow client-initié)", () => {
  it("eligible: true → message de confirmation 'Lien de connexion envoyé'", async () => {
    const signIn = vi
      .fn()
      .mockResolvedValue({ ok: true, eligible: true });
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
        screen.getByText(
          /Lien de connexion envoyé sur ton adresse académique/i,
        ),
      ).toBeDefined();
    });
  });

  it("eligible: false → message 'Vérifie l'orthographe…' (anti-leak prof)", async () => {
    const signIn = vi
      .fn()
      .mockResolvedValue({ ok: true, eligible: false });
    mockUseTeacherSession.mockReturnValue({
      user: null,
      isTeacher: false,
      isLoading: false,
      signInWithEmail: signIn,
      signOut: vi.fn(),
    });
    render(<ProLoginForm />);
    const input = screen.getByLabelText(/Email académique/i);
    fireEvent.change(input, { target: { value: "prof@ac-paris.fr" } });
    fireEvent.click(screen.getByRole("button", { name: /Recevoir mon lien/i }));

    await waitFor(() => {
      expect(
        screen.getByText(
          /Vérifie l'orthographe de ton adresse, ou contacte l'administrateur/i,
        ),
      ).toBeDefined();
    });
  });

  it("ok: false → affiche l'erreur retournée par signInWithEmail", async () => {
    const signIn = vi.fn().mockResolvedValue({
      ok: false,
      eligible: true,
      error: "rate limit",
    });
    mockUseTeacherSession.mockReturnValue({
      user: null,
      isTeacher: false,
      isLoading: false,
      signInWithEmail: signIn,
      signOut: vi.fn(),
    });
    render(<ProLoginForm />);
    const input = screen.getByLabelText(/Email académique/i);
    fireEvent.change(input, { target: { value: "prof@ac-paris.fr" } });
    fireEvent.click(screen.getByRole("button", { name: /Recevoir mon lien/i }));

    await waitFor(() => {
      expect(screen.getByText(/rate limit/)).toBeDefined();
    });
  });

  it("trim l'email avant l'envoi", async () => {
    const signIn = vi.fn().mockResolvedValue({ ok: true, eligible: true });
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
