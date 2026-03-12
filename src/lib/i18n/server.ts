import "server-only";
import { cookies } from "next/headers";
import { messages, type Lang } from "@/lib/i18n/messages";

const COOKIE_KEY = "eps_lang";
const DEFAULT_LANG: Lang = "fr";

import { getNestedValue } from "@/lib/i18n/utils";

function isValidLang(value: string): value is Lang {
  return value === "fr" || value === "en" || value === "es";
}

/**
 * Read the user's language from the cookie in a Server Component.
 * RSC cannot use React hooks, so useI18n() is unavailable — this
 * reads the eps_lang cookie directly via next/headers instead.
 */
export async function getServerLang(): Promise<Lang> {
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
