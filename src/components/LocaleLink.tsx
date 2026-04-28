"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { clientLocalizedHref } from "@/lib/i18n/locale-path";
import type { Locale } from "@/lib/i18n/constants";
import type { ComponentProps } from "react";

type LocaleLinkProps = ComponentProps<typeof Link>;

/**
 * Locale-aware Link wrapper.
 *
 * Sprint A2 — Délègue la résolution à `clientLocalizedHref()` (source unique
 * partagée avec les router.push() programmatiques). La logique reste :
 *
 *   - `lang === "fr"` ET pathname élève (pas de préfixe locale) → href tel quel
 *     Le proxy i18n compense en interne.
 *   - Sinon (miroir admin OU autre locale) → préfixe avec `/${lang}`.
 *
 * Cf. clientLocalizedHref() dans src/lib/i18n/locale-path.ts pour la matrice
 * complète. Cf. SUPPORTED_LOCALES dans src/lib/i18n/constants.ts pour la liste
 * des locales (3 actuellement).
 */
export function LocaleLink({ href, ...rest }: LocaleLinkProps) {
  const { lang } = useI18n();
  const pathname = usePathname();

  // Le hook lang vient de I18nProvider (typé Lang = "fr"|"en"|"es"), équivalent
  // à Locale. On force le cast pour clientLocalizedHref qui attend Locale.
  const safeLang = lang as Locale;

  const hrefStr = typeof href === "string" ? href : href.pathname ?? "/";
  const resolved = clientLocalizedHref(hrefStr, safeLang, pathname);

  const finalHref = (() => {
    if (typeof href === "string") return resolved;
    if (resolved === hrefStr) return href; // pas de modif → garde l'objet original
    return { ...href, pathname: resolved };
  })();

  return <Link href={finalHref} {...rest} />;
}
