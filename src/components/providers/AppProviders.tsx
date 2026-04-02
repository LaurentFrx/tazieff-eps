"use client";

import { useEffect } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { I18nProvider, type Lang } from "@/lib/i18n/I18nProvider";
import { AuthProvider } from "@/lib/supabase/AuthProvider";
import { DevServiceWorkerCleanup } from "@/components/DevServiceWorkerCleanup";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { TimerProvider } from "@/contexts/TimerContext";

type ThemePreference = "system" | "light" | "dark";

type AppProvidersProps = {
  children: React.ReactNode;
  initialLang: Lang;
  initialTheme: ThemePreference;
};

const THEME_STORAGE_KEY = "eps_theme";
const THEME_COOKIE_KEY = "eps_theme";
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

function LangSync({ lang }: { lang: Lang }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}

function ThemeSync({ initialTheme }: { initialTheme: ThemePreference }) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    if (!theme) {
      setTheme(initialTheme);
    }
  }, [initialTheme, setTheme, theme]);

  useEffect(() => {
    if (typeof window === "undefined" || !theme) {
      return;
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.cookie = `${THEME_COOKIE_KEY}=${theme}; Path=/; Max-Age=${ONE_YEAR_IN_SECONDS}; SameSite=Lax; Secure`;
  }, [theme]);

  useEffect(() => {
    if (!resolvedTheme || typeof document === "undefined") {
      return;
    }

    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  return null;
}

export function AppProviders({
  children,
  initialLang,
  initialTheme,
}: AppProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={initialTheme}
      enableSystem
      enableColorScheme={false}
      storageKey={THEME_STORAGE_KEY}
    >
      <I18nProvider initialLang={initialLang}>
        <AuthProvider>
          <TimerProvider>
          {children}
          </TimerProvider>
          <LangSync lang={initialLang} />
          <ThemeSync initialTheme={initialTheme} />
          <DevServiceWorkerCleanup />
          <ServiceWorkerRegister />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
