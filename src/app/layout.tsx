import type { Metadata } from "next";
import { Space_Grotesk, Sora } from "next/font/google";
import { cookies } from "next/headers";
import { AppHeader } from "@/components/AppHeader";
import { InstallPwaBanner } from "@/components/InstallPwaBanner";
import { TabNav } from "@/components/TabNav";
import { AppProviders } from "@/components/providers/AppProviders";
import type { Lang } from "@/lib/i18n/messages";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Tazieff EPS",
  description: "Guide mobile avec navigation a quatre onglets.",
};

type ThemePreference = "system" | "light" | "dark";

const LANG_COOKIE = "eps_lang";
const THEME_COOKIE = "eps_theme";

function getInitialLang(value?: string): Lang {
  return value === "en" ? "en" : "fr";
}

function getInitialTheme(value?: string): ThemePreference {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }

  return "system";
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialLang = getInitialLang(cookieStore.get(LANG_COOKIE)?.value);
  const initialTheme = getInitialTheme(cookieStore.get(THEME_COOKIE)?.value);
  const htmlClassName = initialTheme === "dark" ? "dark" : undefined;
  const dataTheme = initialTheme !== "system" ? initialTheme : undefined;

  return (
    <html
      lang={initialLang}
      data-theme={dataTheme}
      className={htmlClassName}
      suppressHydrationWarning
    >
      <body className={`${spaceGrotesk.variable} ${sora.variable}`}>
        <AppProviders initialLang={initialLang} initialTheme={initialTheme}>
          <div className="app-shell">
            <AppHeader />
            <main className="app-main">{children}</main>
          </div>
          <TabNav />
          <InstallPwaBanner />
        </AppProviders>
      </body>
    </html>
  );
}
