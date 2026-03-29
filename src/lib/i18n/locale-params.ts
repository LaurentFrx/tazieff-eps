import type { Lang } from "@/lib/i18n/messages";

export type LocaleParams = { locale: string };

export const ALL_LOCALES: Lang[] = ["fr", "en", "es"];

export function generateLocaleStaticParams() {
  return ALL_LOCALES.map((locale) => ({ locale }));
}
