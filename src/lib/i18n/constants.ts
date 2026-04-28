// Sprint A2 — Source unique de vérité pour la liste des locales supportées.
//
// Cause racine traitée (audit-cc 2026-04-28 PS6) : 4 endroits hardcodaient
// la liste ["fr","en","es"] de façon indépendante (LocaleLink, buildLocalePath,
// proxy.ts via LOCALE_PREFIXES + LOCALES, sitemap.ts). Toute future locale
// ajoutée à messages.ts demandait de toucher 4 endroits ; oubli garanti.
//
// Importé par : src/components/LocaleLink.tsx, src/lib/i18n/locale-path.ts,
// src/lib/navigation.ts. Le proxy.ts conserve sa propre constante locale par
// contrainte du runtime edge (pas d'import lib/* possible).

export const SUPPORTED_LOCALES = ["fr", "en", "es"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Sprint A5 — Locale par défaut quand aucune n'est fournie ou que la valeur
 * est invalide. Utilisée par le proxy i18n (fallback rewrite vers /fr/...) et
 * par localizedRedirect() dans @/lib/navigation.
 */
export const DEFAULT_LOCALE: Locale = "fr";

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
