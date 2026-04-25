"use client";

// Phase E.2.2.5 — Formulaire de connexion prof via magic link académique.
// Utilise le hook `useTeacherAuth` existant (POST /api/auth/teacher-magic-link).
// Validation locale via isAcademicEmail avant l'appel API, pour feedback
// immédiat sans aller-retour serveur.

import { useMemo, useState, type FormEvent } from "react";
import { isAcademicEmail } from "@/lib/auth/academic-domains";
import { useTeacherSession } from "@/hooks/useTeacherSession";
import styles from "./ProLoginForm.module.css";

type Status = "idle" | "validating" | "success" | "error";

/**
 * Détermine l'URL du site élève à rendre dans le lien secondaire.
 * En preview → design.muscu-eps.fr, en prod → muscu-eps.fr, sinon local.
 */
function getStudentSiteUrl(): string {
  if (typeof window === "undefined") return "https://muscu-eps.fr";
  const host = window.location.host;
  if (host === "design-prof.muscu-eps.fr") return "https://design.muscu-eps.fr";
  if (host === "prof.muscu-eps.fr") return "https://muscu-eps.fr";
  // Dev local / fallback
  return "https://muscu-eps.fr";
}

export default function ProLoginForm() {
  const { signInWithEmail } = useTeacherSession();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const trimmed = email.trim();
  const localCheck = useMemo(() => {
    if (trimmed.length === 0) return { valid: false, showError: false };
    const valid = isAcademicEmail(trimmed);
    return {
      valid,
      showError: !valid && trimmed.includes("@"),
    };
  }, [trimmed]);

  const canSubmit = localCheck.valid && status !== "validating";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus("validating");
    setMessage("");

    const result = await signInWithEmail(trimmed);

    if (result.ok) {
      setStatus("success");
      setMessage(
        `Lien envoyé à ${trimmed}. Vérifiez votre boîte mail pour vous connecter.`,
      );
    } else {
      setStatus("error");
      setMessage(result.error ?? "Une erreur est survenue.");
    }
  }

  const isSuccess = status === "success";
  const isValidating = status === "validating";
  const showError = status === "error" || localCheck.showError;
  const errorMessage =
    status === "error"
      ? message
      : localCheck.showError
        ? "Adresse académique requise (ex: prenom.nom@ac-bordeaux.fr)."
        : "";

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.header}>
        <h1 className={styles.title}>Espace enseignant</h1>
        <div className={styles.titleUnderline} />
        <p className={styles.subtitle}>
          Accédez à vos références pédagogiques, à vos classes et à vos
          annotations.
        </p>
      </div>

      {isSuccess ? (
        <p className={styles.success} role="status">
          <svg
            className={styles.successIcon}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="16 5 7 14 3 10" />
          </svg>
          {message}
        </p>
      ) : (
        <>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="prof-email">
              Email académique
            </label>
            <input
              id="prof-email"
              className={`${styles.input} ${showError ? styles.inputError : ""}`}
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="prenom.nom@ac-academie.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isValidating}
              aria-invalid={showError}
              aria-describedby={showError ? "prof-email-error" : undefined}
            />
            {showError && errorMessage && (
              <p id="prof-email-error" className={styles.errorHint}>
                {errorMessage}
              </p>
            )}
          </div>

          <button
            type="submit"
            className={styles.submit}
            disabled={!canSubmit}
          >
            {isValidating ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                Envoi…
              </>
            ) : (
              "Recevoir mon lien"
            )}
          </button>
        </>
      )}

      <div className={styles.divider} />

      <a
        className={styles.secondaryLink}
        href={getStudentSiteUrl()}
        rel="noopener"
      >
        Découvrir l&apos;espace élève avant de vous lancer
        <svg
          className={styles.secondaryArrow}
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="5" y1="10" x2="15" y2="10" />
          <polyline points="11 5 16 10 11 15" />
        </svg>
      </a>

      <p className={styles.footer}>
        Gratuit et sans mot de passe pour les enseignants.
      </p>
    </form>
  );
}
