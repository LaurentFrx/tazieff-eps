"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { ComponentProps } from "react";

type LocaleLinkProps = ComponentProps<typeof Link>;

/**
 * Locale-aware Link wrapper.
 *
 * Pour `lang === "fr"` :
 *   - Sur les hosts élève (muscu-eps.fr / design.muscu-eps.fr), l'URL publique
 *     est sans préfixe locale (ex: `/exercices`). Le middleware réécrit en
 *     interne vers `/fr/exercices`. On retourne donc `href` tel quel.
 *   - Sur le miroir admin (admin.muscu-eps.fr / design-admin.muscu-eps.fr),
 *     les routes pédagogiques sont servies en pass-through SANS rewrite.
 *     L'URL publique est `/fr/exercices`. Si on retournait `/exercices/s1-01`
 *     non préfixé, le clic atterrirait sur une route inexistante (404).
 *     On détecte ce cas en lisant `pathname` : s'il commence par `/fr/`,
 *     `/en/` ou `/es/`, on préfixe le href avec la locale.
 *
 * Pour `lang === "en"` ou `"es"` : on préfixe toujours (comportement legacy).
 */
export function LocaleLink({ href, ...rest }: LocaleLinkProps) {
  const { lang } = useI18n();
  const pathname = usePathname();

  const currentHasLocalePrefix =
    pathname === "/fr" ||
    pathname === "/en" ||
    pathname === "/es" ||
    pathname?.startsWith("/fr/") ||
    pathname?.startsWith("/en/") ||
    pathname?.startsWith("/es/");

  const prefixed = (() => {
    if (lang === "fr" && !currentHasLocalePrefix) return href;
    const hrefStr = typeof href === "string" ? href : href.pathname ?? "/";
    // Don't prefix external URLs, anchors, or already-prefixed paths
    if (
      hrefStr.startsWith("http") ||
      hrefStr.startsWith("#") ||
      hrefStr.startsWith(`/${lang}/`) ||
      hrefStr === `/${lang}`
    ) {
      return href;
    }
    const prefixedPath = `/${lang}${hrefStr.startsWith("/") ? hrefStr : `/${hrefStr}`}`;
    if (typeof href === "string") return prefixedPath;
    return { ...href, pathname: prefixedPath };
  })();

  return <Link href={prefixed} {...rest} />;
}
