"use client";

import { useEffect } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { I18nProvider, type Lang } from "@/lib/i18n/I18nProvider";
import { DevServiceWorkerCleanup } from "@/components/DevServiceWorkerCleanup";

type ThemePreference = "system" | "light" | "dark";

type AppProvidersProps = {
  children: React.ReactNode;
  initialLang: Lang;
  initialTheme: ThemePreference;
};

const THEME_STORAGE_KEY = "eps_theme";
const THEME_COOKIE_KEY = "eps_theme";
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

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
    document.cookie = `${THEME_COOKIE_KEY}=${theme}; Path=/; Max-Age=${ONE_YEAR_IN_SECONDS}; SameSite=Lax`;
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
      storageKey={THEME_STORAGE_KEY}
    >
      <I18nProvider initialLang={initialLang}>
        {children}
        <ThemeSync initialTheme={initialTheme} />
        <DevServiceWorkerCleanup />
      </I18nProvider>
    </ThemeProvider>
  );
}
