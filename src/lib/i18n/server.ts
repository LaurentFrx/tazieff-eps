import "server-only";
import { messages, type Lang } from "@/lib/i18n/messages";

import { getNestedValue } from "@/lib/i18n/utils";

function isValidLang(value: string): value is Lang {
  return value === "fr" || value === "en" || value === "es";
}

/**
 * Validate and return the locale from URL params.
 * No cookies() — keeping everything static-friendly.
 */
export function getServerLang(locale: string): Lang {
  if (isValidLang(locale)) {
    return locale;
  }
  return "fr";
}

export function getServerT(lang: Lang) {
  return (key: string): string => {
    const value = getNestedValue(messages[lang], key);
    return value ?? key;
  };
}
