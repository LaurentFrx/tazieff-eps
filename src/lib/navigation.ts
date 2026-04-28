// Sprint A2 — Helpers de navigation localisée pour Server Components.
//
// Cause racine traitée (audit-cc 2026-04-28 PS2) : 6 redirect() dans des
// Server Components localisés ne préfixaient pas la locale courante. Sur
// l'élève le i18n rewrite du proxy compensait, mais la locale active était
// perdue (un visiteur en /es/exos/x atterrissait en /fr/exercices/x). Sur
// le miroir admin (pas de rewrite), les redirects auraient cassé.
//
// Référence : GOUVERNANCE_EDITORIALE.md §2.4, §3.2.

import { redirect } from "next/navigation";
import { SUPPORTED_LOCALES, type Locale, isLocale } from "@/lib/i18n/constants";

/**
 * Redirige vers un chemin préfixé par la locale courante.
 *
 * @param path Chemin SANS préfixe locale (ex : `/exercices/${slug}`).
 *             Doit commencer par "/" — sinon le helper l'ajoute.
 * @param locale Locale cible. Si non fournie, le caller doit l'avoir lue
 *               depuis ses params (les Server Components localisés reçoivent
 *               toujours `params.locale`). On valide que la valeur fait
 *               partie de SUPPORTED_LOCALES, sinon fallback vers "fr".
 *
 * Throw via `redirect()` de next/navigation : ce helper ne retourne jamais.
 */
export function localizedRedirect(path: string, locale?: string): never {
  const safeLocale: Locale = locale && isLocale(locale) ? locale : "fr";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  // Cas spécial : path = "/" → on redirige vers la home localisée.
  const target =
    normalizedPath === "/"
      ? `/${safeLocale}`
      : `/${safeLocale}${normalizedPath}`;
  redirect(target);
}

// Re-export utile pour les callers qui ont besoin de la liste sans toucher
// l'import de constants.ts en plus.
export { SUPPORTED_LOCALES };
