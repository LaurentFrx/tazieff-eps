"use client";

// Sprint P0.7-nonies — La page /[locale]/enseignant ne sert plus l'outil
// localStorage de gestion de séances (composant EnseignantDashboard, conservé
// dans le repo pour archive mais plus monté). Elle affiche désormais le même
// message que /reglages : l'espace enseignant a déménagé sur le sous-domaine
// prof.muscu-eps.fr.
//
// Pas de redirect automatique : permet à un élève qui clique par erreur de
// comprendre où il est et de revenir à l'accueil.

import { LocaleLink } from "@/components/LocaleLink";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { resolveEnv } from "@/lib/env";

// Sprint A1 — Supprimé le helper inline `getTeacherLoginUrl` (couvrait pas
// localhost, divergent avec les autres helpers de host). Source unique :
// resolveEnv().baseUrl.prof.

export function EnseignantMovedClient() {
  const { t } = useI18n();

  return (
    <section className="page" data-testid="enseignant-moved">
      <header className="page-header">
        <h1>{t("enseignant.title")}</h1>
      </header>

      <div className="card stack-md">
        <p className="text-sm text-[color:var(--ink)]">
          {t("enseignant.moved.body")}
        </p>

        <a
          href={`${resolveEnv().baseUrl.prof}/connexion`}
          className="primary-button inline-flex items-center justify-center gap-2 self-start"
          rel="noopener"
          data-testid="enseignant-moved-cta"
        >
          {t("enseignant.moved.ctaPrimary")}
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <line x1="5" y1="10" x2="15" y2="10" />
            <polyline points="11 5 16 10 11 15" />
          </svg>
        </a>

        <LocaleLink
          href="/"
          className="text-sm text-[color:var(--muted)] hover:text-[color:var(--ink)] transition-colors self-start"
          data-testid="enseignant-moved-back"
        >
          ← {t("enseignant.moved.ctaSecondary")}
        </LocaleLink>
      </div>
    </section>
  );
}
