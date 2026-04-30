"use client";

// Sprint P0.7 + P0.8 — Composant client pour la page /admin/login.
//
// P0.8 : flow magic-link client-initié canonique @supabase/ssr.
//   1. POST /api/auth/admin-magic-link — pré-check d'éligibilité serveur
//      (lookup app_admins ⨝ auth.users). Retour { eligible: boolean }.
//   2. Si eligible → signInWithOtp côté navigateur via createBrowserClient,
//      le verifier PKCE est posé directement dans les cookies du host courant.
//   3. Dans tous les cas → message de confirmation strict identique
//      (anti-leak admin : on ne révèle jamais l'existence du compte).
//
// Cf. audit P0.8 : le pattern signInWithOtp côté serveur faisait transiter
// le verifier via Set-Cookie de la réponse POST, dépendant du timing du
// navigateur — bug "PKCE code verifier not found in storage" reproductible.

import { useState, useRef, useEffect, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AdminLoginClient() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  // Focus management : l'input email reçoit le focus au mount.
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (email.trim().length === 0) {
      setErrorMessage(t("adminLogin.emailRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/admin-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!response.ok) {
        // 400 (validation Zod) ou 500 (Supabase down). Anti-leak : on garde
        // un message générique, pas de différenciation entre les cas.
        setErrorMessage(t("adminLogin.networkError"));
        return;
      }

      const body = (await response.json().catch(() => ({}))) as {
        eligible?: boolean;
      };

      // Si eligible, on déclenche signInWithOtp côté navigateur.
      // Si non eligible, on ne fait rien, mais on affiche le même message
      // de confirmation (anti-leak strict).
      if (body.eligible === true) {
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          const { error: otpError } = await supabase.auth.signInWithOtp({
            email: email.trim().toLowerCase(),
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
              shouldCreateUser: false,
            },
          });
          if (otpError) {
            // Erreur Supabase (rate limit, SMTP). Anti-leak : on log côté
            // client mais on affiche le même message neutre.
            console.error("[admin-login] signInWithOtp:", otpError.message);
          }
        }
      }

      // Toujours afficher le message de confirmation neutre, dans les deux cas.
      setIsConfirmed(true);
    } catch {
      setErrorMessage(t("adminLogin.networkError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-md px-6 py-16">
      <h1
        className="mb-8 text-3xl uppercase tracking-wider text-white"
        style={{
          fontFamily: "var(--font-bebas), sans-serif",
          color: "#00E5FF",
        }}
      >
        {t("adminLogin.title")}
      </h1>

      {isConfirmed ? (
        <div
          role="status"
          className="space-y-3 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-5 text-sm text-cyan-100"
          data-testid="admin-login-confirmation"
        >
          <p>{t("adminLogin.confirmation")}</p>
          {/* Sprint fix-magic-link-delivery (30 avril 2026) — bouton de
              retour au formulaire pour modifier l'email ou retenter sans
              recharger la page. Avant ce fix, après soumission le formulaire
              était caché sans aucun moyen d'y revenir. */}
          <button
            type="button"
            onClick={() => {
              setIsConfirmed(false);
              setErrorMessage(null);
              // Refocus l'input pour faciliter la modification.
              setTimeout(() => emailInputRef.current?.focus(), 0);
            }}
            className="text-xs font-semibold uppercase tracking-wider text-cyan-300 underline-offset-4 hover:text-cyan-100 hover:underline"
            data-testid="admin-login-edit-email"
          >
            {t("adminLogin.editEmail")}
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          noValidate
        >
          <div className="space-y-1.5">
            <label
              htmlFor="admin-login-email"
              className="block text-xs font-semibold uppercase tracking-wider text-white/60"
            >
              {t("adminLogin.email.label")}
            </label>
            <input
              id="admin-login-email"
              ref={emailInputRef}
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-lg border border-white/10 bg-[#04040A] px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
              disabled={isSubmitting}
            />
          </div>

          {errorMessage ? (
            <p
              role="alert"
              className="text-sm text-rose-400"
              data-testid="admin-login-error"
            >
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="primary-button primary-button--wide bg-gradient-to-r from-cyan-500 to-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? t("adminLogin.submitting") : t("adminLogin.submit")}
          </button>
        </form>
      )}
    </section>
  );
}
