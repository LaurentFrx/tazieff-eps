import "server-only";
import { messages, type Lang } from "@/lib/i18n/messages";

const COOKIE_KEY = "eps_lang";
const DEFAULT_LANG: Lang = "fr";

import { getNestedValue } from "@/lib/i18n/utils";

function isValidLang(value: string): value is Lang {
  return value === "fr" || value === "en" || value === "es";
}

/**
 * Read the user's language.
 *
 * When a `locale` parameter is provided (from the [locale] route segment),
 * it is used directly — no cookie read, so the page can be statically
 * generated.
 *
 * When called without argument (legacy/fallback), falls back to reading
 * the eps_lang cookie via next/headers, which forces dynamic rendering.
 * The cookies import is dynamic to avoid tainting the module.
 */
export async function getServerLang(locale?: string): Promise<Lang> {
  // If locale is explicitly provided, validate and use it directly
  if (locale !== undefined) {
    if (isValidLang(locale)) {
      return locale;
    }
    return DEFAULT_LANG;
  }

  // Legacy fallback: dynamic import to avoid tainting static pages
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_KEY)?.value;
  if (raw && isValidLang(raw)) {
    return raw;
  }
  return DEFAULT_LANG;
}

export function getServerT(lang: Lang) {
  return (key: string): string => {
    const value = getNestedValue(messages[lang], key);
    return value ?? key;
  };
}
