"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { ComponentProps } from "react";

type LocaleLinkProps = ComponentProps<typeof Link>;

/**
 * Locale-aware Link wrapper.
 * Automatically prefixes href with /en or /es for non-French locales.
 * French paths have no prefix (handled by middleware rewrite).
 */
export function LocaleLink({ href, ...rest }: LocaleLinkProps) {
  const { lang } = useI18n();

  const prefixed = (() => {
    if (lang === "fr") return href;
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
