"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { messages, type Lang } from "@/lib/i18n/messages";
import { buildLocalePath } from "@/lib/i18n/locale-path";

export type { Lang };

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
};

type I18nProviderProps = {
  children: React.ReactNode;
  initialLang?: Lang;
};

const STORAGE_KEY = "eps_lang";
const COOKIE_KEY = "eps_lang";
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;
const DEFAULT_LANG: Lang = "fr";

const I18nContext = createContext<I18nContextValue | null>(null);

import { getNestedValue } from "@/lib/i18n/utils";

export function I18nProvider({
  children,
  initialLang = DEFAULT_LANG,
}: I18nProviderProps) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const router = useRouter();
  const pathname = usePathname();

  const setLang = useCallback((nextLang: Lang) => {
    setLangState(nextLang);
    const newPath = buildLocalePath(pathname ?? "/", nextLang);
    router.push(newPath);
  }, [pathname, router]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, lang);
    document.cookie = `${COOKIE_KEY}=${lang}; Path=/; Max-Age=${ONE_YEAR_IN_SECONDS}; SameSite=Lax; Secure`;
    document.documentElement.lang = lang;
  }, [lang]);

  const translate = useCallback(
    (key: string) => {
      const value = getNestedValue(messages[lang], key);
      return value ?? key;
    },
    [lang],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      t: translate,
    }),
    [lang, setLang, translate],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}
