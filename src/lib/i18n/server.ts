import "server-only";
import { cookies } from "next/headers";
import { messages, type Lang } from "@/lib/i18n/messages";

const COOKIE_KEY = "eps_lang";
const DEFAULT_LANG: Lang = "fr";

function getNestedValue(
  source: Record<string, unknown>,
  key: string,
): string | null {
  const parts = key.split(".");
  let value: unknown = source;

  for (const part of parts) {
    if (typeof value !== "object" || value === null) {
      return null;
    }

    value = (value as Record<string, unknown>)[part];
  }

  return typeof value === "string" ? value : null;
}

function isValidLang(value: string): value is Lang {
  return value === "fr" || value === "en" || value === "es";
}

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
