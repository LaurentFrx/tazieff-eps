"use client";

// Sprint E1 — Formulaire de saisie code de classe + prénom + nom.
//
// Comportement :
//   - Validation client légère (champs non vides, code >= 4 caractères).
//   - POST vers /api/me/classes/join, gestion d'erreurs typées.
//   - Sur succès, refetch via callback parent (bascule vers ClassDetail).
//
// Style : Sport Vibrant (DM Sans, fond sombre, accents cyan/orange).

import { useState, useCallback, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

type ServerErrorCode =
  | "validation"
  | "unauthenticated"
  | "code_not_found"
  | "already_enrolled"
  | "join_failed";

type ApiError = {
  error: ServerErrorCode;
  message?: string;
};

type Props = {
  onJoined?: () => void | Promise<void>;
};

export function JoinClassForm({ onJoined }: Props) {
  const { t } = useI18n();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = useCallback((): string | null => {
    if (firstName.trim().length === 0) {
      return t("maClasse.joinForm.errors.firstNameRequired");
    }
    if (lastName.trim().length === 0) {
      return t("maClasse.joinForm.errors.lastNameRequired");
    }
    if (code.trim().length < 4) {
      return t("maClasse.joinForm.errors.codeRequired");
    }
    return null;
  }, [firstName, lastName, code, t]);

  const mapServerError = useCallback(
    (apiError: ApiError | null): string => {
      if (!apiError) return t("maClasse.joinForm.errors.networkError");
      switch (apiError.error) {
        case "code_not_found":
          return t("maClasse.joinForm.errors.codeNotFound");
        case "already_enrolled":
          return t("maClasse.joinForm.errors.alreadyEnrolled");
        case "validation":
          return apiError.message ?? t("maClasse.joinForm.errors.joinFailed");
        case "unauthenticated":
        case "join_failed":
        default:
          return apiError.message ?? t("maClasse.joinForm.errors.joinFailed");
      }
    },
    [t],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/me/classes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          code: code.trim().toUpperCase(),
        }),
      });
      if (!response.ok) {
        let payload: ApiError | null = null;
        try {
          payload = (await response.json()) as ApiError;
        } catch {
          payload = null;
        }
        setErrorMessage(mapServerError(payload));
        return;
      }
      // Succès : on délègue au parent (refetch).
      await onJoined?.();
    } catch {
      setErrorMessage(t("maClasse.joinForm.errors.networkError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "block w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--ink)] placeholder:text-[color:var(--muted)] focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/40";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 space-y-4"
      style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
      noValidate
    >
      <div className="space-y-1.5">
        <label
          htmlFor="ma-classe-first-name"
          className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--muted)]"
        >
          {t("maClasse.joinForm.firstName")}
        </label>
        <input
          id="ma-classe-first-name"
          type="text"
          autoComplete="given-name"
          inputMode="text"
          maxLength={60}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className={inputClass}
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="ma-classe-last-name"
          className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--muted)]"
        >
          {t("maClasse.joinForm.lastName")}
        </label>
        <input
          id="ma-classe-last-name"
          type="text"
          autoComplete="family-name"
          inputMode="text"
          maxLength={60}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className={inputClass}
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="ma-classe-code"
          className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--muted)]"
        >
          {t("maClasse.joinForm.code")}
        </label>
        <input
          id="ma-classe-code"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={16}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className={`${inputClass} font-mono uppercase tracking-widest`}
          disabled={isSubmitting}
          required
        />
      </div>

      {errorMessage ? (
        <p
          role="alert"
          className="text-sm text-rose-400"
          data-testid="join-form-error"
        >
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="primary-button primary-button--wide bg-gradient-to-r from-orange-500 to-amber-500 disabled:opacity-50"
      >
        {isSubmitting ? t("maClasse.joinForm.submitting") : t("maClasse.joinForm.submit")}
      </button>
    </form>
  );
}
